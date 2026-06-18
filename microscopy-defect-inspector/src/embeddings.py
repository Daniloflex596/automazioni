"""Estrazione di feature/embedding dalle immagini.

Strategia a due livelli, per funzionare in qualsiasi ambiente:
- se PyTorch + torchvision sono disponibili, usa un backbone preaddestrato
  (default resnet18) — è l'approccio "vero", usato anche da PatchCore/DINOv2;
- altrimenti usa un fallback classico (statistiche di intensità, istogramma,
  gradienti/HOG-like) così che anomaly detection e classificatore restino
  comunque funzionanti per sviluppo e test.

Due funzioni principali:
- `embed_image(img)`  -> vettore globale (per classificare il tipo di difetto);
- `feature_map(img)`  -> griglia di patch-embedding (per la memory bank anomaly).
"""
from __future__ import annotations

import cv2
import numpy as np

from .config import Config, load_config

try:  # backend deep, opzionale
    import torch
    from torchvision import models as tv_models

    _HAS_TORCH = True
except Exception:  # pragma: no cover - dipende dall'ambiente
    _HAS_TORCH = False


_IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class TorchBackbone:
    """Backbone torchvision che espone feature map intermedie (CPU)."""

    def __init__(self, name: str = "resnet18"):
        weights = "DEFAULT"
        ctor = getattr(tv_models, name)
        self.model = ctor(weights=weights)
        self.model.eval()
        for p in self.model.parameters():
            p.requires_grad_(False)
        # Suddivisione dei layer per estrarre le mappe intermedie (stile ResNet).
        self.stem = torch.nn.Sequential(
            self.model.conv1, self.model.bn1, self.model.relu, self.model.maxpool)
        self.blocks = {
            "layer1": self.model.layer1,
            "layer2": self.model.layer2,
            "layer3": self.model.layer3,
            "layer4": self.model.layer4,
        }

    def _to_tensor(self, img_bgr: np.ndarray, size: int = 224) -> "torch.Tensor":
        rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        rgb = cv2.resize(rgb, (size, size), interpolation=cv2.INTER_AREA)
        arr = rgb.astype(np.float32) / 255.0
        arr = (arr - _IMAGENET_MEAN) / _IMAGENET_STD
        tensor = torch.from_numpy(arr.transpose(2, 0, 1)).unsqueeze(0)
        return tensor

    def forward_layers(self, img_bgr: np.ndarray, layers: list[str]) -> dict[str, np.ndarray]:
        with torch.no_grad():
            x = self._to_tensor(img_bgr)
            x = self.stem(x)
            out: dict[str, np.ndarray] = {}
            for name in ["layer1", "layer2", "layer3", "layer4"]:
                x = self.blocks[name](x)
                if name in layers:
                    out[name] = x.squeeze(0).numpy()  # (C, H, W)
        return out

    def global_embedding(self, img_bgr: np.ndarray) -> np.ndarray:
        feats = self.forward_layers(img_bgr, ["layer4"])["layer4"]  # (C,H,W)
        return feats.mean(axis=(1, 2))  # global average pooling


def _classical_feature_map(img_bgr: np.ndarray, grid: int = 16) -> np.ndarray:
    """Feature per-patch senza deep learning: media, std e ampiezza gradiente."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    gray = cv2.resize(gray, (grid * 16, grid * 16), interpolation=cv2.INTER_AREA)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.sqrt(gx ** 2 + gy ** 2)
    ph, pw = gray.shape[0] // grid, gray.shape[1] // grid
    chans = []
    for src in (gray, mag):
        patches = src.reshape(grid, ph, grid, pw).transpose(0, 2, 1, 3)
        chans.append(patches.mean(axis=(2, 3)))
        chans.append(patches.std(axis=(2, 3)))
    # (grid, grid, C) -> (C, grid, grid)
    return np.stack(chans, axis=0)


def _classical_global(img_bgr: np.ndarray) -> np.ndarray:
    """Embedding globale classico: istogramma + statistiche + energia gradiente."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    hist = cv2.calcHist([gray], [0], None, [32], [0, 256]).flatten()
    hist = hist / (hist.sum() + 1e-6)
    g = gray.astype(np.float32) / 255.0
    gx = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.sqrt(gx ** 2 + gy ** 2)
    stats = np.array([g.mean(), g.std(), mag.mean(), mag.std(),
                      float((mag > 0.2).mean())], dtype=np.float32)
    return np.concatenate([hist.astype(np.float32), stats])


_BACKBONE_CACHE: dict[str, "TorchBackbone"] = {}


def _get_backbone(name: str) -> "TorchBackbone | None":
    if not _HAS_TORCH:
        return None
    if name not in _BACKBONE_CACHE:
        try:
            _BACKBONE_CACHE[name] = TorchBackbone(name)
        except Exception:  # pragma: no cover - es. nessun accesso ai pesi
            return None
    return _BACKBONE_CACHE[name]


def backend_name() -> str:
    """Ritorna 'torch' o 'classical' a seconda di cosa è disponibile/attivo."""
    return "torch" if _HAS_TORCH else "classical"


def embed_image(img_bgr: np.ndarray, config: Config | None = None) -> np.ndarray:
    """Embedding globale L2-normalizzato (per il classificatore di tipo)."""
    cfg = config or load_config()
    name = cfg.get("classifier", "backbone", default="resnet18")
    backbone = _get_backbone(name)
    vec = backbone.global_embedding(img_bgr) if backbone else _classical_global(img_bgr)
    norm = np.linalg.norm(vec) + 1e-8
    return (vec / norm).astype(np.float32)


def feature_map(img_bgr: np.ndarray, config: Config | None = None) -> np.ndarray:
    """Mappa di patch-embedding (C, H, W) per la memory bank di anomaly det."""
    cfg = config or load_config()
    name = cfg.get("anomaly", "backbone", default="resnet18")
    layers = list(cfg.get("anomaly", "layers", default=["layer2", "layer3"]))
    backbone = _get_backbone(name)
    if backbone is None:
        return _classical_feature_map(img_bgr)

    feats = backbone.forward_layers(img_bgr, layers)
    # Allinea tutte le mappe alla risoluzione della prima e concatena i canali.
    ref = feats[layers[0]]
    _, h, w = ref.shape
    aligned = []
    for name_ in layers:
        fm = feats[name_]
        c = fm.shape[0]
        t = torch.from_numpy(fm).unsqueeze(0)
        t = torch.nn.functional.interpolate(t, size=(h, w), mode="bilinear",
                                            align_corners=False)
        aligned.append(t.squeeze(0).numpy())
    return np.concatenate(aligned, axis=0)


def patches_from_map(fmap: np.ndarray) -> np.ndarray:
    """Trasforma (C, H, W) in (H*W, C): un vettore per posizione spaziale."""
    c, h, w = fmap.shape
    return fmap.reshape(c, h * w).T.copy()
