# AI Sonic Director — Fonte di Verità

> Unico documento che descrive lo **stato corrente** del progetto.
> La mappa completa è in [`PIANO_PRODOTTO.md`](./PIANO_PRODOTTO.md). In caso di conflitto tra memoria, chat e altri documenti, **vince questo file**.
> Regola: ogni sessione di lavoro inizia leggendo questo file e finisce aggiornandolo.

---

## 1. Stato attuale

- **Fase in corso:** Fase 1 completata; primo mattone di Fase 2 (adattività di base) anticipato su decisione del product owner.
- **Blocchi completati:** 1 (Fondamenta), 2 (Flusso principale), 3 (Credibilità del prototipo), 4 (Libreria e profilo), 5 (Demo e rifinitura), 6a (Adattività di base).
- **Ultima cosa completata:** export per destinazione (blocco 6b, differenziatore B del piano §11) — la schermata Export offre tre versioni tarate sul volume di destinazione: Master (piena qualità), Streaming (−14, standard Spotify/Apple/YouTube), Social (−10, per TikTok/Reels/Shorts), tutte con tetto anti-clipping.
- **Prossimo passo:** validazione con utenti reali del Gruppo A (in parallelo allo sviluppo a step concordato con il product owner).

## 2. Priorità corrente

> **Sviluppo a step (decisione del product owner, 2026-06-10):** un solo miglioramento per volta, scelto per valore, validazione utenti in parallelo.

## 3. Perimetro adesso

**Dentro (perimetro attuale):** flusso completo nel browser, identità sonore curate e adattive (regole di base), A/B, export WAV in tre versioni per destinazione (Master/Streaming/Social), libreria locale, profilo minimo, brano demo, suite e2e.

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

## 5. Cose simulate o semplificate nel prototipo

Elenco onesto di ciò che è semplificato e andrà reso reale nell'MVP:

- **L'adattività è di base:** le identità si dosano sull'analisi del brano (bilanciamento tonale, dinamica, volume) con regole semplici e clampate; nell'MVP servirà un'adattività più fine (per sezioni del brano, su diagnosi specifiche).
- **L'analisi è di base:** volume, dinamica e bilanciamento tonale calcolati sul file; nell'MVP servirà un'analisi più ricca (chiave, BPM, problemi specifici).
- **Il profilo è locale e senza account:** un nome salvato nel browser; nell'MVP serviranno account reali.
- **Export solo WAV:** le versioni per destinazione ci sono (Master/Streaming/Social), ma la codifica MP3 è rimandata all'MVP; il loudness è misurato in RMS, un'approssimazione del vero LUFS.
- **La libreria vive nel browser dell'utente:** cambiando browser/dispositivo i progetti non seguono l'utente.

## 6. Parcheggio idee

| Idea | Fase destinazione | Nota |
|---|---|---|
| ~~Export per piattaforma (Spotify/TikTok/YouTube)~~ | ✅ Realizzato (2026-06-10) | In forma base WAV; MP3 resta Fase 2 (piano §11.B) |
| Versioni multiple esportate insieme | Fase 2 | Caso d'uso producer (piano §11.E) |
| Confronto con brano di riferimento | Fase 3 | Scommessa identitaria, alta difficoltà (piano §11.C) |
| Scheda d'ascolto condivisibile | Fase 3 | Motore di crescita organica (piano §11.D) |
| Firma sonora dell'utente | Fase 3 | Richiede storico utente (piano §11.F) |
| Registrazione da microfono | Fuori perimetro | Rifiutata (piano §11.G) |

## 7. Diario degli aggiornamenti

| Data | Aggiornamento |
|---|---|
| 2026-06-09 | Creazione del documento. Piano di prodotto v1.0 approvato come base. Prototipo Fase 1 implementato end-to-end (blocchi 1-5). Priorità impostata su validazione con utenti. |
| 2026-06-10 | Cambio di perimetro (sviluppo a step su richiesta del product owner). Completato blocco 6a: adattività di base delle identità, note di adattamento in UI, protezione anti-clipping dell'export. |
| 2026-06-10 | Consolidamento "prototipo finale": suite e2e permanente (26 controlli), fix overflow mobile nello step Personalizza, rinomina progetto in libreria. |
| 2026-06-10 | Blocco 6b: export per destinazione — versioni Master/Streaming (−14)/Social (−10) con tetto anti-clipping, render unico riusato. MP3 rinviato (rete del container senza accesso a librerie). |
