# 🔬 Ispezione Difetti al Microscopio

App desktop che ispeziona foto di oggetti scattate al microscopio, **rileva i
difetti** (se e dove) e ne **classifica il tipo** (cricca, graffio, buco, ...).

Pensata per **pochissimi dati**: bastano alcune immagini "buone" e pochi esempi
difettosi. Funziona con un approccio few-shot:

1. **Anomaly detection** (stile PatchCore): impara l'aspetto "normale" dalle
   immagini buone e produce una **heatmap** che localizza l'anomalia → dice *se*
   e *dove* c'è un difetto.
2. **Classificatore di tipo** (embedding di un backbone preaddestrato + k-NN/
   prototipi): guarda la regione anomala e dice *che* difetto è.
3. **Ispezione classica** (contrasto/illuminazione) come preprocessing robusto.
4. **Active learning**: dalla GUI confermi/correggi l'esito e il caso viene
   salvato per migliorare il modello nel tempo.

> Tutto il sistema è sviluppabile e testabile **senza le foto reali** grazie a un
> generatore di immagini sintetiche (`src/synthetic.py`). Quando arrivano le foto
> vere, bastano pochi step (vedi sotto).

## Struttura

```
src/
  config.py         # caricamento config.yaml
  synthetic.py      # generatore dataset sintetico (sviluppo senza foto)
  preprocessing.py  # CLAHE, normalizzazione illuminazione, denoise
  annotations.py    # estrae il difetto dal cerchio blu + frecce (HSV)
  augment.py        # data augmentation (albumentations o fallback OpenCV)
  embeddings.py     # feature/embedding (torchvision o fallback classico)
  anomaly.py        # PatchCore-lite: memory bank + heatmap (se/dove)
  classifier.py     # k-NN/prototipi sul tipo di difetto (che difetto è)
  report.py         # overlay + referto testuale
  inference.py      # pipeline end-to-end
  train.py          # training completo da riga di comando
app/app.py          # GUI desktop (Gradio)
tests/              # unit test + smoke test pipeline
notebooks/train_colab.ipynb  # training su Colab (GPU)
config.yaml         # classi difetto, soglie, path
```

## Avvio rapido (sviluppo, senza foto reali)

```bash
cd microscopy-defect-inspector
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 1) genera dati finti + addestra i modelli
python -m src.train --synthetic

# 2) avvia la GUI
python app/app.py
```

> Nota: se `torch`/`torchvision` non sono installati o non riescono a scaricare i
> pesi, il sistema usa automaticamente un **fallback classico** (feature
> handcrafted) e resta comunque funzionante.

## Test

```bash
pip install pytest
pytest -q
```

## Configurazione

Tutto è in `config.yaml`: classi di difetto, soglie (anomaly score, confidenza
minima), parametri di preprocessing e range HSV per il cerchio blu.

## Passaggio alle foto reali (i 2-3 step finali)

1. **Inserire i dati**: copia le immagini buone in `data/good/`, quelle difettose
   in `data/defects/<classe>/` e le annotate (cerchio blu) in `data/annotated/`.
2. **Addestrare**: esegui `python -m src.train` (in locale) oppure
   `notebooks/train_colab.ipynb` su Google Colab con GPU per scaricare i pesi in
   `models/`.
3. **Tarare e validare**: regola le soglie in `config.yaml`, controlla i risultati
   nella GUI; (opzionale) impacchetta in eseguibile con PyInstaller.

### ⚠️ Nota sui marchi blu

Le immagini con cerchio blu + frecce **non** vengono usate come pixel di training
(il modello imparerebbe "blu = difetto"). Servono solo per **localizzare** il
difetto: `annotations.py` isola il blu in HSV, ricava la bounding box, ritaglia la
regione e (opzionale) **rimuove i marchi via inpainting** per ottenere un crop
pulito da dare al classificatore.

## Limiti e aspettative

Con pochissimi dati il risultato è un **prototipo dimostrativo**: la classe del
difetto può sbagliare sui tipi con pochi esempi. La coerenza di acquisizione
(luce, ingrandimento, fuoco) incide molto. L'active learning è il modo pratico
per far crescere il dataset e migliorare l'accuratezza.
