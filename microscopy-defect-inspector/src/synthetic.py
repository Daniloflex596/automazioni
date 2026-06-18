"""Generatore di immagini sintetiche tipo microscopio.

Serve a sviluppare e collaudare l'intera pipeline SENZA le foto reali:
- immagini "buone": texture granulosa con illuminazione non uniforme;
- immagini "difettose": cricca (linea sottile), graffio (striatura), buco
  (macchia scura tondeggiante);
- una quota di immagini difettose riceve un cerchio blu + frecce, come le
  annotazioni reali fatte a mano in azienda.

Quando arriveranno le foto vere basterà NON usare questo modulo e mettere le
immagini nelle cartelle data/good, data/defects/<classe>, data/annotated.
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from .config import Config, load_config

# Mappa nome-classe -> funzione che disegna il difetto.
# Le chiavi devono combaciare con `defect_classes` in config.yaml.


def _base_texture(size: int, rng: np.random.Generator) -> np.ndarray:
    """Crea una texture grigia granulosa con illuminazione non uniforme."""
    base = rng.normal(140, 18, size=(size, size)).astype(np.float32)
    base = cv2.GaussianBlur(base, (0, 0), sigmaX=1.2)

    # Grano fine (rumore ad alta frequenza) tipico del microscopio.
    grain = rng.normal(0, 8, size=(size, size)).astype(np.float32)
    base += grain

    # Gradiente di illuminazione (vignettatura/luce laterale).
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    cx, cy = rng.uniform(0.3, 0.7, size=2) * size
    radial = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    radial = radial / radial.max()
    base -= radial * rng.uniform(20, 45)

    img = np.clip(base, 0, 255).astype(np.uint8)
    return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)


def _draw_cricca(img: np.ndarray, rng: np.random.Generator) -> tuple[int, int, int, int]:
    """Cricca = linea sottile, netta e spezzata. Ritorna la bbox del difetto."""
    h, w = img.shape[:2]
    x, y = rng.integers(w // 4, 3 * w // 4, size=2)
    pts = [(int(x), int(y))]
    angle = rng.uniform(0, 2 * np.pi)
    for _ in range(rng.integers(5, 10)):
        angle += rng.uniform(-0.6, 0.6)
        step = rng.integers(15, 35)
        x += int(np.cos(angle) * step)
        y += int(np.sin(angle) * step)
        pts.append((int(np.clip(x, 0, w - 1)), int(np.clip(y, 0, h - 1))))
    pts_arr = np.array(pts, dtype=np.int32)
    cv2.polylines(img, [pts_arr], False, (40, 40, 40), thickness=1, lineType=cv2.LINE_AA)
    xs, ys = pts_arr[:, 0], pts_arr[:, 1]
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def _draw_graffio(img: np.ndarray, rng: np.random.Generator) -> tuple[int, int, int, int]:
    """Graffio = striatura dritta, allungata, leggermente più chiara."""
    h, w = img.shape[:2]
    x1, y1 = rng.integers(w // 5, 4 * w // 5, size=2)
    angle = rng.uniform(0, np.pi)
    length = rng.integers(int(0.3 * w), int(0.6 * w))
    x2 = int(np.clip(x1 + np.cos(angle) * length, 0, w - 1))
    y2 = int(np.clip(y1 + np.sin(angle) * length, 0, h - 1))
    color = int(rng.integers(170, 210))
    cv2.line(img, (int(x1), int(y1)), (x2, y2), (color, color, color),
             thickness=int(rng.integers(2, 4)), lineType=cv2.LINE_AA)
    return min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2)


def _draw_buco(img: np.ndarray, rng: np.random.Generator) -> tuple[int, int, int, int]:
    """Buco/pit = macchia scura tondeggiante con bordo sfumato."""
    h, w = img.shape[:2]
    cx, cy = rng.integers(w // 5, 4 * w // 5, size=2)
    radius = int(rng.integers(10, 28))
    overlay = img.copy()
    cv2.circle(overlay, (int(cx), int(cy)), radius, (25, 25, 25), -1, lineType=cv2.LINE_AA)
    overlay = cv2.GaussianBlur(overlay, (0, 0), sigmaX=radius / 4)
    mask = np.zeros((h, w), np.float32)
    cv2.circle(mask, (int(cx), int(cy)), radius + 4, 1.0, -1)
    mask = cv2.GaussianBlur(mask, (0, 0), sigmaX=radius / 3)[..., None]
    img[:] = (overlay * mask + img * (1 - mask)).astype(np.uint8)
    return int(cx - radius), int(cy - radius), int(cx + radius), int(cy + radius)


_DRAWERS = {
    "cricca": _draw_cricca,
    "graffio": _draw_graffio,
    "buco": _draw_buco,
}


def _add_blue_annotation(img: np.ndarray, bbox: tuple[int, int, int, int]) -> None:
    """Aggiunge cerchio blu + frecce attorno alla bbox, come l'annotatore umano."""
    x0, y0, x1, y1 = bbox
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    r = int(max(x1 - x0, y1 - y0) / 2) + 18
    blue = (255, 30, 0)  # BGR -> blu acceso
    cv2.circle(img, (cx, cy), r, blue, thickness=3, lineType=cv2.LINE_AA)
    h, w = img.shape[:2]
    # Due frecce che puntano verso il cerchio.
    for dx, dy in [(-1, -1), (1, 1)]:
        start = (int(np.clip(cx + dx * (r + 60), 0, w - 1)),
                 int(np.clip(cy + dy * (r + 60), 0, h - 1)))
        end = (int(cx + dx * (r + 8)), int(cy + dy * (r + 8)))
        cv2.arrowedLine(img, start, end, blue, thickness=3,
                        line_type=cv2.LINE_AA, tipLength=0.3)


