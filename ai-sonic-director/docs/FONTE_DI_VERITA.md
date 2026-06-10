# AI Sonic Director — Fonte di Verità

> Unico documento che descrive lo **stato corrente** del progetto.
> La mappa completa è in [`PIANO_PRODOTTO.md`](./PIANO_PRODOTTO.md). In caso di conflitto tra memoria, chat e altri documenti, **vince questo file**.
> Regola: ogni sessione di lavoro inizia leggendo questo file e finisce aggiornandolo.

---

## 1. Stato attuale

- **Fase in corso:** Fase 1 completata; primi mattoni di Fase 2 anticipati su decisione del product owner (sviluppo a step).
- **Blocchi completati:** 1 (Fondamenta), 2 (Flusso principale), 3 (Credibilità del prototipo), 4 (Libreria e profilo), 5 (Demo e rifinitura), 6a (Adattività di base), 6b (Export per destinazione), 6c (Suggerimento automatico dell'identità), **Snippet/highlight social**.
- **Ultima cosa completata:** snippet/highlight social nel release package — UI export completata, test e2e estesi (+2 controlli), **34/34 controlli passati**. Il release package ora include 3 versioni + snippet.
- **Prossimo passo:** validazione con utenti reali del Gruppo A (in parallelo allo sviluppo a step concordato con il product owner).

## 2. Priorità corrente

> **Sviluppo a step (decisione del product owner, 2026-06-10):** un solo miglioramento per volta, scelto per valore, validazione utenti in parallelo.
>
> **Step appena chiuso:** snippet/highlight social (suite 34/34). **Prossimo candidato:** commit del working tree (6c + snippet mai committati), poi versioni multiple esportate insieme (vedi §6).

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

## 5. Cose simulate o semplificate nel prototipo

Elenco onesto di ciò che è semplificato e andrà reso reale nell'MVP:

- **L'adattività è di base:** le identità si dosano sull'analisi del brano (bilanciamento tonale, dinamica, volume) con regole semplici e clampate; nell'MVP servirà un'adattività più fine (per sezioni del brano, su diagnosi specifiche).
- **L'analisi è di base:** volume, dinamica e bilanciamento tonale calcolati sul file; nell'MVP servirà un'analisi più ricca (chiave, BPM, problemi specifici).
- **Il profilo è locale e senza account:** un nome salvato nel browser; nell'MVP serviranno account reali.
- **Export solo WAV:** le versioni per destinazione ci sono (Master/Streaming/Social), ma la codifica MP3 è rimandata all'MVP; il loudness è misurato in RMS, un'approssimazione del vero LUFS.
- **La libreria vive nel browser dell'utente:** cambiando browser/dispositivo i progetti non seguono l'utente.
- **Il suggerimento dell'identità è di base:** confronta bilanciamento tonale, dinamica e volume con un profilo-target per identità, con motivazione dal tratto più marcato del brano; nell'MVP potrà appoggiarsi a un'analisi più ricca (chiave, BPM) e imparare dal gusto dell'utente.

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
