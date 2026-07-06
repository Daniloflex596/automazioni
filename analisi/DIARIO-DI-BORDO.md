# DIARIO DI BORDO — Arkadia Pub (sito immersivo 3D)

> Memoria di prima mano dell'ingegnere che ha co-sviluppato il sito. Questo
> documento NON descrive il risultato: descrive **come ci siamo arrivati** —
> il primo prototipo, i vicoli ciechi, gli errori con sintomo→causa→fix, i
> criteri con cui ho deciso i percorsi camera e con cui verificavo il layout
> su desktop e mobile. È la parte che nessun reverse-engineering del bundle
> può ricostruire.

Repo: `Daniloflex596/automazioni` · sorgente in `arkadia-site/` (Astro).
Motore 3D: `src/three/pub3d.js` (mondo pieno), `src/three/calice3d.js`
(fallback, fossile del concept originale), `src/three/arredo3d.js` (set
dressing isolato dietro flag), `src/three/icone3d.js` (renderer icone /menu).
Orchestrazione scroll: `src/scroll/pub.js` (home), `src/scroll/menu.js`
(sottopagina), `src/scroll/experience.js` (fallback calice).

---

## 1. GENESI E PERCORSO (dal git, in ordine reale)

Il progetto non è nato "Pub Infinito". Ha attraversato tre concezioni diverse.
La cosa più istruttiva è che **il fallback attuale è il fossile del primo
concept**: leggere `calice3d.js`/`experience.js` significa leggere la V1.

### V1 — "Il calice che si versa" (commit `c652db5`, 1 lug)
Primo prototipo funzionante: **un solo oggetto 3D** (un calice/bicchiere) al
centro, che **si riempie di birra man mano che scrolli**. La metafora: "più
scorri, più si versa". Un unico `fill` 0→1 pilotato dallo scroll guida il
livello del liquido. Niente movimento nello spazio: la camera è ferma,
l'animazione è l'oggetto. Le sezioni HTML (storia, birre, cucina…) scorrevano
sopra come overlay. Questo motore è ancora vivo come **fallback** per
dispositivi deboli/no-WebGL/reduced-motion.

Perché partire di lì: volevo il **rischio minimo** — un solo mesh, un solo
parametro, verificare che scroll↔stato funzionasse fluido prima di costruire
un mondo. È stata la decisione giusta: la "spina dorsale" (scroll guida un
progresso 0→1, il render insegue con damping) è la stessa che ha poi retto
tutto il mondo grande.

### V2 — "Cinematografica" (commit `edf56c6`, 2 lug)
Aggiunta scenografia per sezione: set-piece 3D distinti (storia, tavola,
giochi, brindisi), texture procedurali di legno/muro, grana film, vignetta.
Qui compare il primo commit con `fix framerate` nel messaggio: la V2 ha
mostrato che con più oggetti l'animazione **legata al framerate** diventava
incoerente (vedi §2). È il momento in cui ho introdotto il **damping
frame-rate-independent**. Idea provata e **scartata** in questa fase: gli
"ologrammi" dei prodotti (un primo `Brexit` come ologramma fluttuante, commit
`41497b7`) — respinti perché "finti" e poco leggibili; li ho sostituiti con
oggetti fisici veri nella scena.

### V3 — "Il Pub Infinito" (commit `43dc79d`, 2 lug) — la svolta
La pivot: **un solo mondo 3D continuo** in cui la camera **viaggia** lungo un
corridoio-locale, e le zone del menu (cucina, friggitoria, dolci, bar, giochi)
sono **posti reali** nello spazio, non schermate separate. Da qui nasce la
**camera a doppio spline** (10 stazioni) e la fusione home↔/menu: la stessa
scena, due orchestrazioni di scroll diverse. Questa è l'architettura finale.

