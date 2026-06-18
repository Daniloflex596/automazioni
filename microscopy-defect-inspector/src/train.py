"""Pipeline di training completa, eseguibile da riga di comando.

  python -m src.train [--synthetic]

Passi:
  1. (opzionale) genera dati sintetici se manca un dataset reale
  2. estrae i crop dalle annotazioni (cerchio blu)
  3. data augmentation dei difetti
  4. addestra l'anomaly detector dalle immagini buone
  5. addestra il classificatore del tipo di difetto
  6. salva i modelli in models/

Usalo in locale per provare, oppure dentro il notebook Colab per il training
sui dati reali (con GPU).
"""
from __future__ import annotations

import argparse

from .annotations import process_annotated_dir
from .anomaly import train_from_good
from .augment import augment_defects
from .classifier import train_classifier
from .config import load_config
from .synthetic import generate_dataset


def main(use_synthetic: bool = False) -> None:
    cfg = load_config()

    good_dir = cfg.path("paths", "good_dir")
    has_data = any(good_dir.glob("*.png"))
    if use_synthetic or not has_data:
        print("[1/5] Genero dataset sintetico...")
        counts = generate_dataset(cfg)
        print(f"      {counts}")
    else:
        print("[1/5] Dataset reale rilevato, salto la generazione sintetica.")

    print("[2/5] Estraggo crop dalle annotazioni (cerchio blu)...")
    ann = process_annotated_dir(cfg)
    print(f"      {sum(1 for a in ann if a['found'])}/{len(ann)} annotazioni con difetto.")

    print("[3/5] Data augmentation dei difetti...")
    aug = augment_defects(cfg)
    print(f"      {aug}")

    print("[4/5] Addestro l'anomaly detector (immagini buone)...")
    anomaly = train_from_good(cfg)
    print(f"      backend={anomaly.backend}, soglia={anomaly.threshold:.4f}, "
          f"patch={0 if anomaly.memory is None else len(anomaly.memory)}")

    print("[5/5] Addestro il classificatore del tipo di difetto...")
    clf = train_classifier(cfg)
    n = 0 if clf.embeddings is None else len(clf.embeddings)
    print(f"      backend={clf.backend}, classi={clf.classes}, campioni={n}")

    print("\nFatto. Modelli salvati in:", cfg.path("paths", "models_dir"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Training pipeline ispezione difetti")
    parser.add_argument("--synthetic", action="store_true",
                        help="forza la generazione del dataset sintetico")
    args = parser.parse_args()
    main(use_synthetic=args.synthetic)
