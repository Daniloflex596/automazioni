# AI Sonic Director — Piano di Prodotto

> **Versione:** 1.0 · **Data:** 2026-06-09 · **Stato:** Approvato come base di lavoro
> Questo documento è il piano completo del prodotto. La sua sintesi operativa e lo stato corrente vivono in [`FONTE_DI_VERITA.md`](./FONTE_DI_VERITA.md), che è l'unico documento da consultare per sapere "cosa stiamo facendo adesso".

---

## 1. Identità del prodotto

**Cos'è.** AI Sonic Director è una web app che trasforma una canzone grezza in una versione più pulita, coerente e pronta all'uso, attraverso un flusso guidato in cui l'utente sceglie un'**identità sonora** invece di regolare parametri tecnici.

**La promessa principale.** *"Carichi il tuo brano, scegli che carattere deve avere, ascolti il prima e il dopo, esporti. In minuti, non in giornate."*

**Posizionamento percepito.** Non è una DAW, non è un plugin, non è un servizio di mastering professionale in abbonamento. Si posiziona come il **direttore artistico sonoro personale**: lo strumento che sta tra "ho finito di registrare" e "posso pubblicare". Il riferimento mentale per l'utente non è Pro Tools ma piuttosto "il Canva del suono": accessibile, guidato, con risultati immediatamente percepibili.

**Cosa lo rende attraente.**
- Parla la lingua dell'artista ("più caldo", "più punch", "da club"), non quella del fonico (threshold, ratio, shelf).
- Il confronto A/B immediato tra originale e versione lavorata rende il valore **udibile in 30 secondi**.
- Più direzioni sonore confrontabili: l'utente non riceve "il master giusto", ma **sceglie tra identità diverse**, e questo è un atto creativo, non tecnico.

**Cosa non deve diventare.**
- Una DAW semplificata con timeline, tracce e editing: appena compaiono, il prodotto perde la sua promessa di semplicità.
- Un pannello di parametri tecnici travestito: se l'utente deve capire cosa fa un compressore, abbiamo fallito.
- Un aggregatore di funzioni AI musicali (generazione di beat, separazione stem, testi): ognuna di queste è un prodotto a sé. AI Sonic Director fa una cosa: **dare identità sonora a un brano esistente come mix completo**. *(Confine ribadito il 2026-06-10: niente separazione stem né instrumental/acapella reali nel perimetro prototipo/MVP — parcheggiati in fase futura, vedi §11.J. Il "release package" si arricchisce invece con uno snippet/highlight social, §11.I.)*

---

## 2. Target utenti

### Gruppo A — Rapper e cantanti indipendenti (target primario)
- **Chi sono:** artisti che registrano in home studio o in piccoli studi, producono molto materiale, pubblicano su Spotify/YouTube/TikTok senza etichetta.
- **Cosa vogliono:** che il loro brano "suoni come quelli usciti", senza dover pagare un fonico per ogni demo o imparare il mixing.
- **Cosa li blocca oggi:** il mastering professionale costa e ha tempi lunghi; i tool automatici esistenti danno un risultato unico, opaco, senza possibilità di dire "lo voglio più scuro".
- **Perché quest'app:** dà loro controllo creativo (scelgono l'identità) senza chiedere competenza tecnica, e velocità compatibile con il loro ritmo di pubblicazione.

### Gruppo B — Producer e beatmaker emergenti
- **Chi sono:** creano strumentali e brani completi, hanno qualche competenza tecnica ma non da mastering engineer.
- **Cosa vogliono:** versioni rapide e credibili dei loro lavori per mandarle ad artisti, piazzarle su store di beat, testarle.
- **Cosa li blocca oggi:** il mastering è l'ultimo 10% che ruba il 50% del tempo; fare tre versioni alternative di un brano è oneroso.
- **Perché quest'app:** il confronto tra più identità sonore è esattamente il loro caso d'uso ("come suonerebbe questo beat in versione club vs. radio?").

### Gruppo C — Creator e content maker (target secondario)
- **Chi sono:** creator che usano musica propria o jingle nei loro contenuti video e podcast.
- **Cosa vogliono:** audio che non sfiguri accanto a contenuti professionali, ottenuto in pochi minuti.
- **Cosa li blocca oggi:** non hanno né interesse né tempo per l'audio engineering; gli strumenti musicali li intimidiscono.
- **Perché quest'app:** è l'unico gruppo per cui la semplicità è più importante della qualità assoluta. Sono il test definitivo della usabilità del flusso.