Evoluzione successiva (dai commit): integrazione zone menu nella home →
"metodo esperienza immersiva" codificato (2-3 prodotti reali per zona, in fila
lungo il percorso camera) applicato a birre/hamburger/friggitoria/dolci/
cocktail → mini-icone 3D per ogni voce del menu (un renderer condiviso) →
recensioni reali → copywriting → set dressing massiccio → **estrazione
dell'arredo in modulo isolato** dietro feature flag (`8583e88`) → carrello
WhatsApp → decine di rifiniture di camera e di fluidità mobile.

**Lezione di percorso**: la qualità non è arrivata da una grande idea, ma da
~60 commit di micro-correzioni verificate una a una. Il concept (mondo
navigabile) è stato deciso presto; il resto è stato *tuning ossessivo*.

---

## 2. CATALOGO DEGLI ERRORI E BUG (sintomo → causa → fix)

Questo è l'oro. Ogni voce è un errore **realmente** incontrato e risolto.

### 2.1 Jank/stutter — animazione legata al framerate
- **Sintomo**: la camera e le animazioni "scattavano", con morbidezza diversa
  tra dispositivi veloci e lenti; a basso framerate tutto rallentava.
- **Causa**: interpolazione con lerp a fattore FISSO (`x += (target-x)*0.1`)
  per frame. Il numero di frame al secondo cambia → la velocità effettiva
  cambia → il "feel" non è riproducibile.
- **Fix**: damping **frame-rate-independent**. Il fattore dipende dal delta
  time: `s = 1 - Math.pow(0.94, min(dt, 0.25) * 60)` e poi
  `renderT += (targetT - renderT) * s`. Così a 20 o 120 fps la stessa
  "morbidezza" nel tempo reale. Il `0.94` è la costante calibrata a mano
  (più vicino a 1 = più lento/pesante). Il `min(dt, 0.25)` evita salti dopo
  un freeze del tab.

### 2.2 Salto della camera al primo scroll su Chrome/Safari mobile
- **Sintomo**: entrando nel sito da smartphone, ai primissimi frame la scena
  "saltava in avanti" più del dovuto; da desktop e dal browser in-app no.
- **Causa doppia**:
  1. **La barra degli indirizzi di Chrome/Safari mobile collassa al primo
     scroll**, cambiando `window.innerHeight` di ~60px di colpo. Tutta la
     coreografia era calcolata su `innerHeight` → il cambio d'altezza faceva
     saltare il mapping scroll→camera. Il canvas del renderer, agganciato a
     `innerHeight`, si **ridimensionava** e l'inquadratura si spostava.
  2. La **prima tratta** del percorso (soglia→interno) era la più corta in
     scroll ma la più lunga in spazio 3D: partiva a velocità piena.
- **Fix**:
  1. **Viewport stabile**: un `probe` fisso alto `100vh` misura l'altezza
     "grande" (barra ritirata) che NON cambia durante lo scroll; renderer e
     camera nascono su quella misura, e il `resize` scatta solo su cambi veri
     (rotazione/larghezza), non sul collasso barra. In più `overflow-x: clip`
     + `overscroll-behavior` per inchiodare l'asse. E l'hero passa da `100svh`
     a `100lvh` (schermo pieno) così al collasso barra non spunta la sezione
     sotto (commit `79b5c07`, `6d52630`).
  2. **Smoothstep sulla prima tratta**: `f = f*f*(3-2f)` solo sul primo
     segmento → l'ingresso parte "in punta di piedi" (commit `49149fd`).

### 2.3 Micro-stutter al primissimo scroll da mobile (upload GPU pigro)
- **Sintomo**: anche sistemato il viewport, restava un micro-scatto ai primi
  frame quando un pezzo di scena entrava in campo per la prima volta.
- **Causa**: compilazione shader e upload texture **lazy** — avvengono la
  prima volta che quel materiale è visibile → hitch.
- **Fix**: **pre-warm GPU**. Prima di togliere il preloader, renderizzo la
  scena in 6 punti lungo tutto il percorso (`[0.06,0.18,0.35,0.55,0.75,0.95]`)
  così shader e texture sono già compilati/caricati (commit `0733692`).

### 2.4 193 warning in console dalla factory dei materiali
- **Sintomo**: `THREE.Material: 'r' is not a property of THREE.MeshStandardMaterial`
  (e `m/e/ei`) ripetuto ~193 volte. Innocuo ma rumoroso.
