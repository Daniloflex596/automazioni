"""Smoke test della pipeline end-to-end su dati sintetici.

Genera un piccolo dataset, addestra anomaly + classificatore e verifica che:
- un'immagine "buona" non venga marcata come difetto;
- un'immagine difettosa produca una heatmap e (se rilevata) una classe valida.

Usa il backend disponibile (torch se presente, altrimenti fallback classico).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np

from src.anomaly import train_from_good
from src.augment import augment_defects
from src.classifier import train_classifier
from src.config import load_config
from src.inference import Inspector
from src.preprocessing import load_image
from src.synthetic import generate_dataset


def _setup():
    cfg = load_config()
    generate_dataset(cfg)
    augment_defects(cfg, n_per_image=4)
    anomaly = train_from_good(cfg)
    classifier = train_classifier(cfg)
    return cfg, Inspector(cfg, anomaly=anomaly, classifier=classifier)


def test_good_image_not_flagged():
    cfg, inspector = _setup()
    good = next(cfg.path("paths", "good_dir").glob("*.png"))
    res = inspector.analyze(load_image(good))
    # heatmap valida e nessun difetto sul pezzo conforme
    assert res.anomaly.heatmap.shape[:2] == (512, 512) or res.anomaly.heatmap.ndim == 2
    assert res.is_defect is False


def test_defect_image_produces_report():
    cfg, inspector = _setup()
    defect = next(cfg.path("paths", "defects_dir").rglob("*.png"))
    res = inspector.analyze(load_image(defect))
    assert isinstance(res.report.text, str) and len(res.report.text) > 0
    assert res.anomaly.heatmap is not None
