"""Test dell'estrazione delle annotazioni (cerchio blu) e smoke test pipeline."""
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.annotations import extract_annotation
from src.config import load_config


def _image_with_blue_circle(size=400, center=(200, 150), radius=40):
    img = np.full((size, size, 3), 140, dtype=np.uint8)
    # difetto scuro
    cv2.circle(img, center, 8, (30, 30, 30), -1)
    # cerchio blu di annotazione (BGR)
    cv2.circle(img, center, radius, (255, 30, 0), 3)
    return img, center, radius


def test_extract_annotation_finds_blue_circle():
    cfg = load_config()
    img, center, radius = _image_with_blue_circle()
    ann = extract_annotation(img, cfg)
    assert ann.found
    assert ann.bbox is not None
    x0, y0, x1, y1 = ann.bbox
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    # il centro della bbox deve essere vicino al centro reale del cerchio
    assert abs(cx - center[0]) < radius
    assert abs(cy - center[1]) < radius


def test_extract_annotation_none_when_no_blue():
    cfg = load_config()
    img = np.full((300, 300, 3), 140, dtype=np.uint8)
    ann = extract_annotation(img, cfg)
    assert not ann.found
    assert ann.bbox is None
