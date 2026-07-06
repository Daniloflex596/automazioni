---
name: immersive-web-engine
description: >-
  Costruisce siti web IMMERSIVI e navigabili in 3D con camera cinematografica
  guidata dallo scroll (scrollytelling), esperienze WebGL/Three.js ad altissima
  qualità visiva, effetto "wow". Attiva questa skill quando l'utente chiede
  (IT): sito immersivo, sito 3D, sito navigabile "come un mondo"/"come un
  videogame"/open-world, esperienza WebGL, scrollytelling, animazioni di camera
  cinematografiche, fly-through / walkthrough on-rails, parallasse spinta,
  mondo esplorabile, storytelling visivo, sito "wow"/"che lascia a bocca
  aperta"/di altissima qualità visiva, sito "da premio". Trigger (EN): immersive
  website, 3D website, WebGL experience, scroll-driven / scrollytelling camera,
  cinematic camera animation, game-like / explorable world site, high-end /
  award-winning / "wow" visual site, three.js site, on-rails camera. Vale per
  QUALSIASI nicchia: ristorante, studio legale, palestra/gym, brand moda,
  startup SaaS, hotel/resort, portfolio, agenzia creativa, e-commerce, museo,
  evento, immobiliare. La metafora spaziale nasce SEMPRE dalla nicchia del
  cliente: nessun tema è precotto.
---

# Immersive Web Engine

Motore + metodo per costruire un sito dove lo **scroll pilota una camera
cinematografica** che viaggia dentro un **mondo 3D continuo**. Non "un 3D
appiccicato a una landing": un'unica scena in cui le sezioni di contenuto sono
**posti reali** nello spazio, e scorrere significa **attraversarli**.

Questa skill estrae il MOTORE (rendering, camera, fluidità, robustezza) e il
METODO (regia, narrazione, verifica) da un sito reale rifinito con ~60 commit di
tuning ossessivo. Tutto è **neutro rispetto al tema**: la skill non ha un
soggetto, lo riceve dalla nicchia.

> ## REGOLA D'ORO — MAI UN PUB
> Il progetto sorgente era un pub. **Non riprodurre mai** pub, birra, arredo,
> hamburger, "Arkadia" o qualsiasi loro variante come tema di default. Quelli
> sono solo l'esempio da cui è nato il motore. Il tuo primo dovere è
> **inventare la metafora spaziale a partire dalla nicchia del cliente**
> (vedi Workflow, passo 1). Se ti ritrovi a modellare un bancone e delle
> spine "perché è comodo", ti sei sbagliato: ricomincia dalla nicchia.

---

## Quando usarla / quando NO

**USALA quando** l'obiettivo è un'esperienza memorabile, esplorativa, ad alto
impatto visivo: la homepage di un brand che vuole distinguersi, un portfolio
"da premio", il lancio di un prodotto, un sito-vetrina dove il *come si naviga*
è parte del messaggio. In una parola: quando il cliente vuole il "wow".

**NON usarla quando**:
- serve un **sito statico/brochure** informativo, una landing di conversione
  secca, un blog, una dashboard, un gestionale, un e-commerce ad alto volume
  di catalogo → lì il 3D è peso morto e danneggia performance e SEO;
- il pubblico è prevalentemente su dispositivi deboli o connessioni misurate e
  **non** puoi permetterti un fallback di qualità (qui invece lo garantiamo:
  vedi Progressive enhancement);
- il committente non ha contenuto/racconto da spazializzare (senza tappe
  narrative il mondo 3D è vuoto e la skill non ha materia su cui lavorare).

Nel dubbio: se il valore sta nell'**informazione**, fai un sito normale; se
sta nell'**esperienza**, usa questa skill.

---

## I tre livelli (A / B / C)

La skill è stratificata. Ogni livello è autoconsistente e rimanda a un file di
approfondimento in `references/`. Si costruisce **A → B → C**, ma A è sempre
obbligatorio anche da solo.

