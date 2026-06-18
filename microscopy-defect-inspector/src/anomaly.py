"""Anomaly detection few-shot (stile PatchCore).

Idea: dalle immagini "buone" costruiamo una *memory bank* di patch-embedding che
descrive l'aspetto normale. Per una nuova immagine, ogni patch viene confrontata
con la più vicina nella memory bank: distanze grandi = zone anomale. Da qui
ricaviamo uno score globale (immagine difettosa sì/no) e una heatmap (dove).

Funziona con poche immagini buone (anche ~10), per questo è adatto al nostro caso.
Usa gli embedding di `embeddings.feature_map` (backbone torch o fallback classico).
La soglia di decisione viene calibrata sugli score delle immagini buone.
"""
from __future__ import annotations

import pickle
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from .config import Config, load_config
from .embeddings import backend_name, feature_map, patches_from_map
from .preprocessing import load_image, preprocess

MODEL_FILE = "anomaly_patchcore.pkl"


@dataclass
class AnomalyResult:
    score: float                  # score globale (max distanza patch)
    is_defect: bool               # score > soglia
    heatmap: np.ndarray           # mappa float [0,1] della dimensione dell'immagine
    bbox: tuple[int, int, int, int] | None  # regione più anomala


def _coreset_subsample(patches: np.ndarray, ratio: float, seed: int = 0) -> np.ndarray:
    """Sottocampiona la memory bank (greedy k-center approssimato/random)."""
    n = len(patches)
    k = max(1, int(n * ratio))
    if k >= n:
        return patches
    rng = np.random.default_rng(seed)
    # k-center greedy: parte casuale, aggiunge il punto più lontano dal set.
    selected = [int(rng.integers(n))]
    min_dist = np.linalg.norm(patches - patches[selected[0]], axis=1)
    for _ in range(k - 1):
        idx = int(np.argmax(min_dist))
        selected.append(idx)
        d = np.linalg.norm(patches - patches[idx], axis=1)
        min_dist = np.minimum(min_dist, d)
    return patches[np.array(selected)]


class PatchCore:
    """Memory bank di patch normali + scoring per nearest-neighbor."""

    def __init__(self, config: Config | None = None):
        self.cfg = config or load_config()
        self.memory: np.ndarray | None = None
        self.grid_hw: tuple[int, int] | None = None
        self.threshold: float | None = None
        self.backend: str = backend_name()

    # ---- training ----
    def fit(self, good_images: list[np.ndarray]) -> "PatchCore":
        if not good_images:
            raise ValueError("Servono immagini 'buone' per addestrare l'anomaly detector.")
        ratio = float(self.cfg.get("anomaly", "coreset_ratio", default=0.25))

        all_patches = []
        scores = []
        for img in good_images:
            fmap = feature_map(img, self.cfg)
            self.grid_hw = (fmap.shape[1], fmap.shape[2])
            all_patches.append(patches_from_map(fmap))
        bank = np.concatenate(all_patches, axis=0)
        self.memory = _coreset_subsample(bank, ratio)

        # Calibrazione soglia: score delle immagini buone (devono stare sotto).
        for img in good_images:
            scores.append(self._raw_score(img)[0])
        scores = np.array(scores)
        sigma = float(self.cfg.get("anomaly", "threshold_sigma", default=3.0))
        configured = self.cfg.get("anomaly", "score_threshold", default=None)
        self.threshold = float(configured) if configured is not None else float(
            scores.mean() + sigma * (scores.std() + 1e-6))
        return self

    # ---- scoring ----
    def _patch_distances(self, img: np.ndarray) -> tuple[np.ndarray, tuple[int, int]]:
        assert self.memory is not None, "Modello non addestrato."
        fmap = feature_map(img, self.cfg)
        h, w = fmap.shape[1], fmap.shape[2]
        patches = patches_from_map(fmap)
        # distanza euclidea di ogni patch al vicino più prossimo nella memory bank
        # (calcolo a blocchi per limitare la memoria)
        dists = np.empty(len(patches), dtype=np.float32)
        step = 1024
        for i in range(0, len(patches), step):
            chunk = patches[i:i + step]
            d = np.linalg.norm(chunk[:, None, :] - self.memory[None, :, :], axis=2)
            dists[i:i + step] = d.min(axis=1)
        return dists, (h, w)

    def _raw_score(self, img: np.ndarray) -> tuple[float, np.ndarray, tuple[int, int]]:
        dists, (h, w) = self._patch_distances(img)
        score = float(dists.max())
        return score, dists.reshape(h, w), (h, w)

    def predict(self, img: np.ndarray) -> AnomalyResult:
        score, grid, _ = self._raw_score(img)
        target = img.shape[:2]
        heat = cv2.resize(grid, (target[1], target[0]), interpolation=cv2.INTER_CUBIC)
        heat = cv2.GaussianBlur(heat, (0, 0), sigmaX=max(target) / 64)
        heat_norm = cv2.normalize(heat, None, 0, 1, cv2.NORM_MINMAX)

        threshold = self.threshold if self.threshold is not None else score + 1
        is_defect = score > threshold
        bbox = self._bbox_from_heat(heat_norm) if is_defect else None
        return AnomalyResult(score=score, is_defect=is_defect,
                             heatmap=heat_norm.astype(np.float32), bbox=bbox)

    @staticmethod
    def _bbox_from_heat(heat: np.ndarray, rel: float = 0.6) -> tuple[int, int, int, int] | None:
        mask = (heat >= rel).astype(np.uint8) * 255
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None
        x, y, w, h = cv2.boundingRect(max(contours, key=cv2.contourArea))
        return (x, y, x + w, y + h)

    # ---- persistenza ----
    def save(self, path: str | Path | None = None) -> Path:
        path = Path(path) if path else self.cfg.path("paths", "models_dir") / MODEL_FILE
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as fh:
            pickle.dump({"memory": self.memory, "grid_hw": self.grid_hw,
                         "threshold": self.threshold, "backend": self.backend}, fh)
        return path

    @classmethod
    def load(cls, config: Config | None = None, path: str | Path | None = None) -> "PatchCore":
        cfg = config or load_config()
        path = Path(path) if path else cfg.path("paths", "models_dir") / MODEL_FILE
        obj = cls(cfg)
        with open(path, "rb") as fh:
            state = pickle.load(fh)
        obj.memory = state["memory"]
        obj.grid_hw = state["grid_hw"]
        obj.threshold = state["threshold"]
        obj.backend = state.get("backend", backend_name())
        return obj


def train_from_good(config: Config | None = None) -> PatchCore:
    """Addestra l'anomaly detector dalle immagini in data/good (con preprocess)."""
    cfg = config or load_config()
    good_dir = cfg.path("paths", "good_dir")
    images = [preprocess(load_image(p), cfg) for p in sorted(good_dir.glob("*.png"))]
    model = PatchCore(cfg).fit(images)
    model.save()
    return model


if __name__ == "__main__":  # pragma: no cover
    m = train_from_good()
    print(f"Anomaly detector addestrato (backend={m.backend}, soglia={m.threshold:.4f}).")
    print(f"Memory bank: {0 if m.memory is None else len(m.memory)} patch.")