- **Causa**: la factory `mat(color, opts)` scriveva le proprietà giuste e poi
  faceva `...opts`, **ri-iniettando** le scorciatoie `r/m/e/ei` che Three non
  conosce → un warn per ognuna.
- **Fix**: **destrutturare ed escludere** le scorciatoie:
  `mat(color, { r=…, m=…, e=…, ei=…, ...rest }) => new MeshStandardMaterial({ color, roughness:r, …, ...rest })`.
  Solo `rest` (side/transparent/opacity/map…) passa. Verificato: da 193 a 0,
  materiali invariati (commit `ff44bc2`).

### 2.5 Camera troppo vicina/bassa in cucina (oggetti fuori quadro)
- **Sintomo**: i tre hamburger che si scompongono a strati uscivano dal quadro
  quando "esplodevano".
- **Causa**: apertura degli strati troppo ampia + stazione camera troppo
  bassa e vicina.
- **Fix**: apertura compattata (`off * 0.75`), lift ridotto (0.16), stazione
  rialzata, e **offset dei prodotti ruotati perpendicolari allo sguardo** così
  i tre stanno affiancati in quadro invece che uno dietro l'altro.

### 2.6 Hold camera troppo stretto sul /menu
- **Sintomo**: scrollando una categoria del menu, a fine sezione la camera era
  già "in viaggio" verso la successiva (spreco: non vedevi bene gli oggetti).
- **Causa**: le ancore di inizio/fine sezione avevano margine troppo largo
  (`vh*0.45`).
