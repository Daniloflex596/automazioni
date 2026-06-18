"""Classificatore del TIPO di difetto (cricca / graffio / buco / ...).

Few-shot, senza training da zero: estrae un embedding da ogni crop di difetto
con un backbone preaddestrato e classifica con k-NN o prototipi (centroidi per
classe). Robusto con pochi campioni, specie se uniti all'augmentation.

Restituisce sempre classe + confidenza; sotto `min_confidence` ritorna
"sconosciuto", utile per non dare etichette azzardate.
"""
from __future__ import annotations

import pickle
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from .config import Config, load_config
from .embeddings import backend_name, embed_image
from .preprocessing import load_image

MODEL_FILE = "defect_classifier.pkl"
UNKNOWN = "sconosciuto"


@dataclass
class Prediction:
    label: str
    confidence: float
    scores: dict[str, float]      # confidenza per ogni classe


class DefectClassifier:
    """k-NN / prototipi su embedding L2-normalizzati."""

    def __init__(self, config: Config | None = None):
        self.cfg = config or load_config()
        self.embeddings: np.ndarray | None = None
        self.labels: list[str] = []
        self.classes: list[str] = []
        self.prototypes: dict[str, np.ndarray] = {}
        self.backend: str = backend_name()

    # ---- training ----
    def fit(self, samples: list[tuple[np.ndarray, str]]) -> "DefectClassifier":
        if not samples:
            raise ValueError("Nessun campione per addestrare il classificatore.")
        embs, labels = [], []
        for img, label in samples:
            embs.append(embed_image(img, self.cfg))
            labels.append(label)
        self.embeddings = np.vstack(embs).astype(np.float32)
        self.labels = labels
        self.classes = sorted(set(labels))
        self.prototypes = {
            c: self.embeddings[[i for i, l in enumerate(labels) if l == c]].mean(axis=0)
            for c in self.classes
        }
        return self

    # ---- inferenza ----
    def _scores(self, emb: np.ndarray) -> dict[str, float]:
        method = self.cfg.get("classifier", "method", default="knn")
        if method == "prototype":
            sims = {c: float(np.dot(emb, p) / ((np.linalg.norm(p) + 1e-8)))
                    for c, p in self.prototypes.items()}
        else:  # knn pesato per similarità coseno
            assert self.embeddings is not None
            k = int(self.cfg.get("classifier", "k", default=3))
            sims_all = self.embeddings @ emb  # già normalizzati
            top = np.argsort(-sims_all)[:k]
            acc: dict[str, float] = {c: 0.0 for c in self.classes}
            for idx in top:
                acc[self.labels[idx]] += float(max(sims_all[idx], 0.0))
            sims = acc
        # softmax-like normalizzazione in [0,1] che somma a 1
        vals = np.array([sims[c] for c in self.classes], dtype=np.float32)
        vals = np.clip(vals, 0, None)
        total = vals.sum()
        probs = vals / total if total > 0 else np.ones_like(vals) / len(vals)
        return {c: float(p) for c, p in zip(self.classes, probs)}

    def predict(self, img: np.ndarray) -> Prediction:
        if self.embeddings is None and not self.prototypes:
            raise RuntimeError("Classificatore non addestrato.")
        emb = embed_image(img, self.cfg)
        scores = self._scores(emb)
        label = max(scores, key=scores.get)
        conf = scores[label]
        min_conf = float(self.cfg.get("classifier", "min_confidence", default=0.45))
        if conf < min_conf:
            return Prediction(label=UNKNOWN, confidence=conf, scores=scores)
        return Prediction(label=label, confidence=conf, scores=scores)

    # ---- persistenza ----
    def save(self, path: str | Path | None = None) -> Path:
        path = Path(path) if path else self.cfg.path("paths", "models_dir") / MODEL_FILE
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as fh:
            pickle.dump({"embeddings": self.embeddings, "labels": self.labels,
                         "classes": self.classes, "prototypes": self.prototypes,
                         "backend": self.backend}, fh)
        return path

    @classmethod
    def load(cls, config: Config | None = None, path: str | Path | None = None) -> "DefectClassifier":
        cfg = config or load_config()
        path = Path(path) if path else cfg.path("paths", "models_dir") / MODEL_FILE
        obj = cls(cfg)
        with open(path, "rb") as fh:
            state = pickle.load(fh)
        obj.embeddings = state["embeddings"]
        obj.labels = state["labels"]
        obj.classes = state["classes"]
        obj.prototypes = state["prototypes"]
        obj.backend = state.get("backend", backend_name())
        return obj


def _collect_training_samples(cfg: Config) -> list[tuple[np.ndarray, str]]:
    """Raccoglie i crop da data/processed/augmented/<classe> e, in mancanza,
    dalle immagini intere in data/defects/<classe>. Include anche i crop estratti
    dalle annotazioni (data/processed/crops/<classe>)."""
    samples: list[tuple[np.ndarray, str]] = []
    augmented = cfg.path("paths", "processed_dir") / "augmented"
    crops = cfg.path("paths", "processed_dir") / "crops"
    defects = cfg.path("paths", "defects_dir")
    for cls in cfg.defect_classes:
        sources = [augmented / cls, crops / cls, defects / cls]
        for src in sources:
            if not src.exists():
                continue
            for p in sorted(src.glob("*.png")):
                img = load_image(p)
                samples.append((img, cls))
    return samples


def train_classifier(config: Config | None = None) -> DefectClassifier:
    """Addestra il classificatore dai dati disponibili e salva il modello."""
    cfg = config or load_config()
    samples = _collect_training_samples(cfg)
    model = DefectClassifier(cfg).fit(samples)
    model.save()
    return model


if __name__ == "__main__":  # pragma: no cover
    m = train_classifier()
    print(f"Classificatore addestrato (backend={m.backend}).")
    print(f"Classi: {m.classes} | campioni: {0 if m.embeddings is None else len(m.embeddings)}")
