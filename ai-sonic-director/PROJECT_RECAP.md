# AI Sonic Director — PROJECT RECAP (memoria operativa)

> **Regola (decisione del product owner, 2026-06-10):** questo file + le sezioni pratiche di
> [`docs/FONTE_DI_VERITA.md`](docs/FONTE_DI_VERITA.md) sono la **memoria operativa** del progetto.
> Ogni step: (1) si apre leggendo questo file, (2) registra subito decisioni/vincoli/problemi
> che emergono, (3) si chiude aggiornando questo file **prima di fermarsi**.
> Senza questo file aggiornato, nessuno step può iniziare. La memoria non vive nella chat.

---

## Stato del progetto oggi (2026-06-10, fine giornata)

- **Prodotto:** web app frontend-only (zero dipendenze di runtime, zero build, Web Audio API)
  che trasforma un brano grezzo in versioni con identità sonora, confrontabili ed esportabili.
- **Goal finale (ufficiale):** definito in `docs/VISIONE_PRODOTTO.md` — "finishing OS per
  artisti indipendenti": direzione artistica guidata, versioni credibili, release package,
  share. Approvato dal PO il 2026-06-10, con benchmark competitivo integrato.
- **Metodo (ufficiale):** roadmap A/B/C + 5 domande-gate in FONTE_DI_VERITA §8; regola madre
  "prima la base eccellente, poi l'espansione"; regola agenti AI (6 criteri, nessuno
  prioritario ora). Giudizio da audit: **prototipo funzionale** — non demo, non ancora MVP.
- **LIVELLO A CHIUSO ✅ (gate A5 superato, GO pieno):** A1 pre-ascolto · A2 validazione ·
  A3 errori/attese · A4 analisi+export — tutti 5/5 sui criteri di "eccellente".
  Prossimo: **Livello B, step B1 (BPM + tonalità)**.
- **Commit di oggi:** `9ff0fe0` (visione+metodo+agenti+A1) → `28f723a` (A2) →
  `9764be6` (A3+benchmark) → `063926f` (A4). Branch: `claude/complete-plan-implementation-h0pkbx`.
- **Qualità:** suite e2e Playwright **47/47 controlli passati**, zero errori JS.
  Eseguibile con `node tests/e2e.mjs` (richiede `npm install` una tantum).
- **Bug reali trovati e risolti oggi:** riselezione dello stesso file dopo il ✕ non emetteva
  `change` (A1); file corrotti creavano progetti orfani (A2); catch-all dello Studio dava
  sempre la colpa al "file non leggibile" anche per errori di storage (A3).

## Ultimo step completato — B1: BPM + tonalità nell'analisi (2026-06-10)

**Cosa è stato fatto**
- **Commit `6eaf505`** (gate A5) prima di aprire lo step.
- **Stima BPM** (`app/js/audio/analysis.js`): onset a flusso spettrale + autocorrelazione
  a pettine sul segmento centrale (max 90 s). Demo a 140 BPM → **≈141, conf 0.45, 114 ms**.
- **Stima tonalità**: chroma (riusa lo stesso passaggio FFT delle bande) + profili
  Krumhansl-Schmuckler, nomi italiani ("La minore").
- **Onestà by design**: card "Tempo (stima)"/"Tonalità (stima)" con "≈"; sotto soglia di
  confidenza → "—" e "Non riusciamo a stimarlo con certezza su questo brano".
- **Bug trovato in corso d'opera**: la versione a inviluppo RMS dava 94 BPM "sicuri" sul
  demo a 140 (cieca agli hi-hat nei groove sincopati) — scoperto con una sonda, risolto
  col flusso spettrale. Mai fidarsi della prima stima plausibile.
- Nota di trasparenza A4 aggiornata (misure vs stime); progetti pre-B1 rianalizzati alla
  riapertura (sana anche il debito "insight vecchi"). **Test: +6 controlli, 53/53 ✅.**

**Cosa è aperto**
- **Push su GitHub** (deploy Pages automatico) — in corso in questa sessione.
- **Prossimo step: B2 — export MP3**, che richiede una dipendenza di codifica:
  serve l'ok esplicito del PO prima di aprirlo. In alternativa B3 (limiter vero +
  A/B loudness-matched) non richiede dipendenze.
- Limiti residui B1: fallback su brani armonicamente ambigui (deliberato); ottava BPM
  (70/140) ambigua su half-time; segmento centrale; suggerimento identità non usa ancora
  i nuovi dati.

---

## Step precedente — A5: GATE DEL LIVELLO A → ✅ GO al Livello B (2026-06-10)

