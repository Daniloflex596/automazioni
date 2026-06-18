"""Generazione del referto visivo e testuale dell'ispezione."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

BBox = tuple[int, int, int, int]


@dataclass
class Report:
    overlay: np.ndarray           # immagine annotata (BGR)
    text: str                     # referto testuale
    verdict: str                  # "OK" oppure "DIFETTO"


def heatmap_overlay(img_bgr: np.ndarray, heat: np.ndarray, alpha: float = 0.45) -> np.ndarray:
    """Sovrappone la heatmap (float [0,1]) all'immagine."""
    heat_u8 = np.clip(heat * 255, 0, 255).astype(np.uint8)
    colored = cv2.applyColorMap(heat_u8, cv2.COLORMAP_JET)
    if colored.shape[:2] != img_bgr.shape[:2]:
        colored = cv2.resize(colored, (img_bgr.shape[1], img_bgr.shape[0]))
    return cv2.addWeighted(colored, alpha, img_bgr, 1 - alpha, 0)


def draw_box(img_bgr: np.ndarray, bbox: BBox, label: str,
             color: tuple[int, int, int] = (0, 0, 255)) -> np.ndarray:
    out = img_bgr.copy()
    x0, y0, x1, y1 = bbox
    cv2.rectangle(out, (x0, y0), (x1, y1), color, 2)
    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
    ytop = max(0, y0 - th - 6)
    cv2.rectangle(out, (x0, ytop), (x0 + tw + 6, ytop + th + 6), color, -1)
    cv2.putText(out, label, (x0 + 3, ytop + th + 1), cv2.FONT_HERSHEY_SIMPLEX,
                0.6, (255, 255, 255), 2, cv2.LINE_AA)
    return out


def build_report(
    original: np.ndarray,
    *,
    is_defect: bool,
    anomaly_score: float,
    threshold: float,
    defect_type: str | None,
    type_confidence: float | None,
    heatmap: np.ndarray | None,
    bbox: BBox | None,
) -> Report:
    """Compone overlay + testo del referto a partire dai risultati della pipeline."""
    overlay = original.copy()
    if heatmap is not None:
        overlay = heatmap_overlay(overlay, heatmap)
    if is_defect and bbox is not None:
        label = defect_type or "difetto"
        if type_confidence is not None:
            label = f"{label} {type_confidence * 100:.0f}%"
        overlay = draw_box(overlay, bbox, label)

    verdict = "DIFETTO" if is_defect else "OK"
    lines = [
        "=== REFERTO ISPEZIONE ===",
        f"Esito ispezione generale: {'DIFETTO RILEVATO' if is_defect else 'NESSUN DIFETTO'}",
        f"Anomaly score: {anomaly_score:.4f} (soglia: {threshold:.4f})",
    ]
    if is_defect:
        lines.append(f"Tipo di difetto: {defect_type or 'non determinato'}")
        if type_confidence is not None:
            lines.append(f"Confidenza tipo: {type_confidence * 100:.1f}%")
        if bbox is not None:
            x0, y0, x1, y1 = bbox
            lines.append(f"Posizione (bbox): ({x0},{y0})-({x1},{y1})")
            lines.append(f"Dimensione stimata: {x1 - x0} x {y1 - y0} px")
    else:
        lines.append("Il pezzo risulta conforme entro la soglia configurata.")
    return Report(overlay=overlay, text="\n".join(lines), verdict=verdict)


def save_report(report: Report, out_dir: Path, name: str) -> dict[str, str]:
    """Salva overlay PNG + referto TXT in `out_dir`. Ritorna i path scritti."""
    out_dir.mkdir(parents=True, exist_ok=True)
    img_path = out_dir / f"{name}_overlay.png"
    txt_path = out_dir / f"{name}_referto.txt"
    cv2.imwrite(str(img_path), report.overlay)
    txt_path.write_text(report.text, encoding="utf-8")
    return {"overlay": str(img_path), "text": str(txt_path)}