**Decisione di priorità:** il prodotto si progetta sul Gruppo A. Se funziona per un rapper indipendente, funziona per gli altri due. Non si aggiungono funzioni dedicate ai gruppi B e C prima dell'MVP.

---

## 3. Problema e valore

**Problemi reali che risolve.**
1. Il divario tra "brano finito creativamente" e "brano pubblicabile" oggi richiede soldi (fonico), tempo (imparare) o compromessi (preset automatici opachi).
2. Gli artisti non sanno *descrivere tecnicamente* cosa vogliono, ma sanno *riconoscerlo quando lo sentono*. Nessun tool oggi è costruito attorno a questo fatto.
3. Decidere la direzione sonora di un brano senza poter confrontare alternative concrete è come scegliere una copertina senza vederla.

**Frustrazione che elimina.** Quella di ascoltare il proprio brano accanto a uno pubblicato e sentire la differenza senza sapere da dove viene né come colmarla.

**Vantaggio percepito immediato.** Entro pochi minuti dal caricamento l'utente ascolta il proprio brano trasformato, in più direzioni, e può passare da prima a dopo con un tasto. Il valore non va spiegato: si sente.

**Perché è diverso dai tool esistenti.**
- I servizi di mastering automatico (es. LANDR, eMastered) restituiscono *un* risultato e trattano il processo come una scatola nera tecnica. AI Sonic Director tratta il processo come una **scelta creativa tra direzioni**.
- I plugin AI (es. iZotope Ozone) presuppongono una DAW e competenza. AI Sonic Director presuppone solo un file e un gusto.
- La metafora dell'identità sonora — con nomi, descrizioni e casi d'uso, non numeri — è il vero elemento distintivo ed è dove va investita la qualità.

---

## 4. Esperienza utente ideale

Il percorso completo, dall'ingresso all'uscita:

1. **Ingresso.** L'utente arriva su una home che comunica una sola cosa: "porta qui il tuo brano". Nessun catalogo di funzioni, nessun menù affollato. *Ruolo nel valore:* azzera l'attrito iniziale e stabilisce il posizionamento (semplice, diretto, per artisti).
2. **Creazione progetto.** Carica un file audio (o usa un brano demo per provare subito), dà un nome al progetto. *Ruolo:* il concetto di "progetto" promette continuità — il lavoro non si perde, ci si torna.
3. **Analisi.** L'app ascolta il brano e restituisce un ritratto in linguaggio umano: volume rispetto agli standard streaming, bilanciamento tonale, dinamica. *Ruolo:* è il momento in cui l'utente sente che l'app *ha capito il suo brano*; crea fiducia e prepara la scelta successiva.
4. **Scelta dell'identità sonora.** L'utente sceglie tra identità con nome, descrizione e caso d'uso (es. "Club Ready", "Radio Pulito", "Lo-Fi Caldo"). Può pre-ascoltarle. *Ruolo:* è il cuore del prodotto — la decisione creativa, non tecnica.
5. **Personalizzazione.** Pochi controlli macro in linguaggio umano (Calore, Punch, Brillantezza, Spazio) per rifinire l'identità scelta. *Ruolo:* dà senso di controllo senza aprire la porta alla complessità tecnica.
6. **Confronto tra versioni.** A/B istantaneo tra originale e versione lavorata, durante la riproduzione, senza interruzioni. *Ruolo:* è la prova del valore; è qui che l'utente decide che il prodotto funziona.
7. **Feedback.** L'utente conferma la direzione o torna indietro di un passo (altra identità, altra regolazione) senza perdere nulla. *Ruolo:* il flusso deve perdonare i ripensamenti, perché la scelta è creativa e le scelte creative si cambiano.
8. **Export.** Scarica la versione finale in un formato utilizzabile. *Ruolo:* chiude il cerchio della promessa — "pronta all'uso" significa un file in mano.
9. **Ritorno in libreria.** Il progetto resta in libreria con la sua identità, le sue regolazioni e la sua storia. *Ruolo:* trasforma un tool monouso in uno strumento di lavoro ricorrente; è la base della retention.

**Regola del flusso:** ogni passaggio deve poter essere completato senza leggere istruzioni. Se serve un tutorial, il passaggio va riprogettato.

---

## 5. Schermate principali

