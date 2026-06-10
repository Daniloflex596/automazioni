# AI Sonic Director — Fonte di Verità

> Unico documento che descrive lo **stato corrente** del progetto.
> La mappa completa è in [`PIANO_PRODOTTO.md`](./PIANO_PRODOTTO.md); la **visione finale ufficiale** del prodotto è in [`VISIONE_PRODOTTO.md`](./VISIONE_PRODOTTO.md). In caso di conflitto tra memoria, chat e altri documenti, **vince questo file**.
> Regola: ogni sessione di lavoro inizia leggendo questo file e finisce aggiornandolo.

---

## 1. Stato attuale

- **Fase in corso:** Fase 1 completata; primi mattoni di Fase 2 anticipati su decisione del product owner (sviluppo a step).
- **Blocchi completati:** 1 (Fondamenta), 2 (Flusso principale), 3 (Credibilità del prototipo), 4 (Libreria e profilo), 5 (Demo e rifinitura), 6a (Adattività di base), 6b (Export per destinazione), 6c (Suggerimento automatico dell'identità), **Snippet/highlight social**.
- **Ultima cosa completata:** **step A3 — gestione errori e stati di attesa**: dialog dell'app al posto di `prompt`/`confirm` nativi (rinomina/elimina in libreria, con conferma esplicita sulle conseguenze), messaggio specifico per quota/spazio esaurito al salvataggio, errori di avvio dello Studio distinti per causa (archivio inaccessibile / audio mancante / decodifica / imprevisto) con indicazione di cosa fare, toast d'errore più persistenti. Suite e2e **43/43 ✅**. A2 committato in `28f723a`. In parallelo (solo docs): benchmark competitivo integrato in `VISIONE_PRODOTTO.md` (4 fasce funzionali + tesi "finishing OS"); unica ricaduta su roadmap: **A/B loudness-matched aggiunto a B3**.
- **Prossimo passo:** commit di A3 + benchmark, poi step A4 — analisi presentata meglio + export più pratico.

## 2. Priorità corrente

> **Sviluppo a step (decisione del product owner, 2026-06-10):** un solo miglioramento per volta, scelto per valore, validazione utenti in parallelo.
>
> **Regola in vigore (decisione del PO, 2026-06-10): "prima la base eccellente, poi l'espansione".** Nessuna feature nuova di Livello B o C finché il Livello A non è chiuso (vedi §8).
>
> **Step appena chiuso:** A3 — gestione errori e stati di attesa (e2e 43/43 ✅). **Prossimo step:** A4 — analisi presentata meglio + export più pratico.

## 3. Perimetro adesso

**Dentro (perimetro attuale):** flusso completo nel browser, identità sonore curate e adattive (regole di base), A/B, export WAV in tre versioni per destinazione (Master/Streaming/Social) + snippet/highlight social (estratto 20 s), libreria locale, profilo minimo, brano demo, suite e2e.

**Esplicitamente fuori:** backend, account/autenticazione, pagamenti, export MP3 (richiede libreria di codifica), registrazione da microfono, funzioni social, app mobile nativa.

## 4. Decisioni prese

| Data | Decisione | Motivazione |
|---|---|---|
| 2026-06-09 | Target primario: artisti indipendenti (Gruppo A) | Se funziona per loro, copre anche producer e creator |
| 2026-06-09 | Prototipo frontend-only, zero dipendenze, zero build | Massima portabilità e velocità di iterazione; niente infrastruttura prima della validazione |
| 2026-06-09 | Elaborazione del prototipo: catene di effetti reali (Web Audio) ma non adattive | Il valore deve *sentirsi* nell'A/B; l'adattività al singolo brano è investimento da MVP |
| 2026-06-09 | 6 identità sonore curate al lancio del prototipo | Abbastanza per percepire la scelta, poche abbastanza da curarle bene |
| 2026-06-09 | Linguaggio UI: solo termini da artista (Calore, Punch, Brillantezza, Spazio) | Il linguaggio è prodotto (principio 4 del piano) |
| 2026-06-09 | Persistenza: localStorage (metadati) + IndexedDB (file audio) | Permette una libreria vera senza backend |
| 2026-06-09 | Registrazione da microfono: rifiutata per ora | Sposta il prodotto verso la DAW (vedi piano §11.G) |
| 2026-06-10 | Cambio di perimetro: sviluppo a step in parallelo alla validazione | Richiesta esplicita del product owner; resta la regola "un solo step per volta" |
| 2026-06-10 | Primo step di Fase 2: adattività di base delle identità | Era il limite più importante dichiarato del prototipo; fattibile interamente lato browser |
| 2026-06-10 | Export protetto dal clipping (riscala se supera il tetto) | Un file esportato che distorce tradisce la promessa "pronta all'uso" |
| 2026-06-10 | Suite e2e permanente in `tests/`; deve passare prima e dopo ogni sviluppo | "Prima vedi se tutto funziona, poi aggiungi" reso regola verificabile |
| 2026-06-10 | Export per destinazione in WAV; MP3 rinviato | Il valore è il volume giusto per la piattaforma, non il codec; la codifica MP3 richiede una libreria esterna non disponibile ora |
| 2026-06-10 | Separazione stem (instrumental/acapella, voce/beat) confermata FUORI dal perimetro prototipo/MVP, parcheggiata in fase futura | È di fatto un altro prodotto (piano §1); richiede modelli AI/backend; il product owner sceglie di non allargare il perimetro ora |
| 2026-06-10 | *Release package* arricchito da snippet/highlight social (estratto breve coerente con l'identità scelta) | Aumenta il valore del pacchetto restando dentro il perimetro "identità di un brano esistente"; niente stem, niente backend |
| 2026-06-10 | Costruito il suggerimento automatico dell'identità (consigliata + 2 alternative + motivo, preselezione) | Salto da "tool con opzioni" a "copilota che ha ascoltato": massimo valore percepito a costo contenuto, interamente nel browser |
| 2026-06-10 | Installazione di Playwright rimandata a uno step successivo esplicito | Mantiene "zero dipendenze" e "un solo step per volta"; lo step 6c si chiude con syntax check + test logico, dichiarando aperto il debito di verifica e2e |
| 2026-06-10 | Regola "memoria operativa sempre aggiornata": ogni step si apre leggendo `PROJECT_RECAP.md` (root) + questo file, registra le decisioni appena emergono e si chiude aggiornando entrambi prima di fermarsi | La memoria non deve vivere nella chat: il lavoro è a sessioni discontinue e ogni step deve essere ricostruibile in due minuti di lettura |
| 2026-06-10 | Playwright installato come `devDependencies` (con `.gitignore` per `node_modules/`) | Autorizzato dal PO per la verifica e2e; l'app resta a zero dipendenze di runtime — la dipendenza serve solo alla suite di test |
| 2026-06-10 | Fix del server statico della suite e2e per Windows (separatori di percorso) | La suite era nata su Linux; su Windows la richiesta `/` non risolveva `index.html`. Fix nel solo `tests/e2e.mjs`, app intoccata |
| 2026-06-10 | Approvati: `VISIONE_PRODOTTO.md` come guida permanente, roadmap A/B/C + metodo (§8), regola "prima la base eccellente, poi l'espansione" | Mandato esplicito del product owner; ogni step futuro passa dalle 5 domande-gate |
| 2026-06-10 | Regola agenti AI interni: ammessi solo se superano i 6 criteri (vedi VISIONE_PRODOTTO.md); nessun agente prioritario ora | Evitare "fuffa AI"; gli agenti sono strumenti invisibili, non gimmick; vincolo backend li colloca dopo il Livello A |

## 5. Cose simulate o semplificate nel prototipo

Elenco onesto di ciò che è semplificato e andrà reso reale nell'MVP:

- **L'adattività è di base:** le identità si dosano sull'analisi del brano (bilanciamento tonale, dinamica, volume) con regole semplici e clampate; nell'MVP servirà un'adattività più fine (per sezioni del brano, su diagnosi specifiche).
- **L'analisi è di base:** volume, dinamica e bilanciamento tonale calcolati sul file; nell'MVP servirà un'analisi più ricca (chiave, BPM, problemi specifici).
- **Il profilo è locale e senza account:** un nome salvato nel browser; nell'MVP serviranno account reali.
- **Export solo WAV:** le versioni per destinazione ci sono (Master/Streaming/Social), ma la codifica MP3 è rimandata all'MVP; il loudness è misurato in RMS, un'approssimazione del vero LUFS.
- **La libreria vive nel browser dell'utente:** cambiando browser/dispositivo i progetti non seguono l'utente.
- **Il suggerimento dell'identità è di base:** confronta bilanciamento tonale, dinamica e volume con un profilo-target per identità, con motivazione dal tratto più marcato del brano; nell'MVP potrà appoggiarsi a un'analisi più ricca (chiave, BPM) e imparare dal gusto dell'utente. È una distanza pesata su regole fisse, non machine learning: il nome "AI" va difeso alzando la qualità dell'analisi.
- **Manca il pre-ascolto del file prima del caricamento** (confermato dall'audit 2026-06-10): l'utente può ascoltare solo dopo la creazione del progetto, nello Studio.
- ~~**La validazione dell'upload è superficiale**~~ → **risolto con A2 (2026-06-10):** `.opus`/`.oga` e MIME vuoto accettati; il file viene decodificato prima di creare il progetto (un file corrotto non crea più nulla); rollback se il salvataggio audio fallisce. Limite residuo: il file viene decodificato due volte (validazione + Studio) — accettato per non allargare il perimetro.
- **Il tetto anti-clipping non è un vero limiter:** è una riduzione di guadagno sul picco; brani molto dinamici possono non raggiungere il target RMS della destinazione.
- **Nessuna integrazione WhatsApp:** oggi è possibile solo caricare a mano un file ricevuto sul dispositivo. "Condividi verso app" richiederebbe una PWA (manifest + service worker, solo Android/Chrome); WhatsApp Business/Cloud API richiede un backend e non è fattibile nel prototipo frontend-only.

## 6. Parcheggio idee

| Idea | Fase destinazione | Nota |
|---|---|---|
| ~~Export per piattaforma (Spotify/TikTok/YouTube)~~ | ✅ Realizzato (2026-06-10) | In forma base WAV; MP3 resta Fase 2 (piano §11.B) |
| ~~Suggerimento automatico dell'identità~~ | ✅ Realizzato (2026-06-10) | Primo passo "copilota" |
| ~~**Snippet/highlight social**~~ | ✅ Realizzato (2026-06-10) | Estratto breve coerente con l'identità (20 s, volume Social); completa il *release package* |
| Versioni multiple esportate insieme | Fase 2 | Caso d'uso producer (piano §11.E) |
| Confronto con brano di riferimento | Fase 3 | Scommessa identitaria, alta difficoltà (piano §11.C) |
| Scheda d'ascolto condivisibile | Fase 3 | Motore di crescita organica (piano §11.D) |
| Firma sonora dell'utente | Fase 3 | Richiede storico utente (piano §11.F) |
| Separazione stem (instrumental/acapella, voce/beat) | Fase futura | Esplicitamente fuori da prototipo/MVP; è un altro prodotto (piano §1) |
| Registrazione da microfono | Fuori perimetro | Rifiutata (piano §11.G) |

## 7. Diario degli aggiornamenti

| Data | Aggiornamento |
|---|---|
| 2026-06-09 | Creazione del documento. Piano di prodotto v1.0 approvato come base. Prototipo Fase 1 implementato end-to-end (blocchi 1-5). Priorità impostata su validazione con utenti. |
| 2026-06-10 | Cambio di perimetro (sviluppo a step su richiesta del product owner). Completato blocco 6a: adattività di base delle identità, note di adattamento in UI, protezione anti-clipping dell'export. |
| 2026-06-10 | Consolidamento "prototipo finale": suite e2e permanente (26 controlli), fix overflow mobile nello step Personalizza, rinomina progetto in libreria. |
| 2026-06-10 | Blocco 6b: export per destinazione — versioni Master/Streaming (−14)/Social (−10) con tetto anti-clipping, render unico riusato. MP3 rinviato (rete del container senza accesso a librerie). |
| 2026-06-10 | Decisione di perimetro: separazione stem confermata fuori (fase futura), snippet/highlight social ammesso nel release package. |
| 2026-06-10 | **Chiusura formale dello step 6c — Suggerimento automatico dell'identità.** *Obiettivo:* l'app consiglia la migliore identità per il brano, con motivazione in linguaggio da artista e alternative, senza togliere libertà di scelta. *Modifiche:* `recommendIdentities(analysis)` + profili di fit in `app/js/audio/identities.js`; banner "Per il tuo brano partiremmo da…", preselezione e badge Consigliata/Alternativa nello step Identità di `app/js/views/studio.js`; stili in `app/css/main.css`. *Verifiche eseguite:* syntax check (`node --check`) sui file toccati, test logico della raccomandazione (7 controlli passati: brano bassoso→Trap Scura, leggero/brillante→Acustico Naturale, equilibrato→Radio Pulito; 2 alternative distinte; motivazione presente; analisi assente gestita). *Limite rimasto aperto:* suite e2e (`tests/e2e.mjs`) NON eseguita perché Playwright non è installato sulla macchina. *Decisione:* installazione Playwright ed esecuzione della suite rimandate a uno step successivo esplicito; fino ad allora il debito di verifica resta dichiarato qui. |
| 2026-06-10 | **Chiusura dello step "Verifica e2e dello step 6c" — debito estinto.** *Obiettivo:* verificare formalmente il suggerimento automatico nel flusso end-to-end. *Fatto:* Playwright + Chromium installati (`devDependencies`, `.gitignore` per `node_modules/`); fix Windows del server statico della suite (separatori di percorso, solo `tests/e2e.mjs`); suite estesa con 5 controlli sul suggerimento (banner presente, linguaggio da artista, consigliata evidenziata, consigliata preselezionata, 2 alternative). *Esito:* prima esecuzione completa 27/27 ✅, suite estesa **32/32 ✅**, zero errori JS raccolti. *Nessun file dell'app toccato in questo step.* |
| 2026-06-10 | **Chiusura dello step "Snippet/highlight social".** *Obiettivo:* estratto breve del brano (20 s, punto più energico, volume Social) come parte del release package. *Fatto:* UI export completata in `app/js/views/studio.js` (4ª riga snippet con bottone ✂️, riusa `.export-version`); test e2e estesi in `tests/e2e.mjs` (conteggio 3→4, +2 controlli su voce e bottone). *Esito:* suite **34/34 ✅**, zero errori JS. *Nota:* 6c + snippet sono solo nel working tree, mai committati — rischio di perdita. |
| 2026-06-10 | **Audit completo del prototipo (richiesta del PO).** *Verificato:* tutte le aree (upload, validazione, analisi, suggerimento, personalizzazione, A/B, export, snippet, libreria, errori, persistenza, backend). *Esito:* nessuna funzione è simulata — tutta la pipeline audio è reale (Web Audio + DSP custom); semplificazioni e assenze registrate in §5. Suite e2e rieseguita: tutti i controlli ✅ (il runner stampa 33 voci, non 34 — imprecisione di conteggio nei recap, nessun test fallito). Git verificato: 6c + snippet committati (`6eb38fa`), working tree pulito, esiste anche workflow GitHub Pages (`90d2baa`, repo `automazioni/.github`). *Problemi confermati:* niente pre-ascolto pre-upload; analisi povera per credibilità (no BPM/tonalità/LUFS); `.opus` WhatsApp respinti; progetto orfano da file corrotto. *Problemi smentiti:* "funzioni solo frontend/finte" (non ce ne sono); "lavoro non committato" (commit fatto). *WhatsApp:* upload manuale già possibile (con fix `.opus`); share-to-app = serve PWA, Android-only; Cloud API = non fattibile senza backend. *Giudizio:* prototipo funzionale, non demo, non ancora MVP. *Nessun file dell'app toccato.* |
| 2026-06-10 | **Visione finale ufficiale del prodotto + roadmap A/B/C + metodo di costruzione.** *Fatto:* creato `docs/VISIONE_PRODOTTO.md` (visione completa dal punto di vista dell'artista, contraddizioni note col prototipo, definizione finale del prodotto); aggiunta la §8 a questo file (roadmap a 3 livelli + metodo ufficiale: 5 domande-gate prima di ogni step, regola "prima la base eccellente, poi l'espansione"). *Nessun file dell'app toccato.* Prossimo step: **A1 — pre-ascolto del file prima del caricamento**. |
| 2026-06-10 | **Chiusura dello step A1 — Pre-ascolto prima del caricamento.** *Obiettivo:* ascoltare il file scelto PRIMA di creare il progetto; preview che si aggiorna cambiando file e sparisce togliendolo. *Modifiche:* solo `app/js/views/newProject.js` — slot di preview con `<audio controls>` nativo su object URL, `showPreview`/`clearPreview` (pausa + revoca URL), cleanup alla navigazione (la vista ora restituisce `{node, cleanup}`), e fix di un bug reale scovato dal test: il ✕ non azzerava `fileInput.value`, quindi riselezionare lo stesso file non emetteva `change`. *Test:* `tests/e2e.mjs` +3 controlli (preview presente su file scelto, rimossa col ✕, torna ricaricando un file). *Esito:* suite **36/36 ✅**, zero errori JS, nessuna regressione. *Limiti residui dichiarati:* il player è quello nativo del browser (estetica non custom — rifinitura eventuale in A3/A4, non bloccante); la preview riproduce il file originale, non l'identità (corretto per definizione dello step). *In parallelo (solo docs):* regola agenti AI interni registrata in VISIONE_PRODOTTO.md e §8. |
| 2026-06-10 | **Chiusura dello step A2 — Validazione robusta dell'upload** (dopo commit `9ff0fe0` del blocco visione+metodo+A1). *Obiettivo:* accettare i file reali degli artisti (vocali `.opus`, MIME vuoto) e impedire progetti orfani/sporchi. *Modifiche:* solo `app/js/views/newProject.js` — whitelist estensioni estesa (`.opus`, `.oga`); `assertDecodable()` decodifica il file PRIMA di `createProject` (file illeggibile → toast chiaro "riesportalo in MP3 o WAV", si resta sul form, nessun progetto creato, niente console.error perché è un caso atteso); se `saveAudio` fallisce dopo la creazione (es. spazio esaurito) il progetto viene rimosso (rollback con `deleteProject`). *Test:* `tests/e2e.mjs` — test 3 riscritto (corrotto bloccato sul form + zero orfani in libreria) e nuovo caso end-to-end "vocale .opus con audio reale" (fixture WAV rinominata `.opus`: il primo controllo passa, decide la decodifica); rimosso lo scrub dell'errore di decodifica atteso (non serve più). *Esito:* suite **40/40 ✅**, zero errori JS, nessuna regressione. *Limiti residui:* doppia decodifica (validazione + Studio) accettata per non allargare il perimetro; un vero `.opus` su browser senza codec (vecchi Safari) viene rifiutato con messaggio-guida — comportamento corretto, non aggirabile lato client. |
| 2026-06-10 | **Benchmark competitivo integrato nella visione** (analisi fornita dal PO: LANDR, BandLab, RoEx/Automix, Masterchannel, Output Co-Producer, AudioShake). *Fatto:* nuova sezione in `VISIONE_PRODOTTO.md` — mappa competitiva, funzioni minime indispensabili, avanzate ad alto vantaggio (reference mode, multi-version workflow, vocal finishing, social-ready output, expert mode finale), premium/future (album mastering, stem-aware, review mode, release workspace, analytics), da evitare (DAW browser, AI compositiva, chat generica, marketplace, distribution in proprio). Tesi: **finishing OS per artisti indipendenti**, flusso unico vs strumenti frammentati. *Ricaduta su roadmap:* solo l'aggiunta dell'**A/B loudness-matched a B3** (senza parità di volume il confronto inganna); per il resto la roadmap A/B/C resta invariata e il benchmark passa dalle 5 domande-gate. |
| 2026-06-10 | **Chiusura dello step A3 — Gestione errori e stati di attesa.** *Inventario fatto a inizio step:* attese = label bottoni (nuovo progetto, export) + loadingStage Studio; errori = toast upload/save/export + catch-all fuorviante nell'init dello Studio; nativi = `prompt` (rinomina) e `confirm` (elimina) in libreria; quota = `saveAudio` IndexedDB. *Modifiche:* `app/js/ui.js` (componente `appDialog` promise-based: conferma/input, Esc/click-fuori, focus; toast d'errore più persistenti ~5s), `app/css/main.css` (stili `.dialog-overlay`/`.dialog-card`/`.dialog-actions`/`.btn-danger`), `app/js/views/library.js` (rinomina/elimina con dialog dell'app; errore di eliminazione gestito), `app/js/views/newProject.js` (QuotaExceededError → messaggio specifico con via d'uscita, niente console.error per i casi attesi), `app/js/views/studio.js` (init a fasi con 4 errori distinti e azione consigliata). *Test:* handler dei dialog nativi RIMOSSO dalla suite (regressione ai nativi = test rossi), rinomina/elimina via dialog app, +3 controlli (dialog rinomina, conferma con conseguenze, annulla non elimina). *Esito:* **43/43 ✅**, zero errori JS. *Limiti residui:* quota localStorage (metadati, pochi byte) non gestita ad hoc; quota non simulabile in e2e (verificata solo a livello di codice); attese di export restano label-only (ok per durata tipica). |

## 8. Roadmap A/B/C e metodo ufficiale di costruzione (in vigore dal 2026-06-10)

**Regola madre:** *prima si rendono eccellenti e affidabili le funzioni base già esistenti,
poi si espande verso la visione (`VISIONE_PRODOTTO.md`).* Niente feature grandi su base fragile.

### Livello A — base da rendere eccellente SUBITO (in ordine)

| # | Step | Problema utente che risolve |
|---|---|---|
| A1 | Pre-ascolto del file prima del caricamento | Fiducia nei primi 60 secondi; oggi si carica "al buio" |
| A2 | Validazione robusta: `.opus`/MIME vuoto accettati, decodifica PRIMA di creare il progetto (zero progetti orfani) | I file reali degli artisti (vocali WhatsApp, bounce) non vengono respinti; un file rotto non sporca la libreria |
| A3 | Gestione errori e stati di attesa: messaggi chiari ovunque, quota storage gestita, niente attese mute, sostituzione di `prompt`/`confirm` nativi | L'app non deve mai sembrare fragile o muta |
| A4 | Presentazione dell'analisi più solida e onesta (chiarezza, niente promesse oltre il misurato) + export più pratico (naming, feedback di progresso, avviso dimensioni WAV) | Credibilità del momento-fiducia e dell'ultimo miglio |
| A5 | Estensione suite e2e su tutti i fix A1–A4 | Le basi restano solide nel tempo |

**Definizione di "eccellente" per una funzione di Livello A:** gestisce i casi reali e i casi
d'errore con messaggi chiari; non lascia mai l'utente bloccato o senza spiegazione; è coperta
dalla suite e2e; usa il linguaggio dell'artista; nessun dato dell'utente va perso silenziosamente.

### Livello B — core da evolvere DOPO che A è chiuso (in ordine)

| # | Step | Valore |
|---|---|---|
| B1 | BPM + tonalità nell'analisi | L'analisi diventa credibile da prodotto; rafforza suggerimento e adattività |
| B2 | Export MP3 (richiede dipendenza di codifica → ok esplicito del PO) | Lo snippet e le versioni diventano davvero condivisibili/pratici |
| B3 | Vero limiter + loudness LUFS-like, **+ A/B loudness-matched** (dal benchmark competitivo: senza parità di volume il confronto inganna) | I target di destinazione vengono raggiunti davvero; il confronto resta onesto; qualità da prodotto |
| B4 | Release package in un click (tutte le versioni + snippet insieme) | La promessa "esci con tutto" resa letterale |
| B5 | Modalità expert ("apri il cofano" nei pannelli esistenti) | Retention degli utenti che crescono; credibilità presso i producer |
| B6 | PWA di base + rifinitura mobile (prerequisito dello share flow) | Il telefono è dove vivono i brani grezzi |

### Livello C — espansione verso la visione finale (dopo B, ordine indicativo)

| # | Step | Nota |
|---|---|---|
| C1 | Account + cloud (la libreria segue l'artista) | Primo backend; prerequisito di tutto il resto di C |
| C2 | Scheda d'ascolto prima/dopo condivisibile | Il loop virale primario |
| C3 | Share target (condividi-verso-app, incluso WhatsApp) | Richiede PWA (B6); Android/Chrome |
| C4 | Collaborazione (feedback, piccoli team) | Richiede C1 |
| C5 | Premium/monetizzazione, confronto con riferimento, firma sonora | Solo a base e core consolidati |

### Metodo ufficiale di costruzione del progetto (da ora in poi)

Prima di proporre o iniziare QUALSIASI step, rispondere per iscritto a 5 domande:
1. **Perché viene prima** degli altri candidati?
2. **Che problema utente** risolve (concreto, non astratto)?
3. **Che impatto** ha sul prodotto percepito?
4. **Che rischio evita** (o quale rischio corre se rimandato)?
5. **La base attuale è abbastanza solida** per costruirci sopra questo step? Se no, fermarsi.

Regole permanenti: un solo step per volta (regola esistente, confermata); suite e2e verde
prima e dopo ogni step; niente Livello B finché A non è chiuso, niente C finché B non è
avviato sul serio; niente refactor estetici senza impatto percepito; ogni step si chiude
aggiornando `PROJECT_RECAP.md` + questo file; ogni nuova proposta si misura contro
`VISIONE_PRODOTTO.md` ("ci avvicina alla visione o è solo superficie?").

**Agenti AI interni (regola del PO, 2026-06-10):** il prodotto può dotarsi di agenti AI
dedicati a funzioni specifiche, ma solo se superano i 6 criteri definiti in
`VISIONE_PRODOTTO.md` → "POSSIBILI AGENTI AI INTERNI DEL PRODOTTO" (problema utente concreto;
meglio di una regola fissa; esperienza più forte; flusso non complicato; coerenza con la
visione; niente giocattolo/chat). Sono strumenti invisibili, mai gimmick. Stato attuale:
**nessun agente è prioritario**; vincolo backend → non prima di B/C; primo candidato da
rivalutare a B1 chiuso: "l'orecchio che spiega" (analisi narrativa).
