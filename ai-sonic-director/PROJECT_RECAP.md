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

## Ultimo step completato — A3: gestione errori e stati di attesa (2026-06-10)

**Cosa è stato fatto**
- **Commit `28f723a`** (A2) prima di aprire lo step, come richiesto dal PO.
- **Dialog dell'app al posto dei nativi** (`app/js/ui.js` + stili in `main.css`): componente
  `appDialog` (conferma o input, Esc/click-fuori per annullare); usato in `library.js` per
  rinomina ed elimina (conferma esplicita: "non si può annullare", bottone rosso).
- **Quota/spazio esaurito** (`newProject.js`): `QuotaExceededError` al salvataggio →
  messaggio specifico con via d'uscita ("elimina qualche progetto dalla libreria e
  riprova"), rollback già in atto da A2, niente console.error per i casi attesi.
- **Errori di avvio dello Studio distinti** (`studio.js`): archivio inaccessibile / audio
  mancante / file non decodificabile / imprevisto in analisi — ognuno con messaggio
  specifico e cosa fare. Prima un catch-all dava sempre la colpa al "file non leggibile".
- **Toast d'errore più persistenti** (~5 s: ora contengono anche l'azione consigliata).
- **Test e2e**: rimosso l'handler dei dialog nativi (se tornassero, i test falliscono);
  rinomina/elimina via dialog dell'app; +3 controlli (incluso "annulla non elimina nulla").
- **In parallelo (solo docs):** benchmark competitivo del PO integrato in
  `VISIONE_PRODOTTO.md` (mappa competitor, 4 fasce funzionali, tesi "finishing OS");
  unica ricaduta su roadmap: **A/B loudness-matched aggiunto a B3**.

**Esito verifiche**
- Suite e2e: **43/43 ✅**, zero errori JS, nessuna regressione.

**Cosa è aperto**
- **Commit di A3 + benchmark**, poi **A4 — analisi presentata meglio + export più pratico**.
- Limiti residui dichiarati: quota localStorage (pochi byte) non gestita ad hoc; il caso
  quota non è simulabile nella suite e2e; attese di export ancora label-only.

---

## Step precedente — A2: validazione robusta dell'upload (2026-06-10)