- **Livello A — Fluidità & robustezza** (`references/A-fluidita-e-robustezza.md`)
  Le primitive non negoziabili che rendono l'esperienza *fluida e stabile
  ovunque*, indipendenti dal tema e dallo stack: damping frame-rate-independent,
  `dt` clamp, `document.hidden` guard, pre-warm delle shader, viewport stabile
  su mobile (`probe` a `100vh`), capability detection, determinismo (hash
  `pseudo`), factory dei materiali **già corretta**. È il minimo per non
  spedire jank. Riusabile tale e quale in qualunque progetto WebGL.

- **Livello B — Il motore-mondo** (`references/B-motore-mondo.md`)
  Come si costruisce la scena: renderer + tone mapping ACES + `FogExp2`,
  ambiente da gradiente 16×64 → **PMREM**, texture procedurali su `<canvas>`
  (zero asset di rete), `InstancedMesh` per i ripetuti, **camera a doppio
  spline** (due `CatmullRomCurve3` parallele, tension `0.4`), stazioni,
  `applyCamera`, luci. Neutro: geometrie e palette arrivano dal tema.

- **Livello C — Regia & metodo** (`references/C-regia-e-metodo.md`)
  Come il motore diventa un'esperienza *su misura*: scelta della metafora
  spaziale dalla nicchia, tappe narrative → waypoint camera, animazioni
  **state-driven** (assemble/disassemble, `fillOnce` persistente, `latch`,
  proximity DOM), sincronia scroll↔camera, orchestrazione con Astro + Lenis.

Companion obbligatori, da consultare durante il lavoro:
- `references/trappole-note.md` — catalogo degli errori reali (sintomo → causa
  → fix). Leggilo **prima** di scrivere, così non li ripeti.
- `references/verifica-layout.md` — il loop di verifica con screenshot
  (Playwright), viewport testati, criteri di "è perfetto".
- `assets/` — scheletri di partenza già neutri e già corretti: template del
  motore-mondo, capability detection, orchestratore di scroll. Copia da qui,
  **non** riscrivere da memoria (eviti di reintrodurre i bug noti).

---

## WORKFLOW end-to-end (passi OBBLIGATORI, in ordine)

Nessun passo è saltabile. La qualità del sorgente non è nata da un'idea
geniale, ma da questo processo ripetuto con disciplina.

### 0) Capire nicchia + brand
Prima di ogni riga di codice: che attività è? Che pubblico? Che *sensazione*
deve dare (lusso sobrio? energia? artigianalità? tecnologia pulita?)? Che
palette/tono di voce ha già il brand? Raccogli 3–5 contenuti reali per sezione
(non lorem): sono la materia narrativa. Senza questo, i passi successivi
girano a vuoto.

### 1) Scegliere la METAFORA SPAZIALE (mai il pub)
Trasforma la nicchia in **un luogo o un viaggio** che la camera può
attraversare. La metafora deve *emergere dal cliente*, non essere imposta.
Esempi di direzione (da reinventare ogni volta, non da copiare):
- studio legale → una **biblioteca/archivio monumentale**, corridoi di volumi,
  la luce che scende dall'alto su una scrivania;
- palestra → un **percorso atletico** che sale, dalla soglia alla vetta;
- brand moda → una **passerella/atelier** con capi come installazioni;
- startup SaaS → un **flusso di dati astratto**, nodi e superfici che si
  compongono in prodotto;
- hotel → un **arrivo** che porta dalla hall alla vista panoramica;
- portfolio → una **galleria** con i lavori come stanze.
Scrivi in una frase la metafora e il "verbo" del viaggio (entrare, salire,
attraversare, scoprire). Se non riesci, torna al passo 0.

