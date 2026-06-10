# AI Sonic Director — Visione finale ufficiale del prodotto

> Documento guida approvato dal product owner (2026-06-10).
> Tutte le decisioni di prodotto future si misurano contro questo documento.
> Non è un documento tecnico: descrive l'app finale dal punto di vista dell'artista.
> La roadmap per arrivarci è in [`FONTE_DI_VERITA.md`](./FONTE_DI_VERITA.md) §8.

---

## 1. Cosa trova un artista dentro l'app

**Esperienza iniziale.** L'artista arriva con una traccia grezza — una bounce dal telefono,
un vocale, un export veloce dalla DAW — e in meno di un minuto la sta già ascoltando dentro
l'app. Nessun account obbligatorio per provare, nessun form lungo, nessun tutorial. Un solo
gesto chiaro: "porta qui il tuo brano". Prima ancora di confermare, può riascoltare il file
che sta per caricare: l'app non gli chiede mai fiducia al buio.

**La sensazione.** Quella di entrare in uno studio dove qualcuno competente *ha già ascoltato
il pezzo* e ha qualcosa di sensato da dire. Non un convertitore di file, non un upload form:
un posto dove il brano viene trattato sul serio. L'app parla per prima — "ecco cosa abbiamo
sentito" — e parla la lingua dell'artista, mai quella del fonico.

**Cosa capisce subito.** Tre cose, nei primi due minuti:
1. il suo brano è stato davvero analizzato (numeri e osservazioni che riconosce come vere);
2. esiste una direzione consigliata *per quel brano specifico*, con un motivo comprensibile;
3. può sentire il prima/dopo all'istante, mentre il pezzo suona — la prova è nelle orecchie.

**Cosa può fare senza essere tecnico.** Tutto il percorso principale: caricare, capire il
ritratto del brano, scegliere (o accettare) un'identità sonora, rifinire con quattro
controlli in linguaggio musicale (Calore, Punch, Brillantezza, Spazio), confrontare,
uscire con un pacchetto pronto da pubblicare. Zero parametri da ingegnere nel percorso base.

**Perché dice "questa fa per me".** Perché l'app prende le decisioni che lui non sa o non
vuole prendere — *che sound dare al pezzo* — senza togliergli la scelta, e perché ciò che
scarica suona davvero meglio di ciò che ha caricato, su ogni piattaforma dove lo metterà.

## 2. Quale problema risolve davvero

Il problema non è "il mix è brutto". Il problema è **il vuoto tra il demo e la release**:

- L'artista indipendente finisce il pezzo creativamente, ma non sa portarlo a uno standard
  pubblicabile: non sa mixare, non sa masterizzare, non sa cosa siano i loudness target.
- Anche prima della tecnica, manca la **decisione**: che identità deve avere questo pezzo?
  Più scuro? Più radio? Più aggressivo per i social? Nessun tool oggi aiuta a *scegliere*.
- Le alternative attuali falliscono ai due estremi: le DAW chiedono competenza e ore;
  i mastering automatici sono scatole opache (carichi → paghi → scarichi) che non spiegano
  nulla, non fanno scegliere nulla e restituiscono un solo file.
- Chi invece un po' di controllo lo vuole, non vuole comunque perdere una giornata: vuole
  intervenire su ciò che conta e basta.

AI Sonic Director risolve esattamente questo: **trasforma il passaggio demo→release da
problema tecnico a scelta artistica guidata**, in minuti invece che giorni, con risultati
verificabili a orecchio e output già pronti per ogni destinazione.

## 3. Le funzioni dell'app finale, per area di prodotto

### Upload / input
- Caricamento da file, drag&drop, e dal telefono con lo stesso livello di cura.
- **Pre-ascolto del file prima di confermare** il caricamento.
- Supporto dei formati che gli artisti usano davvero, inclusi vocali WhatsApp e bounce
  veloci; mai un rifiuto inspiegato.
- Brano demo integrato per provare il flusso senza avere un file a portata di mano.
- Più tracce nello stesso progetto (v1, v2, take alternative dello stesso brano).