**Cosa è stato fatto**
- **Commit `9ff0fe0`** prima di aprire lo step: visione + metodo + regola agenti + A1 al sicuro.
- **Unico file dell'app toccato: `app/js/views/newProject.js`**:
  - whitelist estensioni estesa con `.opus` e `.oga` (vocali WhatsApp; il MIME vuoto passa
    perché decide l'estensione, e in ultima istanza la decodifica);
  - `assertDecodable()`: il file viene **decodificato prima di creare il progetto** — file
    illeggibile → toast chiaro ("riesportalo in MP3 o WAV"), si resta sul form, **nessun
    progetto orfano**;
  - rollback: se `saveAudio` fallisce dopo `createProject` (es. spazio pieno), il progetto
    viene eliminato — in libreria non esistono progetti senza audio.
- **Test e2e** (`tests/e2e.mjs`): test 3 riscritto (corrotto bloccato sul form, zero orfani)
  + nuovo caso end-to-end "vocale `.opus`" (fixture audio reale con estensione .opus).

**Esito verifiche**
- Suite e2e: **40/40 ✅**, zero errori JS, nessuna regressione (il vecchio percorso d'errore
  dello Studio resta per progetti pre-esistenti).

**Cosa è aperto**
- **Commit di A2** (working tree contiene solo questo step), poi **A3 — gestione errori e
  stati di attesa** (quota storage, attese spiegate, sostituzione `prompt`/`confirm`).
- Limiti residui dichiarati: doppia decodifica (validazione + Studio), accettata per
  perimetro; browser senza codec opus → rifiuto con messaggio-guida (corretto così).

---

## Step precedente — A1: pre-ascolto prima del caricamento (2026-06-10)

**Cosa è stato fatto**
- **Unico file dell'app toccato: `app/js/views/newProject.js`** — preview con `<audio controls>`
  nativo sul file scelto (object URL), si aggiorna cambiando file, sparisce col ✕, si ferma e
  libera l'URL alla navigazione (la vista ora restituisce `{node, cleanup}`).
- **Bug reale trovato dal nuovo test e corretto:** il ✕ non azzerava `fileInput.value`, quindi
  riselezionare lo stesso file non emetteva `change` (niente pill né preview).
- **Test e2e estesi** (`tests/e2e.mjs`, +3 controlli): preview presente, rimossa col ✕, torna
  ricaricando un file.
- **In parallelo (solo documenti):** regola "agenti AI interni solo se superano i 6 criteri"
  registrata in `docs/VISIONE_PRODOTTO.md` (sezione "POSSIBILI AGENTI AI INTERNI DEL PRODOTTO",
  con lista ragionata: nessun agente prioritario ora) e in FONTE_DI_VERITA §8.

**Esito verifiche**
- Suite e2e: **36/36 ✅** (33 precedenti + 3 nuovi), zero errori JS, nessuna regressione.

**Cosa è aperto**
- **Prossimo step: A2 — validazione robusta** (`.opus`/MIME vuoto accettati, decodifica prima
  della creazione del progetto, zero progetti orfani).
- Limite residuo dichiarato di A1: player nativo del browser (estetica rifinibile in A3/A4).

---

## Step precedente — Visione finale + roadmap A/B/C + metodo (2026-06-10)

**Cosa è stato fatto**
- Creato **`docs/VISIONE_PRODOTTO.md`**: visione finale ufficiale del prodotto (punto di
  vista dell'artista, funzioni dell'app finale per area, auto vs expert, meccanismi virali,
  cosa NON diventare, definizione finale, contraddizioni note col prototipo attuale).
- Aggiunta **FONTE_DI_VERITA §8**: roadmap esecutiva a 3 livelli (A = base eccellente,
  B = core, C = espansione) + **metodo ufficiale di costruzione** (5 domande-gate prima di
  ogni step; regola madre "prima la base eccellente, poi l'espansione").
- **Nuova regola in vigore (decisione PO):** nessuna feature di Livello B/C finché il
  Livello A non è chiuso. Ogni proposta futura si misura contro VISIONE_PRODOTTO.md.

**Cosa è aperto**
- **Prossimo step: A1 — pre-ascolto del file prima del caricamento** (poi A2 validazione
  robusta, A3 errori/attese, A4 analisi+export più solidi, A5 e2e estesa). Ordine completo
  e motivazioni: FONTE_DI_VERITA §8.

---

## Step precedente — Audit completo del prototipo (2026-06-10)

**Cosa è stato fatto**
- Audit end-to-end di tutto il codice (`app/js/**`, `tests/e2e.mjs`, docs) su richiesta del PO:
  per ogni area, verifica se reale / simulata / parziale / assente. Report completo in chat;
  sintesi nelle sezioni sotto e in FONTE_DI_VERITA §5 (aggiornata) e §7 (diario).
- Suite e2e rieseguita durante l'audit: **tutti i controlli passano** (33 voci stampate dal
  runner — il conteggio "34" nei recap precedenti era impreciso di 1; nessun test fallito).
- Verificato git: **6c + snippet SONO committati** (`6eb38fa`), più un commit successivo
  `90d2baa` (workflow GitHub Pages). Working tree pulito. Il rischio "mai committati"
  segnalato nel recap precedente è **rientrato**.

**Esito sintetico dell'audit (giudizio: prototipo funzionale, non demo e non ancora MVP)**
- **Reale**: upload, analisi DSP (RMS/picco/crest/FFT 3 bande), motore Web Audio, A/B
  istantaneo, macro, adattività, export WAV 3 versioni + snippet, libreria, persistenza
  localStorage+IndexedDB. Niente è mockato lato frontend.
- **Reale ma semplificato**: analisi (no BPM/tonalità/LUFS), suggerimento identità
  (distanza pesata su 4 feature, non ML), loudness in RMS, "limiter" = solo gain ceiling.
- **Assente**: preview/ascolto del file PRIMA di creare il progetto (confermato dal PO);
  export MP3; backend (100% client-side); qualsiasi integrazione WhatsApp.
