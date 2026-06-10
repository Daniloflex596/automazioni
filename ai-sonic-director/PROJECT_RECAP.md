# AI Sonic Director — PROJECT RECAP (memoria operativa)

> **Regola (decisione del product owner, 2026-06-10):** questo file + le sezioni pratiche di
> [`docs/FONTE_DI_VERITA.md`](docs/FONTE_DI_VERITA.md) sono la **memoria operativa** del progetto.
> Ogni step: (1) si apre leggendo questo file, (2) registra subito decisioni/vincoli/problemi
> che emergono, (3) si chiude aggiornando questo file **prima di fermarsi**.
> Senza questo file aggiornato, nessuno step può iniziare. La memoria non vive nella chat.

---

## Stato del progetto oggi (2026-06-10)

- **Prodotto:** web app frontend-only (zero dipendenze di runtime, zero build, Web Audio API)
  che trasforma un brano grezzo in versioni con identità sonora, confrontabili ed esportabili.
- **Goal finale:** il modo più semplice per portare un brano grezzo alla sua migliore identità
  sonora e a un *release package* pronto alla pubblicazione, senza ragionare da fonico.
- **Fase:** Fase 1 (prototipo) completata; primi mattoni di Fase 2 anticipati a step.
- **Blocchi completati:** 1–5 (prototipo), 6a (adattività di base), 6b (export per destinazione),
  6c (suggerimento automatico dell'identità), **Snippet/highlight social**.
- **Qualità:** suite e2e Playwright **34/34 controlli passati** (estesa con i controlli su
  snippet social). Eseguibile con `node tests/e2e.mjs` (richiede `npm install` una tantum).

## Ultimo step completato — Snippet/highlight social

**Cosa è stato fatto**
- Logica di snippet già presente in `app/js/audio/export.js` (`SNIPPET`, `makeSnippetBlob`,
  `findLoudestWindowStart`) — completata dal codice precedente.
- **UI Export completata** in `app/js/views/studio.js`: aggiunta 4ª riga "Snippet social" con
  bottone ✂️ che chiama `downloadSnippet()`, riusa lo stesso render e gli stili `.export-version`.
  Nessuna nuova struttura CSS: riutilizza `.ico`, `.ev-text`, `.btn` esistenti.
- **Test e2e estesi** in `tests/e2e.mjs`: aggiornato conteggio export (3→4), aggiunti 2 controlli
  (voce "Snippet social" presente, bottone esporta snippet cliccabile).

**Cosa è chiuso**
- Step snippet/highlight social **chiuso**. Il release package ora include: Master + Streaming +
  Social + Snippet social (estratto di 20 secondi sul punto più energico, volume Social).
- Suite e2e passata: **34/34 ✅** (32 precedenti + 2 nuovi controlli snippet). Zero errori JS.

**Cosa è aperto**
- Il working tree contiene 6c (suggerimento identità) + snippet — **nessuno dei due è in un commit**.
  Prossimo micro-step consigliato: commit per mettere al sicuro.

## Decisioni chiave in vigore

- Un solo step per volta; perimetro rigoroso; se si sta per uscire dal perimetro, fermarsi e segnalare.
- Stem separation (instrumental/acapella, voce/beat): **fuori** da prototipo/MVP, fase futura.
- Snippet/highlight social: **realizzato** nel release package (estratto 20 s, volume Social).
- Zero dipendenze **di runtime**; Playwright è solo dev (suite e2e), autorizzato dal PO il 2026-06-10.
- La suite e2e deve passare prima e dopo ogni sviluppo (di nuovo pienamente applicabile: il runner ora c'è).
- Registro completo delle decisioni: FONTE_DI_VERITA §4.

## Prossimi micro-step consigliati (in ordine)

1. **Commit del working tree** — 6c (suggerimento identità) + snippet sono solo sul working tree,
   mai committati. Rischio: perderli.
2. **Versioni multiple esportate insieme** — un click, tutte le versioni (PIANO_PRODOTTO §11.E).
   Utile per producer (Gruppo B) e a costo basso (stesso render riusato).

## Errori o blocchi

- Nessuno.

---

## Diario degli step

| Data | Step | Esito |
|---|---|---|
| 2026-06-09 | Blocchi 1–5: prototipo end-to-end | Chiuso |
| 2026-06-10 | 6a: adattività di base + anti-clipping export | Chiuso |
| 2026-06-10 | Consolidamento: suite e2e permanente, fix mobile, rinomina | Chiuso |
| 2026-06-10 | 6b: export per destinazione (Master/Streaming/Social) | Chiuso |
| 2026-06-10 | 6c: suggerimento automatico dell'identità | Chiuso, con debito e2e dichiarato |
| 2026-06-10 | Creazione di questo recap + regola "memoria operativa sempre aggiornata" | Chiuso |
| 2026-06-10 | Verifica e2e dello step 6c: Playwright installato, fix Windows suite, +5 controlli, 32/32 ✅ | Chiuso, debito estinto |
| 2026-06-10 | Snippet/highlight social: UI export completata, test e2e estesi (+2 controlli), 34/34 ✅ | Chiuso |