### 2) Definire tappe narrative + waypoint camera
Elenca le sezioni di contenuto (5–10) e assegnane l'ordine spaziale lungo il
percorso. Per **ogni tappa** chiediti: *cosa deve stare in quadro qui?* Da lì
deriva la coppia `{ p:[x,y,z] (posizione camera), l:[x,y,z] (punto guardato) }`.
Position e look sono **due curve diverse** apposta: la camera può muoversi in
una direzione mentre lo sguardo ne segue un'altra → parallasse da steadicam,
non binario rigido. La prima tappa (ingresso) è quella con più distanza 3D e
meno corsa di scroll: prevedila e domala con lo smoothstep d'ingresso
(vedi trappole 2.2). Mappa **le stesse sezioni DOM** sugli stati `t` della
camera: testo e spazio si muovono sulla stessa timeline.

### 3) Geometria procedurale a tema
Modella gli oggetti-chiave di ogni tappa **a partire dalla metafora**, con
primitive Three (Box/Cylinder/Sphere/Lathe/Torus) e texture su `<canvas>`.
Regola: **2–3 prodotti/soggetti REALI per tappa**, distinti tra loro, allineati
in fila lungo il percorso camera così che scrollando "ci passi accanto". Usa
`InstancedMesh` per gli elementi ripetuti (centinaia in un draw call). Ogni
posizione "casuale" deve usare l'hash deterministico, **mai `Math.random()`**.

### 4) Palette / tipografia / mood / luci
Definisci la palette dal brand (non dal pub). Imposta tone mapping ACES +
`toneMappingExposure`, `FogExp2` in tinta con lo sfondo per la profondità,
ambiente PMREM da un gradiente coerente col mood. Luce **dedicata** su ogni
gruppo di soggetti (una `PointLight` calda o fredda a seconda del tono).
Tipografia: se usi split-text per i reveal, ricorda il fix del discendente
(padding/margin + buffer ≥ del padding, trappola 2.11).

### 5) Applicare le primitive di fluidità del Livello A
Prima di considerare "finita" qualunque animazione, cabla: damping
frame-rate-independent su `renderT`, `dt` clamp, `document.hidden` guard nel
loop, micro-vita della camera (`sin(time*0.8)*0.01`), pre-warm delle shader su
6 punti del percorso sotto il preloader, viewport `probe` a `100vh`, capability
detection **prima** di importare il chunk 3D, factory materiali già corretta.
Copia da `assets/`, non da memoria.

### 6) VERIFICA responsive desktop + mobile con screenshot (NON saltabile)
Ogni modifica passa dal loop di `references/verifica-layout.md`: build di
produzione → `preview` server → Playwright headless (chromium/swiftshader) →
scroll ai punti chiave → **screenshot desktop `1440×900` E mobile `390×844`**
→ *guarda lo screenshot* e giudica. Controlla esplicitamente: oggetti-chiave
interamente in quadro a **entrambi** i viewport; testo leggibile sopra il 3D;
nessun overflow orizzontale; console pulita (0 warning/0 error); scroll fluido
senza scatti; fallback e reduced-motion reggono; refresh torna in cima. Un
parametro alla volta, ricostruisci, ri-screenshotta. Se non è perfetto su
mobile, **non è fatto**.

### 7) Checklist qualità di consegna
- [ ] La metafora è del cliente, **non un pub** (né suoi derivati).
- [ ] Oggetti-chiave in quadro e leggibili su desktop **e** mobile.
- [ ] Scroll fluido identico su fps alti e bassi (damping FRI verificato).
- [ ] Console 0 warning / 0 error (factory materiali corretta, niente dead code).
- [ ] Nessun overflow orizzontale; asse inchiodato (`overflow-x`, overscroll).
- [ ] Capability detection: su reduced-motion / no-WebGL / save-data / RAM≤2GB
      parte il fallback **senza** scaricare il chunk 3D.
- [ ] Fallback a cascata (motore → esperienza leggera → SVG/HTML statico) reso
      e visibile; `<noscript>` mostra i contenuti.