### Analisi ("il ritratto del brano")
- Volume, dinamica, bilanciamento tonale, **BPM e tonalità**.
- Diagnosi specifiche in linguaggio artista (bassi che impastano, voce coperta, alti duri).
- Posizionamento rispetto agli standard del contesto ("rispetto ai pezzi che girano in
  playlist, il tuo è…"), mai numeri nudi.
- L'analisi è il momento-fiducia: deve sembrare l'orecchio di un professionista, non un report.

### Identità sonora (il cuore del prodotto)
- Catalogo curato di direzioni con nome, carattere e caso d'uso — non preset tecnici.
- **Suggerimento "copilota"**: l'app consiglia la direzione giusta per quel brano, spiega
  perché, propone alternative, lascia sempre l'ultima parola all'artista.
- Pre-ascolto istantaneo di ogni identità *sul proprio brano*, non su esempi.
- Le identità si adattano a ciò che l'analisi ha misurato: la stessa identità non suona
  identica su due brani diversi.

### Personalizzazione
- Percorso base: poche macro in linguaggio musicale, effetto udibile in tempo reale.
- Percorso expert: più profondità sugli stessi pannelli (vedi §4), sempre in linguaggio
  musicale, mai da manuale di plugin.
- Le rifiniture sopravvivono a cambi di identità e di sessione.

### Processing audio
- Qualità da prodotto: ciò che ascolti è esattamente ciò che esporti.
- Loudness conforme agli standard reali delle piattaforme, vero controllo dei picchi,
  nessun file che distorce o che le piattaforme riabbassano.
- Velocità: l'attesa percepita deve essere sempre breve e sempre spiegata.

### Confronto versioni
- A/B istantaneo originale/lavorato mentre il brano suona (mai stop-and-restart).
- Confronto tra due identità diverse sullo stesso brano.
- (Fase avanzata) confronto con un brano di riferimento scelto dall'artista.

### Export
- WAV **e MP3**; nomi file puliti e pronti da inviare.
- Volume tarato per destinazione: l'artista sceglie *dove pubblicherà*, non un numero.
- Export di tutte le versioni in un click.

### Release package (la promessa finale)
- Un solo gesto: esci con Master + versione Streaming + versione Social + **snippet
  social pronto** (il momento più forte del brano, già al volume giusto).
- L'unità di valore dell'app non è "un file": è "tutto quello che ti serve per pubblicare".

### Libreria / catalogo
- Tutti i progetti, con stato, identità scelta e storia delle versioni.
- I progetti seguono l'artista (account/cloud), non muoiono in un browser.
- Riaprire un brano e provare un'altra direzione è sempre possibile e senza perdite.

### Collaborazione
- Link d'ascolto condivisibile: chi lo riceve sente il prima/dopo senza installare nulla.
- Feedback leggero sul progetto (per producer, manager, soci del collettivo).
- Piccoli team: più persone sullo stesso catalogo.

### Mobile / share
- Esperienza mobile completa, non ridotta: il telefono è dove vivono i brani grezzi.
- "Condividi verso l'app" dal telefono (incluso da WhatsApp, dove arrivano i pezzi).
- Snippet condivisibile direttamente verso i social dal telefono.

### Elementi virali / condivisibili
- Lo **snippet social** è l'oggetto virale primario: è il pezzo dell'artista, già pronto.
- La **scheda d'ascolto prima/dopo**: un link pubblico dove chiunque sente la differenza —
  ogni condivisione è una demo del prodotto fatta col brano di qualcun altro.
- Il release package inoltrabile a manager/etichette: l'app entra nelle conversazioni
  professionali dell'artista.

### Retention / motivi per tornare
- Il motivo strutturale: **ogni nuovo brano è un ritorno**. L'app deve essere il riflesso
  condizionato post-bounce.
- La libreria come catalogo del proprio percorso sonoro.
- La "firma sonora": l'app impara le preferenze dell'artista e le ripropone.
- Nuove identità nel tempo (curate, non infinite): un motivo per riaprire vecchi brani.

## 4. Modalità automatica e modalità expert

**Automatica (il percorso di default).** Carichi → l'app analizza → consiglia un'identità
con il perché → ascolti l'A/B → rifinisci con 4 macro se vuoi → esci col release package.
Cinque minuti, zero gergo, decisioni proposte ma mai imposte.

**Expert (la profondità, a richiesta).** Negli *stessi* pannelli, l'utente avanzato apre un
livello in più: controllo per zone di frequenza, comportamento della dinamica, carattere
della saturazione e dello spazio, target di loudness per l'export — sempre con nomi
musicali e spiegazioni, mai con la terminologia dei plugin. Più scelte, stesso linguaggio.

**Perché servono entrambe.** L'automatica è la promessa ("non devi ragionare da fonico");
l'expert è la credibilità e la retention (l'utente che cresce non deve andarsene verso una
DAW). Senza automatica il prodotto non è differenziante; senza expert ha un soffitto basso.