- **Fix**: margine ridotto a `min(h*0.5, vh*0.28)` e **due ancore per sezione**
  (la camera resta fissa/travelling per TUTTA la sezione, si sposta solo tra
  una categoria e l'altra) (commit `52960ad`).

### 2.7 Drink lontani / solo 2 visibili su mobile
- **Sintomo**: nella sezione cocktail da smartphone se ne vedevano solo due
  dei tre.
- **Causa**: FOV fisso troppo stretto in verticale (portrait).
- **Fix**: **FOV adattivo**: `fov = aspect < 0.8 ? 64 : 55` — in portrait
  allarga il campo. Più stazione avvicinata e un mini-travelling sui tre drink
  (range di stazioni) (commit `31db75a`).

### 2.8 Riempimento (spina/drink) che si "svuotava" a metà lista
- **Sintomo**: scrollando le birre, superata la fase iniziale la spina tornava
  vuota prima di lasciare la sezione.
- **Causa**: il livello era pilotato dalla `proximity` (0→1→0, picco al centro)
  → dopo il picco calava.
- **Fix**: `fillOnce()` — riempimento **persistente**:
  `clamp01((scrollY + vh*0.6 - top) / (vh*0.75))`, sale una volta e resta
  (commit `93c7c1b`).

### 2.9 Freccetta che non si "piantava" al centro del bersaglio
- **Sintomo**: la freccetta della sala giochi arrivava vicino al centro ma
  restava sospesa e, continuando a scrollare, si ritraeva.
- **Causa 1** (mira): l'apice della punta arrivava a X=5.06 mentre il bersaglio
  è a X=5.14 → 8 cm corti. **Causa 2** (persistenza): pilotata dalla
  `proximity` → si piantava solo nell'istante del picco, poi tornava indietro.
- **Fix**: `dartTo.x = 5.02` (apice a 5.18, ~4 cm dentro il disco) e un
  **latch**: `dartProg = max(dartProg, giochiAmt)` → arriva al centro seguendo
  lo scroll e RESTA conficcata (commit `4ba7412`, `2c14bec`).

### 2.10 Collegamenti "finti" dello spillabirra
- **Sintomo**: le spine sembravano finte: manopole-sfera su astine, e un
  "getto" che era un rettangolino piatto fluttuante sopra il bicchiere.
- **Causa**: il getto aveva il top fissato 30 cm SOPRA l'outlet reale del
  beccuccio; il beccuccio era un tronchetto verticale, non un rubinetto.
- **Fix**: rubinetto vero (montante ancorato + corpo orizzontale + beccuccio
  rivolto in giù) con outlet appena sopra il bordo; getto ancorato all'outlet
  fisso e alla superficie mobile del liquido (cilindro con emissive) + spruzzo
  di schiuma (commit `4ba7412`).

### 2.11 Discendente della "g" tagliato nei titoli (split-text)
- **Sintomo**: la coda della "g" (e p/q/j) del titolo appariva tranciata.
- **Causa**: lo split-text avvolge ogni parola in `.split-line` con
  `overflow:hidden` (la maschera del reveal); con `line-height: 0.95` del serif
  il discendente usciva sotto il padding-box e veniva clippato.
- **Fix**: `padding-bottom: 0.36em` + `margin-bottom: -0.36em` (spazio visibile
  sotto la baseline senza cambiare interlinea) e `translateY(150%)` sul
  `.split-inner` (il buffer nascosto deve essere ≥ del padding, altrimenti la
  parola spunta prima del reveal) (commit `4ba7412`).

### 2.12 Doppio Lenis + doppio split se il 3D fallisce dopo l'init
- **Sintomo**: bug latente — se `pub3d` falliva DOPO aver creato Lenis, il
  fallback importava `experience.js` che creava un **secondo** Lenis e
  ri-splittava i titoli (jank + testo doppio).
- **Fix**: guardia globale `window.__ARK_BOOTED__`: se l'orchestratore
  principale ha già preso scroll e split-text, il fallback NON li ricrea
  (commit `a7346bc`).

### 2.13 Refresh che non tornava in cima (sottopagina)
- **Sintomo**: aggiornando la home tornava in cima, aggiornando /menu no.
- **Causa**: il browser ripristina la posizione di scroll al reload; con
  Lenis e un eventuale `#hash` nell'URL, il /menu restava dov'era.
- **Fix**: `history.scrollRestoration = 'manual'` (anche inline nell'`<head>`
  per battere il timing) + rilevamento **reload vs navigate** via
  `PerformanceNavigationTiming.type`: su reload sempre in cima, il deep-link
  `#sezione` resta onorato solo alla prima navigazione (commit `9ec2309`,
  `87184b7`).

### 2.14 Codice morto: intro cinematica mai attivata
- **Sintomo**: `introRunning()` sempre `false` → l'attesa in `pub.js` era un
  no-op; scaffold di un'intro rimossa.
- **Fix**: rimossi `INTRO_DUR/introElapsed/introActive`, il ramo morto del
  loop, `introRunning` dall'API e il `waitIntro` (commit `ff44bc2`). Verificato
  che scroll/camera restano invariati.

### 2.15 Altri, minori ma reali
- **z-fighting/collisioni**: la lavagna "OGGI IN SPINA" era troppo addosso alla
  camera in apertura → spostata a (3.5,0,6.6); la mappa del Belgio collideva
  con la mensola alta → alzata a y 3.3.
- **`grep -c` che interrompe le catene `&&`** su zero match: comandi separati
  con `;` negli script di verifica.
- **Editor "file not read"** dopo modifiche via script esterni: Read prima di
  Edit.
- **Preview server morto** (container reset): rilancio `npm run preview` prima
  degli screenshot.
- **Screenshot in timeout** (swiftshader lento con scena piena): `timeout:
  90000` e `setDefaultTimeout(90000)`.

---

## 3. I PERCORSI CAMERA (come sono stati costruiti)

### 3.1 Struttura
Due `CatmullRomCurve3` **parallele** campionate allo stesso `t∈[0,1]`:
- `posCurve` = dove sta la camera;
- `lookCurve` = dove guarda (il target di `lookAt`).

Entrambe da 10 stazioni `{ p:[x,y,z], l:[x,y,z] }`, con
`new CatmullRomCurve3(points, false, 'catmullrom', 0.4)`. Il **tension 0.4** è
la scelta chiave: le curve Catmull-Rom con tension più bassa "svirgolano"
troppo (la camera prende curve larghe innaturali); 0.4 tiene il percorso
morbido ma aderente ai waypoint.

### 3.2 Criterio dei waypoint (la parte "registica")
Per ogni tappa mi chiedevo **cosa deve stare in quadro** e da lì derivavo la
coppia posizione/target:
- **Stazione 0 (soglia)**: camera alta e indietro `p[0,2.35,8.6]`, sguardo
  lungo il corridoio `l[0,1.1,-10]` → l'intero locale in vista, senso di
  "sto per entrare".
- **Stazioni di prodotto** (cucina/friggitoria/dolci/cocktail): la camera si
  mette **di tre quarti** rispetto al bancone e il target è **sui 2-3 prodotti
  reali** allineati in fila lungo il percorso, così scrollando "ci passi
  accanto". Es. friggitoria `p[-2.2,1.6,-6.85] l[-4.35,1.3,-8.75]`.
- **Stazione 7 (sala giochi)**: camera arretrata e sguardo **largo**
  `l[3.9,1.3,-21.4]` per tenere in quadro bersaglio, arcade, barile,
  biliardino insieme.
- **Stazione 8 (il luogo)**: **sguardo all'indietro** `l[0,1.5,-3.0]` — un
  contro-campo che fa "voltare" e vedere tutto il pub percorso.
- **Stazione 9 (brindisi)**: quasi frontale al séparé, chiusura intima.

### 3.3 Perché non sembra "su binario"
Tre accorgimenti:
1. **Position e look sono due curve diverse**: la camera può muoversi in una
   direzione mentre lo sguardo ne segue un'altra → parallasse, come una
   steadicam vera, non una rotaia rigida.
2. **Damping** (§2.1): il `renderT` insegue il `targetT` con inerzia → la
   camera "pesa", non teletrasporta.
3. **Micro-vita**: un `camera.position.y += sin(time*0.8)*0.01` (respiro
   quasi impercettibile) toglie la fissità robotica.

### 3.4 Tension/velocità/easing
- **Velocità** = derivata implicita dello scroll: dove le stazioni sono vicine
  in `t` ma lontane nello spazio, la camera "corre" (era il bug 2.2, poi domato
  con lo smoothstep d'ingresso).
- **Easing per sezione (/menu)**: due ancore per sezione + `smoothstep` tra
  i punti → la camera si "posa" sulla stazione per tutta la sezione e trasla
  solo nei cambi (bug 2.6).
- **Sincronia narrativa**: la timeline della camera e le sezioni HTML sono la
  **stessa** timeline (`narrativeT()`/`menuT()` mappano le sezioni reali su
  stati `t`), così testo e spazio si muovono insieme.

---

## 4. METODOLOGIA DI VERIFICA LAYOUT (il mio processo esatto)

Ogni singola modifica passava da questo loop. Non era negoziabile.

### 4.1 Strumento
**Playwright (chromium headless con swiftshader)** + screenshot. Server di
preview locale (`npm run preview`) che serve **il build di produzione**
(non il dev), così vedo esattamente ciò che verrà pubblicato.

### 4.2 Viewport testati (sempre entrambi, spesso di più)
- **Desktop**: `1440×900`.
- **Mobile**: `390×844` (iPhone-class portrait).
- Per i bug di viewport: `390×784` (barra presente) vs `390×844` (barra
  ritirata) per **riprodurre il collasso della barra indirizzi**.
- Per il testo/tipografia: `deviceScaleFactor: 2` per vedere i dettagli fini
  (es. il discendente della "g").

### 4.3 Il loop, passo-passo
1. `npm run build` → grep di `error|Complete!`.
2. (ri)lancio `npm run preview -- --port 4321` in background.
3. Script Playwright che: apre la pagina, `waitForTimeout(2500)` per far
   partire il 3D, **scrolla al punto interessato** (`scrollIntoView` o
   `window.scrollTo` all'`offsetTop` della sezione), aspetta, **screenshot**.
4. Per il 3D scuro: inietto `canvas{filter:brightness(1.6)}` via
   `addStyleTag` SOLO per lo screenshot di controllo (per vedere i dettagli
   in ombra) — non è una modifica al sito.
5. **Guardo lo screenshot** (desktop e mobile) e giudico: l'oggetto è in
   quadro? il testo è leggibile sopra il 3D? i prezzi sono incolonnati? niente
   trabocca l'asse orizzontale?
6. Se non è perfetto: correggo un solo parametro, ricostruisco, ri-screenshot.
   Iterazione stretta (un parametro alla volta) per isolare la causa.
7. **Controllo del controllo**: dopo un batch, scroll integrale di home E
   menu raccogliendo `pageerror` → deve essere "nessuno".

### 4.4 Cosa controllavo esplicitamente
- **In quadro**: gli oggetti-chiave della sezione sono interamente visibili a
  entrambi i viewport (il bug drink-su-mobile nasce qui).
- **Leggibilità testo su 3D**: scrim/gradiente sul lato del testo; sottotitoli
  "illuminati".
- **FOV adattivo**: verifica in portrait che il campo si allarghi.
- **Touch vs mouse**: `data-lenis-prevent` sui pannelli che scrollano da soli
  (carrello); `touch-action`/`overscroll-behavior` sulle barre orizzontali per
  non trascinare la pagina.
- **Downgrade high→low→none**: test con `reducedMotion:'reduce'` (→ fallback
  calice) e verifica che i contenuti restino visibili; conteggi istanze/luci e
  `devicePixelRatio` scalati per tier.
- **Refresh e deep-link**: reload a metà pagina → torna in cima; `/x#sezione`
  da navigazione fresca → atterra sulla sezione.
- **Console pulita**: zero warning/error (il fix dei 193 warning nasce da qui).

### 4.5 Criteri di "è perfetto"
Un cambiamento era "fatto" solo se, **su desktop e mobile**: (a) gli oggetti
target sono in quadro e leggibili; (b) lo scroll è fluido e la camera non
scatta; (c) console pulita; (d) nessun overflow orizzontale; (e) il fallback
e il reduced-motion reggono; (f) nessuna regressione nello scroll integrale.

---

## 5. LE DECISIONI DI QUALITÀ "INVISIBILI" (il perché)

- **Texture procedurali su canvas invece di asset** (`makeEnv`, insegne,
  targhe, etichette): zero richieste di rete, zero peso, nessun asset da
  gestire/versionare, e **riproducibilità totale** (l'ambiente si rigenera
  identico). Un gradiente 16×64 basta per la PMREM; i cartelli sono testo su
  canvas 2D. Costo: qualità "stilizzata", non fotografica — coerente con la
  direzione artistica.
- **Hash deterministico** `fract(sin(i*12.9898)*43758.5)` al posto di
  `Math.random()`: il layout "casuale" (posizione libri, polvere, guarnizioni)
  è **riproducibile** build dopo build e **stabile al resume** — cosa che
  `Math.random()` renderebbe impossibile (e che nell'ambiente di questa skill
  è persino vietato: `Math.random` è bloccato per non rompere i resume).
- **InstancedMesh** per gli oggetti ripetuti (40 libri, particelle di polvere):
  un solo draw call per centinaia di istanze → il framerate regge su mobile.
- **Damping frame-rate-independent** (§2.1): la fluidità deve essere IDENTICA
  a 20 e 120 fps. È la differenza tra "fluido" e "fluido sul mio PC".
- **Pre-warm delle shader** (§2.3): spendere ~6 render nascosti sotto il
  preloader per non pagare gli hitch al primo scroll — il momento che il
  cliente vede per primo.
- **Capability-detection PRIMA di scaricare Three.js**: su reduced-motion /
  no-WebGL / save-data / RAM≤2GB non scarico nemmeno il chunk 3D (505KB) →
  parte subito il fallback leggero. È rispetto per l'utente e per la batteria.
- **`document.hidden` guard** nel render loop: tab in background → niente
  render (GPU/batteria), col `dt` clampato che evita salti al ritorno.
- **Feature isolate dietro flag/moduli** (`arredo3d.js`, `carrello.js`): regola
  architetturale esplicita — se una feature è rischiosa, va costruita in modo
  che rimuoverla non tocchi il resto (cancelli un file + i suoi ganci e il
  sito torna com'era). Questo ha reso ogni esperimento reversibile.
- **Progressive enhancement**: `<noscript>` che forza `opacity:1` sui contenuti
  rivelati (senza JS non restano invisibili); fallback a cascata motore→
  calice→SVG statico.

---

## 6. INVENTARIO TECNICO VERIFICATO (Fase 1)

Confronto tra ciò che il reverse-engineering del bundle aveva ipotizzato e il
**sorgente vero**. ✅ = confermato · ✎ = precisato/corretto · ➕ = aggiunto.

- ✅ **Camera a doppio spline**: `posCurve`/`lookCurve` = due `CatmullRomCurve3`
  campionate allo stesso `t`. ✎ **10 stazioni** (non "~10": esattamente 10,
  indici 0–9). ➕ **tension `0.4`** e `closed=false`; il `t` è clampato in
  `applyCamera`.
- ✅ **Damping frame-rate-independent**: `s = 1 - Math.pow(0.94, min(dt,0.25)*60)`.
  ✎ la costante è **0.94** e il `dt` è clampato a **0.25**. ➕ micro-vita
  `camera.position.y += sin(time*0.8)*0.01`.
- ✅ **Timeline narrativa** che mappa sezioni HTML→stati con **smoothstep**;
  ➕ sul /menu **due ancore per sezione** e supporto a **range di stazioni**
  `[id, stA, stB]` per i travelling.
- ✅ **Zero asset esterni**: tutto su `<canvas>` 2D → `CanvasTexture`.
  ➕ ambiente da gradiente 16×64 → **PMREM** (`fromEquirectangular`).
- ✅ **Hash deterministico**: `pseudo(i)=fract(sin(i*12.9898)*43758.5453)`.
- ✅ **InstancedMesh** per i ripetuti; ✅ **PMREM**; ✅ **ACES** + `exposure 1.45`
  + **FogExp2**(`0x0e0a07, 0.024`).
- ✅ **Capability detection** → `none|low|high`; ✎ soglie reali: reduced-motion
  o `saveData` o no-WebGL o `deviceMemory<=2` → `none`; mobile→`low`, resto
  `high`. ✎ `devicePixelRatio` cappato a **2 (high)** / **1.35 (low)**.
- ✅ **Anti-jank**: ➕ pre-warm su **6** punti; ✅ `document.hidden` guard;
  ✅ `delta` clampato.
- ✅ **Animazioni state-driven** via setter 0→1 (assemble a strati: gli
  hamburger). ➕ pattern **fillOnce** (persistente) e **latch** (max visto).
- ✅ **Fallback a cascata** motore→calice→SVG statico.
- ✅➕ **Bug factory materiali confermato NEL SORGENTE** e **corretto**
  (destrutturazione r/m/e/ei): il template della skill deve nascere già
  corretto (vedi §2.4).
- ✎ **FOV adattivo** (che il reverse-engineering non evidenziava):
  `fov = aspect < 0.8 ? 64 : 55`.
- ✎ **Viewport stabile mobile** via `probe` a `100vh` (il singolo fix più
  importante per la fluidità reale su Chrome/Safari).

---

## 7. COSA PORTARE NELLA SKILL (sintesi operativa)

1. Le **primitive** del §6 sono riusabili tali e quali, **neutre rispetto al
   tema**.
2. Le **animazioni state-driven** (assemble/disassemble, riempimento
   persistente, latch, fly-through) sono ricette parametriche indipendenti dal
   soggetto.
3. Il **metodo di verifica** del §4 va imposto come parte non saltabile del
   workflow.
4. Gli **errori** del §2 vanno scritti come "trappole note" nella skill, così
   nessuno li ripete.
5. **Mai un pub**: la skill genera la metafora spaziale dalla nicchia, non
   riusa l'arredo.