| Schermata | Funzione | Messaggio | Azione principale | Essenziale | Rimandabile |
|---|---|---|---|---|---|
| **Home** | Punto d'ingresso | "Porta qui il tuo brano, al resto pensiamo insieme" | Crea nuovo progetto | Promessa chiara, CTA unica, accesso a libreria | Onboarding animato, showcase di esempi |
| **Nuovo progetto** | Caricamento e naming | "Bastano un file e un nome" | Carica file / usa demo | Upload, validazione formato, brano demo | Import da link/cloud, registrazione diretta |
| **Studio — Analisi** | Ritratto del brano | "Abbiamo ascoltato il tuo brano, ecco cosa abbiamo sentito" | Prosegui alla scelta identità | Forma d'onda, 3-4 osservazioni in linguaggio umano | Confronto con brani di riferimento |
| **Studio — Identità sonora** | Scelta della direzione | "Che carattere vuoi dare al brano?" | Seleziona un'identità (con pre-ascolto) | 5-7 identità curate con nome, descrizione, caso d'uso | Identità generate su misura, identità della community |
| **Studio — Personalizzazione** | Rifinitura macro | "Rifinisci, senza tecnicismi" | Regola i 4 controlli macro | 4 slider in linguaggio umano, ascolto in tempo reale | Controlli avanzati, automazioni |
| **Studio — Confronto** | Prova del valore | "Senti la differenza" | Interruttore A/B durante la riproduzione | A/B istantaneo, possibilità di tornare indietro | Confronto tra più identità affiancate, loop su sezioni |
| **Studio — Export** | Consegna | "Il tuo brano è pronto" | Scarica il file | Download WAV, riepilogo delle scelte fatte | MP3/formati multipli, export per piattaforma (TikTok, Spotify), condivisione diretta |
| **Libreria** | Continuità | "Il tuo lavoro è qui, e ci puoi tornare" | Apri/riprendi progetto | Lista progetti con stato, identità, data; riapertura | Cartelle, tag, ricerca, ordinamenti |
| **Profilo** | Identità utente | "Questo è il tuo spazio" | Gestione preferenze base | Nome, riepilogo attività minimo | Account reali, piani, fatturazione, statistiche |

---

## 6. Confine tra le fasi

Questa separazione è la lezione più importante del progetto: la confusione tra prototipo, MVP e futuro è stata la prima causa di dispersione. Ogni funzione, prima di essere toccata, deve avere una risposta alla domanda: *in quale fase vive?*

### Fase 1 — Prototipo interattivo (ADESSO)
- **Obiettivo:** validare flusso, linguaggio e percezione di valore. Deve far dire "ho capito, lo voglio" a un artista in 3 minuti di prova.
- **Livello di realismo:** il *flusso* è reale e completo; l'*intelligenza* è semplificata. L'elaborazione audio usa catene di effetti predefinite per identità (reali ma non adattive), l'analisi è reale ma di base. Niente server, niente account: tutto vive nel browser.
- **Include:** tutto il flusso da Home a Export, le identità sonore curate, l'A/B, la libreria locale, l'export WAV.
- **Esclude:** backend, autenticazione, pagamenti, elaborazione adattiva per brano, qualità da mastering professionale.
- **Perché la separazione conta:** il prototipo risponde alla domanda "il prodotto ha senso?", non "il prodotto è potente?". Mischiare le due domande significa non rispondere a nessuna.

### Fase 2 — MVP reale
- **Obiettivo:** un prodotto usabile da utenti veri sui loro brani veri, con risultati che reggono il confronto con i tool automatici esistenti.
- **Livello di realismo:** elaborazione audio adattiva (l'identità si applica in modo diverso a seconda dell'analisi del brano), account utente, progetti persistenti lato server.
- **Include:** backend di elaborazione, autenticazione, libreria cloud, export in più formati, le stesse identità del prototipo ma rese adattive.
- **Esclude:** monetizzazione complessa, funzioni social, mobile app, identità generate su misura.
- **Perché la separazione conta:** l'MVP eredita dal prototipo un flusso *già validato*; deve investire solo dove il prototipo era finto, non riaprire il design.

### Fase 3 — Fase successiva
- **Obiettivo:** differenziazione e crescita.
- **Include (candidati, non impegni):** identità su misura generate dall'AI, export per piattaforma, confronto con brani di riferimento, piani a pagamento, collaborazione.
- **Esclude per principio:** tutto ciò che trasforma il prodotto in DAW o in aggregatore di funzioni AI.
- **Perché la separazione conta:** è il parcheggio ufficiale delle buone idee. Un'idea in Fase 3 non è rifiutata: è in attesa che le fasi 1 e 2 la guadagnino.

---

