"""Estrazione delle annotazioni manuali (cerchio blu + frecce).

In azienda alcune foto difettose sono marcate a mano con un cerchio blu e delle
frecce che indicano la zona del difetto. Questi marchi:
- NON devono entrare come pixel nel training (il modello imparerebbe "blu =
  difetto"): per questo offriamo l'inpainting che li rimuove;
- SONO invece preziosi per sapere DOVE si trova il difetto: isolando il blu in
  spazio HSV ricaviamo la bounding box e quindi il ritaglio del difetto, da
  usare come etichetta di posizione e come campione per il classificatore.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from .config import Config, load_config
from .preprocessing import load_image

BBox = tuple[int, int, int, int]  # (x0, y0, x1, y1)


@dataclass
class Annotation:
    """Risultato dell'estrazione su una singola immagine annotata."""

    bbox: BBox | None             # area del difetto indicata dal cerchio blu
    mask: np.ndarray              # maschera binaria dei marchi blu
    found: bool                   # True se è stato trovato un marchio valido


def blue_mask(img_bgr: np.ndarray, cfg: Config) -> np.ndarray:
    """Maschera binaria dei pixel blu (cerchio/frecce) in spazio HSV."""
    a = cfg.get("annotations", default={})
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    lower = np.array([int(a.get("hue_min", 90)), int(a.get("sat_min", 80)),
                      int(a.get("val_min", 50))], dtype=np.uint8)
    upper = np.array([int(a.get("hue_max", 130)), 255, 255], dtype=np.uint8)
    mask = cv2.inRange(hsv, lower, upper)
    # Chiude i buchi e collega cerchio + frecce.
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    return mask


def extract_annotation(img_bgr: np.ndarray, config: Config | None = None) -> Annotation:
    """Trova il marchio blu e ne ricava la bounding box del difetto.

    La bbox è quella del cerchio (il contorno con area maggiore). Le frecce
    vengono ignorate ai fini della bbox ma restano nella maschera per l'inpaint.
    """
    cfg = config or load_config()
    a = cfg.get("annotations", default={})
    mask = blue_mask(img_bgr, cfg)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    valid = [c for c in contours if cv2.contourArea(c) >= float(a.get("min_area", 150))]
    if not valid:
        return Annotation(bbox=None, mask=mask, found=False)

    # Il cerchio è il contorno con bounding box più "quadrata" e grande;
    # in pratica prendiamo quello di area massima.
    biggest = max(valid, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(biggest)
    return Annotation(bbox=(x, y, x + w, y + h), mask=mask, found=True)


def remove_marks(img_bgr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Rimuove i marchi blu tramite inpainting, restituendo la versione pulita."""
    dilated = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    return cv2.inpaint(img_bgr, dilated, inpaintRadius=3, flags=cv2.INPAINT_TELEA)


def crop_defect(img_bgr: np.ndarray, bbox: BBox, *, pad: int = 6,
                clean_mask: np.ndarray | None = None) -> np.ndarray:
    """Ritaglia la regione del difetto. Se `clean_mask` è dato, rimuove i marchi."""
    source = remove_marks(img_bgr, clean_mask) if clean_mask is not None else img_bgr
    h, w = source.shape[:2]
    x0, y0, x1, y1 = bbox
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(w, x1 + pad), min(h, y1 + pad)
    return source[y0:y1, x0:x1].copy()


def process_annotated_dir(config: Config | None = None) -> list[dict]:
    """Elabora tutte le immagini in data/annotated.

    Per ognuna: estrae bbox, salva il crop pulito (senza marchi) in
    data/processed/crops/<classe> deducendo la classe dal nome file (prefisso
    prima di '_'). Ritorna un report con i risultati.
    """
    cfg = config or load_config()
    annotated_dir = cfg.path("paths", "annotated_dir")
    crops_root = cfg.path("paths", "processed_dir") / "crops"
    results: list[dict] = []

    for img_path in sorted(annotated_dir.glob("*.png")):
        img = load_image(img_path)
        ann = extract_annotation(img, cfg)
        entry = {"file": img_path.name, "found": ann.found, "bbox": ann.bbox}
        if ann.found and ann.bbox is not None:
            cls = img_path.stem.split("_")[0]
            out_dir = crops_root / cls
            out_dir.mkdir(parents=True, exist_ok=True)
            clean = ann.mask if cfg.get("annotations", "inpaint", default=True) else None
            crop = crop_defect(img, ann.bbox, clean_mask=clean)
            out_path = out_dir / f"{img_path.stem}_crop.png"
            cv2.imwrite(str(out_path), crop)
            entry["crop"] = str(out_path.relative_to(cfg.root))
        results.append(entry)
    return results


if __name__ == "__main__":  # pragma: no cover
    report = process_annotated_dir()
    found = sum(1 for r in report if r["found"])
    print(f"Annotazioni elaborate: {len(report)} immagini, {found} con difetto trovato.")
    for r in report:
        print(f"  {r['file']}: found={r['found']} bbox={r['bbox']}")
