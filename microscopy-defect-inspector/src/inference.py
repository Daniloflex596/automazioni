"""Pipeline di inferenza end-to-end.

analizza(foto):
  1. preprocess
  2. anomaly detection -> score + heatmap (SE e DOVE c'è un difetto)
  3. se difetto: ritaglia la regione e classifica il TIPO
  4. costruisce il referto (overlay + testo)

I modelli (anomaly + classificatore) vengono caricati da models/ se presenti.
Se mancano, l'anomaly detector può essere addestrato al volo dalle immagini
buone, così la pipeline resta utilizzabile anche prima di un training formale.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np

from .anomaly import AnomalyResult, PatchCore, train_from_good
from .classifier import DefectClassifier, Prediction
from .config import Config, load_config
from .preprocessing import load_image, preprocess
from .report import Report, build_report


@dataclass
class InspectionResult:
    is_defect: bool
    anomaly: AnomalyResult
    prediction: Prediction | None
    report: Report
    threshold: float


class Inspector:
    """Tiene in memoria i modelli e analizza le immagini."""

    def __init__(self, config: Config | None = None,
                 anomaly: PatchCore | None = None,
                 classifier: DefectClassifier | None = None):
        self.cfg = config or load_config()
        self.anomaly = anomaly
        self.classifier = classifier

    @classmethod
    def load(cls, config: Config | None = None, *, train_if_missing: bool = True) -> "Inspector":
        cfg = config or load_config()
        models_dir = cfg.path("paths", "models_dir")

        anomaly: PatchCore | None = None
        if (models_dir / "anomaly_patchcore.pkl").exists():
            anomaly = PatchCore.load(cfg)
        elif train_if_missing:
            good_dir = cfg.path("paths", "good_dir")
            if any(good_dir.glob("*.png")):
                anomaly = train_from_good(cfg)

        classifier: DefectClassifier | None = None
        if (models_dir / "defect_classifier.pkl").exists():
            classifier = DefectClassifier.load(cfg)

        return cls(cfg, anomaly=anomaly, classifier=classifier)

    def analyze(self, img_bgr: np.ndarray) -> InspectionResult:
        if self.anomaly is None:
            raise RuntimeError(
                "Anomaly detector non disponibile: aggiungi immagini in data/good "
                "e addestra (vedi src/anomaly.py) oppure usa Inspector.load().")
        pre = preprocess(img_bgr, self.cfg)
        anomaly = self.anomaly.predict(pre)

        prediction: Prediction | None = None
        if anomaly.is_defect and anomaly.bbox is not None and self.classifier is not None:
            x0, y0, x1, y1 = anomaly.bbox
            crop = pre[y0:y1, x0:x1]
            if crop.size > 0:
                prediction = self.classifier.predict(crop)

        threshold = self.anomaly.threshold or 0.0
        report = build_report(
            original=pre,
            is_defect=anomaly.is_defect,
            anomaly_score=anomaly.score,
            threshold=threshold,
            defect_type=prediction.label if prediction else None,
            type_confidence=prediction.confidence if prediction else None,
            heatmap=anomaly.heatmap,
            bbox=anomaly.bbox,
        )
        return InspectionResult(is_defect=anomaly.is_defect, anomaly=anomaly,
                                prediction=prediction, report=report, threshold=threshold)

    def analyze_file(self, path: str | Path) -> InspectionResult:
        return self.analyze(load_image(path))


def analyze_image(path: str | Path, config: Config | None = None) -> InspectionResult:
    """Helper one-shot: carica i modelli e analizza un file."""
    inspector = Inspector.load(config)
    return inspector.analyze_file(path)


if __name__ == "__main__":  # pragma: no cover
    import sys

    cfg = load_config()
    if len(sys.argv) > 1:
        target = Path(sys.argv[1])
    else:
        target = next((cfg.path("paths", "defects_dir")).rglob("*.png"))
    res = analyze_image(target, cfg)
    print(res.report.text)