## 7. Ordine di costruzione

Blocchi sequenziali; un blocco si apre solo quando il precedente è chiuso.

1. **Fondamenta.** Struttura dell'app, navigazione tra schermate, modello dei dati di progetto, persistenza locale. *Perché primo:* tutto il resto vi appoggia sopra; rifarle a metà strada costa il doppio. *Rischio evitato:* costruire schermate orfane non collegate da un flusso.
2. **Flusso principale.** Il percorso completo Nuovo progetto → Analisi → Identità → Personalizzazione → Confronto → Export, anche in versione essenziale. *Perché secondo:* il valore del prodotto è il flusso intero, non le singole schermate; va percorribile da subito, end-to-end. *Rischio evitato:* perfezionare una schermata mentre il percorso complessivo resta rotto.
3. **Credibilità del prototipo.** Audio reale: analisi vera del file, identità che si sentono davvero, A/B istantaneo, export funzionante. *Perché terzo:* trasforma il prototipo da "mockup cliccabile" a "esperienza convincente"; arriva dopo il flusso perché la credibilità senza percorso non si può giudicare. *Rischio evitato:* un demo che non convince nessuno perché "non si sente niente".
4. **Libreria e profilo.** Persistenza dei progetti, riapertura, profilo minimo. *Perché quarto:* è la continuità, importante ma non dimostrabile prima che esista qualcosa da salvare. *Rischio evitato:* investire in gestione di contenuti prima che i contenuti abbiano valore.
5. **Demo e rifinitura.** Brano demo integrato, micro-copy, stati vuoti, gestione errori, coerenza visiva. *Perché quinto:* è ciò che rende il prototipo presentabile a terzi senza accompagnamento. *Rischio evitato:* mostrare il prodotto nel momento sbagliato e bruciare la prima impressione.
6. **Backend futuro (Fase 2).** Si apre solo dopo la validazione del prototipo con utenti reali. *Perché ultimo:* è l'investimento più costoso e dipende da ciò che la validazione conferma o smentisce. *Rischio evitato:* costruire infrastruttura per un flusso che poi cambia.

---

## 8. Lezioni apprese

**Cosa abbiamo capito.**
- Costruire prima di perimetrare produce lavoro che va buttato: il costo non è il tempo di costruzione, è il tempo di disfare.
- "Prototipo", "MVP" e "futuro" non sono gradi di finitura della stessa cosa: sono oggetti con scopi diversi, e trattarli come uno solo genera ambiguità su ogni singola decisione.
- Migliorare più aree contemporaneamente significa non finirne nessuna e non poter valutare nessun miglioramento.
- I dettagli tecnici presi troppo presto diventano vincoli; presi al momento giusto diventano scelte.
- Senza una fonte unica di verità, ogni sessione di lavoro riparte da una ricostruzione della memoria, e ogni ricostruzione introduce derive.

**Cosa dobbiamo evitare.** Allargare il perimetro durante la costruzione; aprire un blocco prima di chiudere il precedente; discutere di Fase 2 mentre si lavora alla Fase 1; aggiungere schermate o funzioni non presenti in questo piano senza prima aggiornare il piano.

**Regole operative da qui in avanti.**
1. Ogni sessione di lavoro inizia leggendo la fonte di verità e finisce aggiornandola.
2. Ogni richiesta nuova viene prima classificata per fase (1, 2 o 3) e solo dopo, eventualmente, lavorata.
3. Una sola priorità attiva per volta, scritta nella fonte di verità.
4. Ciò che nel prototipo è simulato o semplificato va dichiarato esplicitamente, mai mascherato.

---

## 9. Principi guida

1. **Chiarezza prima della complessità.** Tra una soluzione potente e una comprensibile, vince la comprensibile. La potenza si aggiunge; la confusione non si toglie.
2. **Una priorità per volta.** In ogni momento esiste un solo blocco attivo. Tutto il resto è annotato e fermo.
3. **Prima il flusso, poi la profondità.** Un percorso completo e superficiale vale più di un passaggio perfetto e isolato.
4. **Il linguaggio è prodotto.** Ogni parola visibile all'utente parla la lingua dell'artista. Un termine tecnico nell'interfaccia è un bug.
5. **Demo dichiarato, mai mascherato.** Ciò che è simulato si dichiara nel codice e nella documentazione. L'utente può non saperlo; noi sì, sempre.
6. **Il valore deve sentirsi, non spiegarsi.** Ogni schermata si giudica con una domanda: l'utente percepisce valore qui, o deve fidarsi sulla parola?
7. **Nessuna ambiguità su cosa si costruisce ora.** Se non è chiaro in quale fase vive una funzione, il lavoro si ferma finché non è chiaro.
8. **Il perimetro si cambia solo per iscritto.** Allargare o spostare il perimetro è legittimo, ma passa da un aggiornamento della fonte di verità, non da una decisione estemporanea.

