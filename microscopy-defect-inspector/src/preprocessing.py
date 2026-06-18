"""Preprocessing delle immagini al microscopio.

Normalizza illuminazione e contrasto per rendere i difetti più visibili e
coerenti tra scatti diversi. La funzione `preprocess` è usata sia dal training
sia dall'inferenza, così le immagini sono trattate allo stesso modo ovunque.
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from .config import Config, load_config


def load_image(path: str | Path) -> np.ndarray:
    """Carica un'immagine come BGR uint8. Solleva FileNotFoundError se manca."""
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(f"Impossibile leggere l'immagine: {path}")
    return img


def resize_keep_aspect(img: np.ndarray, target_long_side: int) -> np.ndarray:
    """Ridimensiona mantenendo le proporzioni; il lato lungo = target."""
    h, w = img.shape[:2]
    scale = target_long_side / max(h, w)
    if scale == 1.0:
        return img
    new_size = (int(round(w * scale)), int(round(h * scale)))
    interp = cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC
    return cv2.resize(img, new_size, interpolation=interp)


def correct_illumination(gray: np.ndarray) -> np.ndarray:
    """Rimuove il gradiente di illuminazione dividendo per uno sfondo sfocato."""
    background = cv2.GaussianBlur(gray, (0, 0), sigmaX=max(gray.shape) / 16)
    background = np.where(background == 0, 1, background)
    norm = gray.astype(np.float32) / background.astype(np.float32)
    norm = cv2.normalize(norm, None, 0, 255, cv2.NORM_MINMAX)
    return norm.astype(np.uint8)


def apply_clahe(gray: np.ndarray, clip: float, grid: int) -> np.ndarray:
    """Equalizzazione adattiva del contrasto (CLAHE)."""
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(grid, grid))
    return clahe.apply(gray)


def preprocess(
    img: np.ndarray,
    config: Config | None = None,
    *,
    to_gray: bool = False,
) -> np.ndarray:
    """Pipeline di preprocessing completa.

    Ritorna un'immagine BGR (default) o grayscale (`to_gray=True`), pronta per
    visualizzazione, anomaly detection o estrazione embedding.
    """
    cfg = config or load_config()
    p = cfg.get("preprocess", default={})

    img = resize_keep_aspect(img, int(p.get("target_size", 512)))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    if p.get("illumination_correction", True):
        gray = correct_illumination(gray)
    if p.get("denoise", True):
        gray = cv2.fastNlMeansDenoising(gray, None, h=7, templateWindowSize=7,
                                        searchWindowSize=21)
    if p.get("use_clahe", True):
        gray = apply_clahe(gray, float(p.get("clahe_clip", 2.0)),
                           int(p.get("clahe_grid", 8)))

    if to_gray:
        return gray
    return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)


def preprocess_file(path: str | Path, config: Config | None = None,
                    *, to_gray: bool = False) -> np.ndarray:
    """Comodità: carica da file e applica `preprocess`."""
    return preprocess(load_image(path), config, to_gray=to_gray)


if __name__ == "__main__":  # pragma: no cover
    import sys

    cfg = load_config()
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else next(
        cfg.path("paths", "good_dir").glob("*.png"))
    out = preprocess_file(src, cfg)
    dest = cfg.path("paths", "processed_dir") / f"preview_{Path(src).name}"
    dest.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(dest), out)
    print(f"Preprocessing salvato in: {dest}")
