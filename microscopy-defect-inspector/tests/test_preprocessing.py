"""Test del preprocessing."""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.config import load_config
from src.preprocessing import preprocess, resize_keep_aspect


def _dummy_image(h=300, w=400):
    rng = np.random.default_rng(0)
    return rng.integers(0, 255, size=(h, w, 3), dtype=np.uint8)


def test_resize_keep_aspect_long_side():
    img = _dummy_image(300, 600)
    out = resize_keep_aspect(img, 300)
    assert max(out.shape[:2]) == 300
    # rapporto d'aspetto preservato (entro 1 px di arrotondamento)
    assert abs(out.shape[1] / out.shape[0] - 600 / 300) < 0.05


def test_preprocess_is_deterministic():
    cfg = load_config()
    img = _dummy_image()
    a = preprocess(img, cfg)
    b = preprocess(img, cfg)
    assert np.array_equal(a, b)


def test_preprocess_gray_shape():
    cfg = load_config()
    img = _dummy_image()
    gray = preprocess(img, cfg, to_gray=True)
    assert gray.ndim == 2
    bgr = preprocess(img, cfg, to_gray=False)
    assert bgr.ndim == 3 and bgr.shape[2] == 3