---

## 10. Fonte di verità del progetto

**Ruolo.** [`FONTE_DI_VERITA.md`](./FONTE_DI_VERITA.md) è l'unico documento che descrive lo stato corrente del progetto. Il piano (questo documento) è la mappa; la fonte di verità è il "ci troviamo qui". In caso di conflitto tra memoria, conversazioni e documenti, vince la fonte di verità.

**Sezioni che contiene.**
1. *Stato attuale* — fase in corso, blocco attivo, ultima cosa completata.
2. *Priorità corrente* — una sola, esplicita.
3. *Perimetro adesso* — cosa è in lavorazione in questa fase, cosa è esplicitamente fuori.
4. *Decisioni prese* — registro datato delle scelte di prodotto, con motivazione in una riga.
5. *Cose simulate nel prototipo* — l'elenco onesto di ciò che è semplificato e andrà reso reale nell'MVP.
6. *Parcheggio idee* — idee valide non in lavorazione, con la fase di destinazione.
7. *Diario degli aggiornamenti* — data e sintesi di ogni modifica al documento.

**Come si aggiorna.** A fine di ogni sessione di lavoro significativa; a ogni decisione di prodotto; a ogni cambio di perimetro. Mai retroattivamente a memoria.

**Perché è fondamentale.** Il progetto è portato avanti in sessioni discontinue, anche con strumenti AI: ogni interlocutore (umano o no) deve poter ricostruire lo stato esatto in due minuti di lettura. Senza questo, ogni sessione riparte da interpretazioni, e le interpretazioni divergono.

---

## 11. Idee di miglioramento e opportunità di mercato

Proposte ragionate, ciascuna con bisogno intercettato, valore, fase di destinazione e priorità.

### A. Pre-ascolto delle identità prima di sceglierle — **importante, Fase 1 (inclusa nel prototipo)**
- *Bisogno:* scegliere una direzione sonora senza sentirla è scegliere al buio; l'utente target decide con le orecchie.
- *Mercato:* nessun tool di mastering automatico permette di confrontare direzioni *prima* di committarsi; tutti fanno elaborare e poi giudicare.
- *Valore:* trasforma la schermata-cuore del prodotto da "menu" a "esperienza"; è il momento di delizia del demo.

### B. Export pensato per piattaforma (Spotify, TikTok/Reels, YouTube) — **importante, Fase 2**
- *Bisogno:* l'utente non pubblica "un file", pubblica *su una piattaforma*, e ogni piattaforma ha standard di volume e formato diversi che oggi ignora o subisce.
- *Mercato:* è un linguaggio che i creator capiscono immediatamente ("versione per TikTok") e che i tool concorrenti trattano come dettaglio tecnico (LUFS target) invece che come scelta d'uso.
- *Valore:* rafforza la promessa "pronta all'uso" in modo concreto e differenziante. Prematuro in Fase 1: richiede elaborazione affidabile prima.

### C. Confronto con un brano di riferimento ("voglio che suoni come...") — **potenzialmente molto differenziante, Fase 3**
- *Bisogno:* gli artisti descrivono il suono che vogliono citando brani, non aggettivi. È il modo naturale in cui già parlano con i fonici.
- *Mercato:* il reference matching esiste solo in tool professionali (Ozone) con UX tecnica; nessuno lo offre in linguaggio artista.
- *Valore:* potrebbe diventare *la* funzione identitaria del prodotto. **Direzione forte non considerata nel brief originale: merita un'evidenza esplicita.** Ma è rischiosa e prematura: tecnicamente impegnativa e con aspettative facili da deludere. Va prototipata solo dopo un MVP solido.

### D. "Scheda d'ascolto" condivisibile del brano — **utile, Fase 3**
- *Bisogno:* gli artisti cercano feedback prima della release; oggi mandano file nudi su WhatsApp.
- *Mercato:* crea un anello di viralità organica (chi riceve la scheda scopre il prodotto), il canale di crescita più adatto a questo segmento.
- *Valore:* trasforma un tool individuale in un oggetto sociale. Da non toccare prima che il valore individuale sia provato: una funzione sociale su un prodotto vuoto amplifica il nulla.

