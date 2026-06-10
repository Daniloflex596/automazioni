# AI Sonic Director

Web app per artisti, rapper, producer e creator: trasforma una canzone grezza in una versione più pulita, coerente e pronta all'uso, scegliendo un'**identità sonora** invece di regolare parametri tecnici.

**Stato:** Fase 1 — prototipo interattivo completo (flusso end-to-end con audio reale nel browser).

## Documentazione

| Documento | Ruolo |
|---|---|
| [`docs/PIANO_PRODOTTO.md`](docs/PIANO_PRODOTTO.md) | Piano completo del prodotto: identità, target, fasi, ordine di costruzione, principi, opportunità di mercato. È la mappa. |
| [`docs/FONTE_DI_VERITA.md`](docs/FONTE_DI_VERITA.md) | **Fonte unica di verità**: stato corrente, priorità, perimetro, decisioni. Si legge a inizio sessione e si aggiorna a fine sessione. È il "ci troviamo qui". |

## Provare il prototipo

Nessuna dipendenza, nessuna build. Serve solo un server statico (i moduli ES non si caricano da `file://`):

```bash
cd ai-sonic-director/app
python3 -m http.server 8000
# poi apri http://localhost:8000
```

Il flusso completo: **Home → Nuovo progetto (file tuo o brano demo generato) → Analisi → Identità sonora → Personalizzazione → Confronto A/B → Export WAV → Libreria.**

Tutto avviene nel browser (Web Audio API): l'analisi è reale, le identità sonore si sentono davvero, l'export WAV contiene esattamente ciò che hai ascoltato. I progetti restano salvati nel browser (localStorage + IndexedDB).

## Cosa è reale e cosa è semplificato

Il prototipo serve a validare flusso e percezione di valore, non la qualità da mastering. L'elenco onesto delle semplificazioni è in [`docs/FONTE_DI_VERITA.md`](docs/FONTE_DI_VERITA.md) §5 — in sintesi: le identità si adattano all'analisi del brano con regole semplici (l'adattività fine è da MVP), l'analisi è di base, niente account né backend, export solo WAV.

## Struttura

```
ai-sonic-director/
├── docs/                  # piano di prodotto e fonte di verità
└── app/
    ├── index.html
    ├── css/main.css
    └── js/
        ├── main.js        # bootstrap + router
        ├── store.js       # persistenza locale (localStorage + IndexedDB)
        ├── ui.js          # helper DOM
        ├── audio/         # motore Web Audio: identità, analisi, export, demo
        └── views/         # home, nuovo progetto, studio (flusso a 5 passi), libreria, profilo
```
