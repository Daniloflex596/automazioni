"""Data augmentation per espandere un dataset minuscolo.

Con pochissimi difetti reali, l'augmentation è essenziale per dare al
classificatore abbastanza varianti. Usa `albumentations` se disponibile,
altrimenti un fallback equivalente basato su OpenCV/numpy (così funziona anche
senza dipendenze extra).
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from .config import Config, load_config

try:  # albumentations è opzionale
    import albumentations as A

    _HAS_ALBUMENTATIONS = True
except Exception:  # pragma: no cover - dipende dall'ambiente
    _HAS_ALBUMENTATIONS = False


def _albumentations_pipeline() -> "A.Compose":
    return A.Compose([
        A.RandomRotate90(p=0.5),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.6),
        A.GaussianBlur(blur_limit=(3, 5), p=0.2),
        A.GaussNoise(p=0.2),
        A.ElasticTransform(alpha=20, sigma=4, p=0.2),
        A.CoarseDropout(max_holes=4, max_height=12, max_width=12, p=0.2),
    ])


def _opencv_augment(img: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Augmentation di base senza dipendenze esterne."""
    out = img.copy()
    if rng.random() < 0.5:
        out = cv2.flip(out, 1)
    if rng.random() < 0.5:
        out = cv2.flip(out, 0)
    k = int(rng.integers(0, 4))
    if k:
        out = np.rot90(out, k).copy()
    # Luminosità/contrasto
    alpha = float(rng.uniform(0.8, 1.2))   # contrasto
    beta = float(rng.uniform(-20, 20))     # luminosità
    out = cv2.convertScaleAbs(out, alpha=alpha, beta=beta)
    if rng.random() < 0.2:
        out = cv2.GaussianBlur(out, (3, 3), 0)
    if rng.random() < 0.2:
        noise = rng.normal(0, 8, out.shape).astype(np.float32)
        out = np.clip(out.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    return out


def augment_image(img: np.ndarray, n: int, *, seed: int = 0) -> list[np.ndarray]:
    """Genera `n` varianti aumentate di una singola immagine."""
    variants: list[np.ndarray] = []
    if _HAS_ALBUMENTATIONS:
        pipeline = _albumentations_pipeline()
        for _ in range(n):
            variants.append(pipeline(image=img)["image"])
    else:
        rng = np.random.default_rng(seed)
        for _ in range(n):
            variants.append(_opencv_augment(img, rng))
    return variants


def augment_dir(src_dir: Path, dst_dir: Path, n_per_image: int,
                *, seed: int = 0) -> int:
    """Aumenta tutte le immagini di una cartella, salvando in `dst_dir`.

    Ritorna il numero di file generati. Le immagini originali vengono copiate.
    """
    dst_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for i, img_path in enumerate(sorted(src_dir.glob("*.png"))):
        img = cv2.imread(str(img_path), cv2.IMREAD_COLOR)
        if img is None:
            continue
        cv2.imwrite(str(dst_dir / img_path.name), img)
        count += 1
        for j, var in enumerate(augment_image(img, n_per_image, seed=seed + i)):
            cv2.imwrite(str(dst_dir / f"{img_path.stem}_aug{j:02d}.png"), var)
            count += 1
    return count


def augment_defects(config: Config | None = None, n_per_image: int = 12) -> dict[str, int]:
    """Aumenta ogni classe di difetto in data/processed/augmented/<classe>."""
    cfg = config or load_config()
    defects_dir = cfg.path("paths", "defects_dir")
    out_root = cfg.path("paths", "processed_dir") / "augmented"
    counts: dict[str, int] = {}
    for cls in cfg.defect_classes:
        src = defects_dir / cls
        if not src.exists():
            continue
        counts[cls] = augment_dir(src, out_root / cls, n_per_image)
    return counts


if __name__ == "__main__":  # pragma: no cover
    backend = "albumentations" if _HAS_ALBUMENTATIONS else "opencv (fallback)"
    print(f"Augmentation backend: {backend}")
    result = augment_defects()
    for cls, n in result.items():
        print(f"  {cls}: {n} immagini totali")