### E. Versioni multiple esportate insieme (es. "pulita + da club") — **utile, Fase 2**
- *Bisogno:* il caso d'uso reale dei producer (gruppo B): lo stesso brano serve in contesti diversi.
- *Mercato:* i tool a consumo fanno pagare per ogni master; offrirne varianti nello stesso flusso è una differenza percepibile.
- *Valore:* aumenta il valore percepito di ogni progetto a costo incrementale basso, dato che il flusso di identità multiple esiste già.

### F. Memoria del gusto ("firma sonora" dell'utente) — **opzionale, Fase 3**
- *Bisogno:* un artista tende a una coerenza sonora tra brani; oggi la ricostruisce a mano ogni volta.
- *Mercato:* nessun tool automatico ha memoria del gusto dell'utente; è una retention feature naturale.
- *Valore:* interessante ma affascinante-e-prematura: richiede molti progetti per utente prima di avere senso. Da rivalutare con dati reali.

### G. Registrazione diretta dal microfono — **da rifiutare per ora (rischio perimetro)**
- Sembra naturale ("così l'utente non ha bisogno di file"), ma sposta il prodotto verso la registrazione e quindi verso la DAW, violando l'identità definita al punto 1. Si annota e non si lavora.

### H. Suggerimento automatico dell'identità sonora — **realizzato (Fase 1→2, primo passo "copilota")**
- *Bisogno:* l'utente target decide con le orecchie ma non sa da dove partire; offrire solo opzioni lo lascia solo davanti alla scelta.
- *Mercato:* i tool automatici danno "un master"; nessuno *consiglia una direzione* spiegando il perché in linguaggio non tecnico.
- *Valore:* è il momento in cui l'app smette di sembrare un menu e diventa un copilota che "ha ascoltato". Realizzato confrontando l'analisi del brano con il carattere di ogni identità (consigliata + 2 alternative + motivazione, con preselezione che resta scavalcabile).

### I. Snippet/highlight social nel release package — **utile, MVP (candidato prossimo step)**
- *Bisogno:* pubblicare non è solo "un file pronto" ma anche "qualcosa con cui promuoverlo"; il momento più forte del brano è ciò che serve per social.
- *Mercato:* coerente con la promessa "release package" e con il linguaggio dei creator, senza spostare il prodotto altrove.
- *Valore:* aumenta il valore del pacchetto restando dentro il perimetro "identità di un brano esistente". **Niente separazione stem.**

### J. Separazione stem (instrumental/acapella, trattamento voce/beat) — **fuori da prototipo/MVP, parcheggiata in fase futura**
- Comporterebbe isolare voce e base: è di fatto un altro prodotto (vedi punto 1, "Cosa non deve diventare"), richiede modelli AI/backend e aspettative facili da deludere. Decisione del product owner (2026-06-10): valida ma rimandata, non nel perimetro attuale.

**Sintesi delle priorità strategiche:** A e H dentro il prototipo/copilota; B, E ed I (snippet) come differenziatori dell'MVP; C come scommessa identitaria di Fase 3 da tenere d'occhio; D ed F in parcheggio; G e J (stem) fuori dal perimetro attuale.

---

## 12. Conclusione operativa

**Sintesi.** AI Sonic Director è il direttore artistico sonoro per artisti indipendenti: trasforma un brano grezzo in versioni con identità sonore diverse, confrontabili all'ascolto ed esportabili, attraverso un flusso che non richiede competenza tecnica. Si costruisce in tre fasi nettamente separate — prototipo per validare il senso, MVP per validare la qualità, fase successiva per differenziare — e in sei blocchi ordinati, con una fonte di verità che àncora ogni sessione di lavoro.

**Punti da bloccare prima di costruire.**
1. Il target primario è il Gruppo A (artisti indipendenti); tutto si progetta per loro.
2. Il prototipo è frontend-only, con elaborazione semplificata ma udibile, e lo dichiara.
3. Le identità sonore sono 5-7, curate, con nome e caso d'uso: sono il cuore del prodotto e del linguaggio.
4. Niente DAW, niente registrazione, niente funzioni social fino a dopo l'MVP.
5. La fonte di verità si aggiorna a ogni sessione, senza eccezioni.

**Primo blocco dopo l'approvazione:** *Fondamenta* (blocco 1), seguito immediatamente da *Flusso principale* (blocco 2) — perché solo un percorso end-to-end percorribile permette di giudicare tutto il resto.