**Cosa è stato fatto**
- **Commit `063926f`** (A4) prima del gate; working tree pulito.
- **Gate vero, non formalità**: checklist A1–A4 contro i 5 criteri di "eccellente"
  (FONTE_DI_VERITA §8), con evidenze: run formale suite **47/47 ✅**, grep su `app/` =
  zero `prompt`/`confirm`/`alert` nativi, niente `console.error` sui casi attesi.
- **Esito: tutti e 4 gli step 5/5 ✓. Nessun gap bloccante. GO pieno al Livello B.**
- **7 debiti non bloccanti tracciati** (FONTE_DI_VERITA §8): doppia decodifica;
  `localStorage.setItem` non protetto (`store.js:24,78`); quota non simulabile in e2e;
  attese export label-only; estetica player nativa; insight vecchi nei progetti pre-A4;
  pre-ascolto/dialog non testati su viewport mobile. Nessuno richiede azione prima di B1.
- Checklist completa nel diario di FONTE_DI_VERITA (§7). Nessun file dell'app toccato.

**Cosa è aperto**
- **Prossimo step: B1 — BPM + tonalità nell'analisi.** Perimetro preparato: stima BPM
  (autocorrelazione sull'inviluppo degli onset) + tonalità (profilo chroma), tutto nel
  browser in `analysis.js`; presentazione in `studio.js`; aggiornamento della nota di
  trasparenza; e2e estesa. Zero dipendenze nuove. Il suggerimento identità potrà usare i
  nuovi dati solo se il gate delle 5 domande lo giustifica (non obbligatorio in B1).

---

## Step precedente — A4: analisi presentata meglio + export più pratico (2026-06-10)

**Cosa è stato fatto**
- **Commit `9764be6`** (A3 + benchmark) prima di aprire lo step; memoria consolidata.
- **Analisi più credibile e onesta** (`app/js/audio/analysis.js`, `app/js/views/studio.js`):
  osservazioni che citano i valori misurati sul brano ("Il volume medio misurato è −18 dB:
  più piano dei circa −14 dB tipici…") — i numeri cambiano per brano, via l'effetto template;
  copy d'apertura su cosa misuriamo davvero; range espliciti delle bande tonali;
  **nota di trasparenza**: "BPM e tonalità non vengono ancora misurati".
- **Export più chiaro** (`studio.js`): ogni versione dichiara "WAV 16 bit · ~X MB · brano
  intero" (snippet: "~Y MB · circa 20 secondi") PRIMA del download; primo export con label
  "Elaboro il brano… (solo la prima volta)"; nomi file `Brano - Identità - Versione.wav`;
  riga Formato e toast riformulati.
- **Test e2e** (+4): valori misurati negli insight, nota trasparenza, formato+peso su tutte
  le righe, nome file scaricato verificato sul pattern nuovo.

**Esito verifiche**
- Suite e2e: **47/47 ✅**, zero errori JS, nessuna regressione.

**Cosa è aperto**
- **Commit di A4**, poi **A5 — verifica finale e2e del Livello A** e gate di chiusura A.
- Limiti residui: insight ancora a soglie (varietà piena con B1); peso stimato (scarto
  trascurabile); progetti pre-A4 conservano gli insight vecchi (salvati nell'analisi).

---

## Step precedente — A3: gestione errori e stati di attesa (2026-06-10)

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
- ~~Commit di A3 + benchmark~~ → fatto: `9764be6`. Prossimo: **A4 — analisi presentata
  meglio + export più pratico**.
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
3. ~~**A3 — Gestione errori e stati di attesa**~~ ✅ (43/43, commit `9764be6` col benchmark).
4. ~~**A4 — Analisi presentata meglio + export più pratico**~~ ✅ (47/47, commit `063926f`).
5. ~~**A5 — Gate del Livello A**~~ ✅ **GO al Livello B** (checklist 5/5 su A1–A4,
   7 debiti non bloccanti tracciati).
6. ~~**B1 — BPM + tonalità nell'analisi**~~ ✅ (53/53) — commit + push in chiusura sessione.
7. **B2 — export MP3** (serve ok PO sulla dipendenza) oppure **B3** (limiter vero +
   A/B loudness-matched, zero dipendenze); poi B4, B5, B6.

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
| 2026-06-10 | Commit `9764be6` (A3+benchmark); consolidamento memoria; A4 — analisi con valori misurati + trasparenza, export con peso/formato/naming puliti, e2e 47/47 ✅ | Chiuso |
| 2026-06-10 | Commit `063926f` (A4); A5 — gate del Livello A: checklist 5/5 su A1–A4, zero gap bloccanti, 7 debiti tracciati → **GO al Livello B** | Chiuso |
| 2026-06-10 | Commit `6eaf505` (gate A5); B1 — BPM (flusso spettrale, demo ≈141/140) + tonalità (chroma) come stime con fallback onesto, e2e 53/53 ✅, push su GitHub/Pages | Chiuso |