- **Problemi confermati**: niente pre-ascolto; analisi poco ricca per essere credibile;
  file corrotto crea progetto orfano in libreria; vocali WhatsApp `.opus` respinti dalla
  validazione (estensione non in whitelist e MIME spesso vuoto su Windows).
- **WhatsApp — scenari valutati**: (a) file ricevuto su dispositivo e caricato a mano:
  già possibile oggi (con fix `.opus`); (b) "condividi verso app" (Web Share Target):
  fattibile ma richiede PWA (manifest + service worker), solo Android/Chrome; (c) WhatsApp
  Business / Cloud API: NON fattibile nel prototipo frontend-only, richiede backend + Meta.

**Cosa è aperto (roadmap fix decisa dall'audit, in ordine)**
1. Fix immediati: pre-ascolto nel form upload; accettare `.opus`/MIME vuoto; niente
   progetto orfano su file non decodificabile (decodifica prima di creare il progetto).
2. Strutturali: analisi arricchita (BPM, tonalità), loudness LUFS-like + vero limiter,
   export MP3 (richiede dipendenza, serve ok PO), manifest PWA (prerequisito share target).
3. Da rimandare: share target WhatsApp, export multiplo in un click, account/backend.
4. Da non fare adesso: WhatsApp Cloud API, stem separation, social, app native.

## Decisioni chiave in vigore

- **"Prima la base eccellente, poi l'espansione" (2026-06-10):** nessuna feature di Livello
  B/C finché il Livello A non è chiuso; ogni step passa dalle 5 domande-gate; ogni proposta
  si misura contro `docs/VISIONE_PRODOTTO.md`. Roadmap e metodo: FONTE_DI_VERITA §8.
- Un solo step per volta; perimetro rigoroso; se si sta per uscire dal perimetro, fermarsi e segnalare.
- Stem separation (instrumental/acapella, voce/beat): **fuori** da prototipo/MVP, fase futura.
- Snippet/highlight social: **realizzato** nel release package (estratto 20 s, volume Social).
- Zero dipendenze **di runtime**; Playwright è solo dev (suite e2e), autorizzato dal PO il 2026-06-10.
- La suite e2e deve passare prima e dopo ogni sviluppo (di nuovo pienamente applicabile: il runner ora c'è).
- Registro completo delle decisioni: FONTE_DI_VERITA §4.

## Prossimi micro-step consigliati (in ordine — roadmap ufficiale in FONTE_DI_VERITA §8)

1. ~~**A1 — Pre-ascolto**~~ ✅ (36/36, commit `9ff0fe0`).
2. ~~**A2 — Validazione robusta**~~ ✅ (40/40, commit `28f723a`).
3. ~~**A3 — Gestione errori e stati di attesa**~~ ✅ (43/43) — **da committare** (insieme
   al benchmark nella visione).
4. **A4 — Analisi presentata meglio + export più pratico**; **A5 — e2e estesa sui fix**.
5. Solo dopo la chiusura del Livello A: B1 (BPM/tonalità), B2 (MP3), B3 (limiter vero +
   A/B loudness-matched)…

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
| 2026-06-10 | Audit completo del prototipo: verifica reale/simulato/parziale per tutte le aree, e2e ripassata ✅, roadmap fix definita | Chiuso |
| 2026-06-10 | Visione finale ufficiale (docs/VISIONE_PRODOTTO.md) + roadmap A/B/C + metodo di costruzione (FONTE_DI_VERITA §8) | Chiuso |
| 2026-06-10 | A1 — Pre-ascolto prima del caricamento (+ fix bug riselezione stesso file) + regola agenti AI nei docs, e2e 36/36 ✅ | Chiuso |
| 2026-06-10 | Commit `9ff0fe0` (visione + metodo + agenti + A1); A2 — validazione robusta (.opus, decodifica pre-creazione, rollback anti-orfani), e2e 40/40 ✅ | Chiuso |
| 2026-06-10 | Commit `28f723a` (A2); benchmark competitivo nella visione (+ A/B loudness-matched in B3); A3 — errori e attese (dialog app, quota, errori Studio distinti), e2e 43/43 ✅ | Chiuso |