- [ ] Determinismo: nessun `Math.random()` nel bundle.
- [ ] Refresh torna in cima; deep-link `#sezione` onorato solo alla prima
      navigazione.
- [ ] Pre-warm attivo: primo scroll senza micro-scatti da upload GPU pigro.

---

## Principi NON NEGOZIABILI

Questi valgono **sempre**, a qualsiasi stack. Sono ciò che separa "fluido" da
"fluido sul mio PC".

### 1. Fluidità frame-rate-independent
Mai lerp a fattore fisso per frame (`x += (t-x)*0.1`): a fps diversi cambia il
"feel". Il fattore dipende dal delta time:
```js
const s = 1 - Math.pow(0.94, Math.min(dtRaw, 0.25) * 60);
renderT += (targetT - renderT) * s;   // camera "pesa", non teletrasporta
```
`0.94` = morbidezza calibrata a mano (→ 1 = più lento/pesante). `min(dt,0.25)`
evita il salto dopo un freeze del tab.

### 2. Capability detection PRIMA di scaricare il motore
Non importare Three.js finché non sai che il device lo regge. Soglie reali:
```js
reduced-motion  → 'none'
saveData        → 'none'
no-WebGL        → 'none'
deviceMemory<=2 → 'none'
mobile          → 'low'   (dpr cap 1.35, meno istanze/luci)
resto           → 'high'  (dpr cap 2, antialias)
```
Su `'none'` parte subito il fallback leggero: non scarichi neanche il chunk 3D
(~500KB). È rispetto per l'utente, la batteria e la connessione.

### 3. Zero-jank
- **Pre-warm shader**: prima di togliere il preloader, renderizza la scena in 6
  punti del percorso `[0.06,0.18,0.35,0.55,0.75,0.95]` → shader compilati e
  texture caricate, il primo scroll (specie mobile) non incontra hitch.
- **`document.hidden` guard**: tab in background → niente render (GPU/batteria).
- **`dt` clamp** (`Math.min(dt, 0.05)` per le fisiche): niente salti al ritorno.
- Nessun `getBoundingClientRect` per frame: misura la geometria una volta al
  load/resize, mai dentro il `raf` (niente reflow forzato).

### 4. Determinismo — MAI `Math.random()`
Ogni "casualità" (posizioni, polvere, guarnizioni, semi) usa un hash
deterministico, così il layout è riproducibile build dopo build e stabile al
resume:
```js
function pseudo(i) {           // fract(sin(i*12.9898)*43758.5453)
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
```
`Math.random()` è **vietato** anche perché nell'harness di destinazione è
bloccato (romperebbe i resume). Non usarlo mai, nemmeno "solo per provare".

### 5. Factory dei materiali già corretta (0 warning)
`r/m/e/ei` sono scorciatoie per roughness/metalness/emissive/emissiveIntensity.
Vanno **destrutturate ed escluse** dallo spread: se le ri-inietti con `...opts`,
Three emette un warning per ognuna (nel sorgente erano 193). Versione corretta:
```js
const mat = (color, { r = 0.85, m = 0, e = 0x000000, ei = 1, ...rest } = {}) =>
  new THREE.MeshStandardMaterial({
    color, roughness: r, metalness: m, emissive: e, emissiveIntensity: ei,
    ...rest,   // solo side/transparent/opacity/map/... — MAI r/m/e/ei
  });
```
Non scrivere mai la variante con `...opts` che rimette dentro le scorciatoie.

### 6. Accessibilità + progressive enhancement (fallback a cascata)
Motore 3D → esperienza leggera → SVG/HTML statico: ogni gradino è funzionante
da solo. `<noscript>` forza `opacity:1` sui contenuti rivelati (senza JS non
restano invisibili). Reduced-motion serve il fallback statico. Il contenuto e i
link devono essere leggibili e indicizzabili anche a 3D spento.