def generate_dataset(config: Config | None = None, *, clean: bool = True) -> dict[str, int]:
    """Popola data/good, data/defects/<classe>, data/annotated con immagini finte.

    Ritorna un conteggio dei file creati per categoria.
    """
    cfg = config or load_config()
    s = cfg.get("synthetic", default={})
    size = int(s.get("image_size", 512))
    n_good = int(s.get("n_good", 12))
    n_per_defect = int(s.get("n_per_defect", 8))
    annotated_fraction = float(s.get("annotated_fraction", 0.4))
    rng = np.random.default_rng(int(s.get("seed", 42)))

    good_dir = cfg.path("paths", "good_dir")
    defects_dir = cfg.path("paths", "defects_dir")
    annotated_dir = cfg.path("paths", "annotated_dir")
    for d in (good_dir, defects_dir, annotated_dir):
        d.mkdir(parents=True, exist_ok=True)

    if clean:
        for d in (good_dir, annotated_dir):
            for f in d.glob("*.png"):
                f.unlink()

    counts = {"good": 0, "annotated": 0}

    for i in range(n_good):
        img = _base_texture(size, rng)
        cv2.imwrite(str(good_dir / f"good_{i:03d}.png"), img)
        counts["good"] += 1

    classes = [c for c in cfg.defect_classes if c in _DRAWERS]
    for cls in classes:
        cls_dir = defects_dir / cls
        cls_dir.mkdir(parents=True, exist_ok=True)
        if clean:
            for f in cls_dir.glob("*.png"):
                f.unlink()
        counts[cls] = 0
        for i in range(n_per_defect):
            img = _base_texture(size, rng)
            bbox = _DRAWERS[cls](img, rng)
            cv2.imwrite(str(cls_dir / f"{cls}_{i:03d}.png"), img)
            counts[cls] += 1

            # Una quota riceve anche la versione annotata (cerchio blu).
            if rng.random() < annotated_fraction:
                annotated = img.copy()
                _add_blue_annotation(annotated, bbox)
                cv2.imwrite(str(annotated_dir / f"{cls}_{i:03d}_annot.png"), annotated)
                counts["annotated"] += 1

    return counts


if __name__ == "__main__":  # pragma: no cover - utility da riga di comando
    result = generate_dataset()
    print("Dataset sintetico generato:")
    for key, value in result.items():
        print(f"  {key}: {value}")