**Come evitare che sembrino due app.** Non sono due modalità con uno switch globale: expert
è **"apri il cofano" dentro il flusso unico**. Stesso percorso a step, stessi pannelli; ogni
pannello ha un livello di profondità in più per chi lo cerca. Niente menù separati, niente
"interfaccia pro" con un'estetica diversa.

**Percorso di crescita naturale.** L'utente parte in automatica; la prima volta che una
macro non gli basta ("vorrei più punch ma solo sulla cassa") scopre il livello sotto. Le
scelte fatte in expert vengono spiegate nello stesso linguaggio dell'automatica, così il
ritorno al percorso semplice è sempre possibile.

## 5. Come deve essere l'app per sembrare davvero forte

- **Sensazione:** studio professionale che ti accoglie, non tool che ti esamina. Calma,
  competenza, zero rumore.
- **Flusso:** corto, lineare, sempre reversibile. In ogni momento è chiaro dove sei, cosa
  succede dopo, e che non puoi rompere niente.
- **Non deve mai sembrare:** una demo fragile (errori muti, file rifiutati senza motivo,
  attese senza spiegazione, dati che spariscono); un giocattolo (effetti caricaturali,
  wow di plastica); un esame (gergo, numeri nudi, opzioni che mettono ansia).
- **Cosa fa percepire valore vero:** l'A/B onesto e istantaneo (il valore si *sente*, non
  si legge); l'analisi che dice cose vere e specifiche sul *tuo* brano; il perché dietro
  ogni consiglio; output che funzionano davvero dove li porti; la cura nei dettagli dei
  primi 60 secondi — è lì che si decide la fiducia.

## 6. Come può diventare virale (meccanismi di prodotto, non marketing)

1. **Lo snippet è l'unità virale.** L'artista condivide il suo momento migliore perché è
   *suo* e suona bene: ogni snippet che gira è il prodotto che si dimostra da solo.
2. **La scheda d'ascolto prima/dopo** (link pubblico): il momento wow dell'A/B reso
   condivisibile. "Senti cosa ha fatto al mio pezzo" è un messaggio che gli artisti si
   mandano già tra loro; l'app deve solo dargli un link.
3. **Il release package come oggetto professionale:** mandato a producer, manager,
   etichette — l'app entra nei canali dove si decidono le carriere.
4. **L'invito che è un favore, non un referral:** "caricalo qui e senti" è un consiglio
   tra colleghi; il loop di inviti deve avere questa forma, non quella del coupon.
5. **Il momento wow è sempre lo stesso ed è ripetibile:** il primo A/B sul proprio brano.
   Tutto il funnel virale deve portare nuove persone a quel momento nel minor tempo possibile.
6. **Loop di ritorno naturale:** ogni nuovo brano, ogni nuova identità pubblicata, ogni
   feedback ricevuto su un link condiviso riporta dentro l'app.

## 7. Cosa NON dobbiamo diventare

- **Non una DAW nel browser:** niente timeline, niente editing multitraccia, niente
  plugin-rack infinito. Se una funzione richiede di "arrangiare", è fuori.
- **Non un generatore musicale:** l'app non crea brani, non aggiunge note, non inventa
  contenuto. Lavora *sul* brano dell'artista; la paternità resta intoccabile.
- **Non un tool tecnico incomprensibile:** se una schermata richiede di sapere cosa sia un
  ratio o un LUFS per essere usata, è sbagliata — anche in expert.
