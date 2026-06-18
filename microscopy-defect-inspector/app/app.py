"""GUI desktop locale (Gradio) per l'ispezione difetti.

Avvio:  python app/app.py
Apre un'interfaccia nel browser locale: carichi una foto al microscopio e
ottieni overlay del difetto, tipo + confidenza e referto testuale.
Include un pulsante di "active learning": confermando/correggendo la classe,
il caso viene salvato in data/ per far crescere il dataset e ri-addestrare.
"""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np

# Permette l'esecuzione sia come modulo sia come script diretto.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import gradio as gr  # noqa: E402

from src.config import load_config  # noqa: E402
from src.inference import Inspector  # noqa: E402

CFG = load_config()
INSPECTOR: Inspector | None = None


def _get_inspector() -> Inspector:
    global INSPECTOR
    if INSPECTOR is None:
        INSPECTOR = Inspector.load(CFG)
    return INSPECTOR


def inspect(image: np.ndarray):
    """Callback principale: riceve RGB da Gradio, ritorna overlay RGB + testo."""
    if image is None:
        return None, "Carica un'immagine."
    bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    try:
        result = _get_inspector().analyze(bgr)
    except Exception as exc:  # mostra l'errore all'utente invece di crashare
        return None, f"Errore: {exc}"
    overlay_rgb = cv2.cvtColor(result.report.overlay, cv2.COLOR_BGR2RGB)
    return overlay_rgb, result.report.text


def save_feedback(image: np.ndarray, label: str):
    """Active learning: salva l'immagine nella classe confermata dall'utente."""
    if image is None or not label:
        return "Niente da salvare: serve un'immagine e una classe."
    label = label.strip().lower()
    bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    if label in ("good", "buono", "ok", "nessun difetto"):
        out_dir = CFG.path("paths", "good_dir")
    else:
        out_dir = CFG.path("paths", "defects_dir") / label
    out_dir.mkdir(parents=True, exist_ok=True)
    existing = len(list(out_dir.glob("*.png")))
    out_path = out_dir / f"feedback_{existing:03d}.png"
    cv2.imwrite(str(out_path), bgr)
    return f"Salvato in {out_path.relative_to(CFG.root)}. Riaddestra per usarlo."


def build_ui() -> "gr.Blocks":
    classes = CFG.defect_classes + ["good"]
    with gr.Blocks(title="Ispezione Difetti al Microscopio") as demo:
        gr.Markdown(
            "# 🔬 Ispezione Difetti al Microscopio\n"
            "Carica una foto: l'AI esegue l'ispezione, evidenzia il difetto e ne "
            "indica il tipo. Con il riquadro 'Correzione' puoi salvare il caso per "
            "migliorare il modello (active learning)."
        )
        with gr.Row():
            with gr.Column():
                inp = gr.Image(type="numpy", label="Foto al microscopio")
                run_btn = gr.Button("Analizza", variant="primary")
            with gr.Column():
                out_img = gr.Image(type="numpy", label="Risultato (heatmap + difetto)")
                out_txt = gr.Textbox(label="Referto", lines=10)
        with gr.Accordion("Correzione / Active learning", open=False):
            label_dd = gr.Dropdown(choices=classes, label="Classe corretta",
                                   allow_custom_value=True)
            save_btn = gr.Button("Salva per ri-addestramento")
            save_msg = gr.Textbox(label="Stato", interactive=False)

        run_btn.click(inspect, inputs=inp, outputs=[out_img, out_txt])
        save_btn.click(save_feedback, inputs=[inp, label_dd], outputs=save_msg)
    return demo


if __name__ == "__main__":
    build_ui().launch()