### 7. Viewport stabile su mobile (`probe` a `100vh`)
Su Chrome/Safari mobile la barra indirizzi collassa al primo scroll e cambia
`innerHeight` di ~60px → la coreografia salta proprio entrando. Fix: un `probe`
fisso alto `100vh` misura l'altezza "grande" che **non** cambia durante lo
scroll; renderer e camera nascono su quella e il `resize` scatta solo su cambi
veri (rotazione / Δaltezza > 150px). In più `overflow-x: clip`,
`overscroll-behavior`, hero a `100lvh` (non `svh`). È il singolo fix più
importante per la fluidità reale su telefono.

### 8. Reversibilità (feature dietro flag/moduli)
Ogni feature rischiosa vive in un modulo isolato dietro un solo interruttore:
cancelli il file + i suoi ganci e il sito torna com'era. Rende ogni esperimento
sicuro.

---

## Stack di default: Astro + Three.js + Lenis

- **Astro**: sito statico per default (SEO, TTFB, `<noscript>` naturale), zero
  JS finché non serve; il 3D è un'isola caricata **solo** dopo la capability
  detection. Ottimo per il progressive enhancement a cascata.
- **Three.js**: WebGL ad alto livello con PMREM, InstancedMesh, tone mapping
  ACES, `CatmullRomCurve3` per gli spline camera. Tutto procedurale → nessun
  asset di rete, riproducibilità totale.
- **Lenis**: smooth scroll che dà l'inerzia su cui si innesta il damping della
  camera; guidato dallo stesso `requestAnimationFrame` del render loop.

**Perché questa terna**: massimizza qualità percepita *e* robustezza col minimo
peso, e rende naturale la separazione "contenuto statico accessibile" ↔ "isola
esperienziale opzionale".

I **principi restano validi a stack diverso**: React/Next + R3F + Lenis, o Vue,
o vanilla + Three. Cambiano le API, non le leggi: damping FRI, capability
detection prima del motore, zero-jank, determinismo, viewport stabile,
progressive enhancement, e la regola d'oro. Se cambi stack, mappa questi
principi sulle sue primitive — non abbandonarli.

---

## Come si usa — un esempio da zero (nicchia: atelier di gioielleria)

Il metodo end-to-end su una nicchia lontanissima dal progetto sorgente, per
mostrare che la skill *genera* un concept nuovo, non ricicla un tema.

**Passo 0 — nicchia + brand.** Atelier di alta gioielleria. Sensazione-target:
*preziosità e silenzio*. Palette: nero-carbone, oro brunito, il bianco freddo di
un brillante. Cinque tappe reali: soglia · tre collezioni signature · l'incisione
a mano · il contatto.

**Passo 1 — metafora spaziale (mai un bancone).** Verbo: **avvicinarsi
nell'oscurità**. Lo spazio archetipico non è una vetrina: è una **teca di luce**
in una stanza buia. La camera scende nel nero e ogni pezzo emerge da un cono di
luce su un piedistallo. Contro-campo finale: la camera si volta e mostra tutti i
coni sospesi nel buio già percorso.

**Passo 2 — tappe → waypoint** (concettuali; li rifinisci con gli screenshot):
```js
const stations = [
  { p: [0, 1.9, 7.0],   l: [0, 1.2, -6] },     // 0 soglia: la stanza buia, i coni in lontananza
  { p: [-1.4, 1.3, 2.2],l: [-2.2, 1.1, 0.6] }, // 1 collezione A, tre-quarti sul piedistallo
  { p: [1.3, 1.25, -1.0],l: [2.1, 1.05, -2.4] },// 2 collezione B
  { p: [-1.1, 1.3, -4.4],l: [-2.0, 1.1, -5.8] },// 3 collezione C
  { p: [0.4, 1.5, -7.6],l: [1.8, 1.15, -8.9] }, // 4 incisione a mano (dettaglio ravvicinato)
  { p: [0, 2.0, -10.5], l: [0, 1.4, 1.0] },     // 5 contro-campo: tutti i coni nel buio
];
const rig = createCameraRig({ stations, aspect: w / h });
```