- **Non un sito di mastering vuoto:** mai "carica → paga → scarica" senza scelta, ascolto
  e spiegazione. La differenza siamo: direzione artistica, confronto, trasparenza, pacchetto.

## 8. Definizione finale del prodotto

- **Secca:** AI Sonic Director è il posto dove un brano grezzo trova la sua identità sonora
  ed esce pronto da pubblicare.
- **Positioning:** Dal demo alla release in minuti: direzione artistica guidata, versioni
  vere per ogni piattaforma, snippet pronti per i social — senza ragionare da fonico.
- **Emotiva (per l'artista):** Il tuo pezzo ce l'hai già in testa: manca solo farlo suonare
  così. Portalo qui grezzo. Lo ascoltiamo, gli diamo il carattere giusto, e ne esci con
  tutto quello che ti serve per farlo sentire al mondo.

---

## VISIONE FINALE UFFICIALE DEL PRODOTTO

AI Sonic Director è il **direttore artistico del suono** per artisti indipendenti, rapper,
producer, creator e piccoli team: l'app in cui si entra con una traccia grezza e si esce con
un brano migliorato davvero, più direzioni sonore credibili tra cui scegliere con le
orecchie, versioni esportate al volume giusto per ogni piattaforma, uno snippet pronto per i
social e la sensazione netta di aver preso una decisione artistica, non di aver usato un
tool tecnico. Percorso automatico per chi non vuole pensarci, profondità expert per chi
vuole controllo, un unico linguaggio: quello dell'artista. Il valore si dimostra sempre allo
stesso modo — il prima/dopo istantaneo sul proprio brano — e ogni output (snippet, scheda
d'ascolto, release package) è costruito per essere condiviso e portare dentro il prossimo
artista.

### Contraddizioni note tra visione e prototipo attuale (da audit 2026-06-10)

| Visione | Prototipo oggi |
|---|---|
| Pre-ascolto prima del caricamento | Assente |
| "Supporta i file che gli artisti usano davvero" | Vocali WhatsApp `.opus` respinti; file corrotti creano progetti orfani |
| Analisi = momento-fiducia (BPM, tonalità, diagnosi) | Solo volume/dinamica/bande; insight a template |
| "AI" / copilota | Suggerimento a regole fisse (onesto ma da rafforzare con analisi più ricca) |
| Snippet "pronto per i social" | Solo WAV: poco pratico da condividere |
| Loudness standard e picchi controllati | RMS approssimato, gain ceiling al posto di un vero limiter |
| Catalogo che segue l'artista | Libreria nel browser: si perde cambiando dispositivo o pulendo i dati |
| Collaborazione, link d'ascolto, share mobile | Inesistenti (nessun backend, nessuna PWA) |
| Modalità expert | Inesistente (solo 4 macro) |

Queste distanze non si colmano aggiungendo feature sopra la base attuale: si colmano con la
roadmap A/B/C e il metodo in FONTE_DI_VERITA §8 — **prima la base eccellente, poi l'espansione**.

---

## POSSIBILI AGENTI AI INTERNI DEL PRODOTTO

> **Regola strategica (decisione del PO, 2026-06-10, parte del metodo ufficiale):**
> l'app può dotarsi di agenti AI interni dedicati a funzioni specifiche, ma **solo** se un
> agente: (1) risolve un problema utente concreto; (2) fa meglio di una regola fissa o di
> un'automazione semplice; (3) rende l'esperienza più utile, forte o memorabile;
> (4) non complica il flusso principale; (5) è coerente con la visione finale;
> (6) non trasforma l'app in un giocattolo o in una chat inutile.
> Gli agenti sono **strumenti invisibili** dentro il flusso, mai gimmick da mostrare.
> La priorità resta sempre la roadmap A/B/C: niente agenti prima che la base sia eccellente.

**Vincolo strutturale onesto:** un agente AI vero richiede chiamate a un modello, quindi un
backend (o almeno una gestione chiavi/costi). Finché il prodotto è frontend-only, qualunque
agente è di fatto vincolato a C1 (account/cloud) o a un micro-backend dedicato. Questo da
solo colloca tutti gli agenti **dopo** il Livello A e in pratica non prima del Livello B/C.

### Utili nel breve/medio termine (primi candidati seri)

**1. L'orecchio che spiega (agente di analisi narrativa)** — dopo B1.
- *Problema utente:* l'analisi è il momento-fiducia, ma osservazioni a template diventano
  ripetitive e generiche già al secondo brano caricato; l'artista smette di crederci.
- *Perché serve davvero:* trasforma le misure (volume, dinamica, bande, BPM, tonalità) in un
  ritratto specifico e non ripetitivo del brano, in linguaggio da artista. È il cuore della
  promessa "l'app ha ascoltato il tuo pezzo".
- *Perché non basta una regola:* la specificità nasce dall'incrocio di molte misure insieme;
  coprirla a regole esplode in combinazioni e suona comunque uguale per brani simili.
- *Rischio:* inventare cose non misurate. Mitigazione obbligatoria: l'agente può parlare
  **solo** dei dati dell'analisi, mai oltre. Più costo per brano e latenza da gestire.

**2. Il traduttore del confronto (agente che motiva le differenze tra versioni)** — dopo B5.
- *Problema utente:* l'A/B si *sente*, ma l'artista spesso non sa *dire* cosa è cambiato —
  e per condividere/difendere una scelta (col producer, col manager) servono parole.
- *Perché serve davvero:* dà all'artista il vocabolario della propria decisione; rende la
  scheda d'ascolto condivisibile (C2) molto più forte.
- *Perché non basta una regola:* stessa ragione del punto 1 — il delta tra due versioni è
  multidimensionale e va raccontato, non elencato.
- *Rischio:* ridondanza (l'A/B parla già da sé). Va introdotto solo se gli utenti chiedono
  "ma cosa è cambiato?" nella validazione.

### Interessanti ma prematuri

**3. Reference → scelte pratiche ("voglio che suoni tipo X")** — non prima di C.
- *Problema utente:* l'intenzione artistica nasce quasi sempre da riferimenti; oggi nessun
  tool la traduce in scelte concrete. Differenziazione potenzialmente enorme.
- *Perché è prematuro:* richiede analisi ricca (B1), confronto con riferimento (C5) e
  gestione dei diritti sull'audio di riferimento. Prima di quelle basi è una promessa vuota.

**4. Firma sonora (agente che impara le preferenze nel tempo)** — non prima di C1.
- *Problema utente:* retention e personalizzazione vera ("l'app mi conosce").
- *Perché è prematuro:* senza account e storico (C1) non c'è nulla da imparare. Qualunque
  versione precedente sarebbe finta — esattamente la "fuffa AI" da evitare.

### Da evitare (per ora o per sempre)

**5. Agente che pilota direttamente il processing audio.** Il processing deve essere
deterministico, riproducibile e prevedibile: è la base della fiducia ("ciò che ascolti è ciò
che esporti"). Le regole adattive clampate fanno questo lavoro meglio di un modello, a costo
zero e senza sorprese. Criterio 2 fallito.

**6. Agente "costruttore del release package".** La mappa destinazione→formato/volume è una
tabella, non un problema di intelligenza. Una regola fissa è più affidabile. Criterio 2 fallito.

**7. Chat assistant generico dentro l'app.** Vietato dalla visione (§7): trasforma il
prodotto in un giocattolo, complica il flusso, non risolve nessun problema specifico.

**8. "Agente suggeritore di identità" come agente separato.** La *scelta* dell'identità
funziona già a regole (e deve restare spiegabile); ciò che un modello migliorerebbe è la
*motivazione testuale* — che è già il lavoro dell'agente 1. Non duplicare.

### Conclusione operativa

**Nessun agente è prioritario adesso.** Il Livello A non ne ha bisogno e il vincolo backend
li rende comunque non implementabili oggi. Il primo candidato reale è **"l'orecchio che
spiega"**, da rivalutare alla chiusura di B1 (quando l'analisi avrà BPM e tonalità da
raccontare) e con una decisione esplicita del PO su costi e infrastruttura.