**Passo 3 — geometria a tema.** Ogni pezzo è un oggetto reale su un piedistallo
(niente "ologrammi"): tre anelli/collane **distinti** per collezione, in fila lungo
il percorso. Un cono di luce = una `SpotLight` stretta per piedistallo. Ambiente
quasi nero: `makeEnvTexture(renderer, ['#141418', '#22222a', '#050506'])`;
background e `FogExp2` dello stesso nero, così il buio "mangia" i bordi.

**Passo 4 — animazioni state-driven.** Ogni pietra **ruota piano quando la sua
sezione è centrata** (proximity) per far scintillare le faccette; il cono di luce
**sale e resta** all'ingresso (fillOnce); un indice di carati **si pianta** al
valore (latch). Tutto pilotato dallo scroll, zero timer:
```js
const tl = makeTimeline([
  ['soglia', 0], ['collA', 1], ['collB', 2], ['collC', 3], ['incisione', 4], ['contro', 5],
], { lastStation: 5 });
// dentro createRenderLoop({ ..., getTargetT: tl.narrativeT, onFrame }):
scene.setBrillio('collA', tl.proximity('collA')); // rotazione + scintillìo al centro
scene.setCono('collA', tl.fillOnce('collA'));      // il cono di luce sale e resta
```

**Passo 5 — fluidità e verifica.** Cabla il Livello A (damping FRI, capability,
pre-warm, viewport stabile) copiando da `assets/`, poi passa dal loop di
`references/verifica-layout.md`: screenshot a 1440×900 **e** 390×844, verifichi che
i tre pezzi siano in quadro (FOV adattivo!), il bianco leggibile sul nero, console
a 0 warning. Nessun bancone, nessun pub: un concept nato solo da questa nicchia.

---

## English quick-start

This skill builds immersive, scroll-driven 3D websites where scrolling flies a
**cinematic camera through one continuous 3D world** — for ANY niche. The
reference docs and code comments are in Italian, but the method is
language-agnostic:

1. Derive a **spatial metaphor** from the client's niche — **never a pub** (that
   was only the source project). Ask: what *place or journey* does the visitor
   move through? Pick the **verb** (enter, ascend, descend, cross, approach).
2. Map 5–10 content sections to camera **waypoints** `{ p:[x,y,z], l:[x,y,z] }`
   — two separate curves (position ≠ look) give steadicam parallax, not a rail.
3. Wire the fluidity primitives from `assets/`: frame-rate-independent damping,
   capability gating *before* loading Three, GPU pre-warm, stable-viewport probe,
   deterministic `pseudo()` (never `Math.random`), the corrected material factory.
4. Drive every micro-animation from a **scroll signal** (`proximity` / `fillOnce`
   / `latch`) — never an autonomous timer, never scroll-lock or forced hover.
5. Verify every change with **desktop and mobile screenshots**. Not done until
   it's in-frame on both.

Levels: **A** (`references/A-fluidita-e-robustezza.md`) fluidity & robustness ·
**B** (`references/B-motore-mondo.md`) the world engine · **C**
(`references/C-regia-e-metodo.md`) direction & niche adaptation. Traps in
`references/trappole-note.md`, QA loop in `references/verifica-layout.md`.

---

## Dove andare adesso

1. Leggi `references/trappole-note.md` (gli errori già risolti — non ripeterli).
2. Parti dagli scheletri neutri in `assets/` (motore, capability, scroll).
3. Segui il Workflow dal passo 0. Approfondisci con `references/A/B/C`.
4. Verifica ogni passo con `references/verifica-layout.md`.
5. Alla consegna, spunta l'intera checklist del passo 7 — inclusa la prima
   casella: **non è un pub**.
