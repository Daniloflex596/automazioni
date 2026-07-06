# LIVELLO C — Regia & metodo

Il Livello A ti dà un motore che non scatta; il Livello B ti dà un mondo 3D
neutro (renderer, ambiente, camera a doppio spline). Nessuno dei due sa **cosa**
stai raccontando. Qui si decide il soggetto e la regia: come una scena vuota e
generica diventa un'esperienza *su misura* per una nicchia precisa, senza mai
riprodurre il progetto sorgente. Il motore è muto per scelta: il tema arriva da
te, tappa per tappa.

Parlo in prima persona perché questo è il pezzo che ho imparato sbagliando: le
regole tecniche del Livello A/B sono oggettive, la regia no — è mestiere, ed è
dove si vince o si perde il "wow".

---

## 1. L'adattatore-nicchia: inventare la metafora spaziale (mai il pub)

La prima domanda non è "che oggetti modello?" ma **"in che luogo o in che
viaggio si trova lo spettatore mentre scorre?"**. Lo scroll non riempie una
pagina: fa *attraversare* uno spazio. Devi darti quello spazio prima di ogni
riga di codice.

Il verbo del viaggio è la tua bussola. Uno studio legale non "mostra servizi":
ti fa **scendere** in un archivio monumentale. Una palestra non "elenca corsi":
ti fa **salire** verso una vetta. Un brand moda ti fa **sfilare** lungo una
passerella. Un SaaS ti fa **attraversare** un flusso di dati che si compone in
prodotto. Il verbo (entrare, salire, attraversare, scoprire, immergersi,
scendere) decide poi la forma del percorso camera.

### Mini-procedimento ripetibile

Per ogni nuovo cliente rispondo, in ordine, a cinque domande:

- **(a) Qual è la sensazione-target del brand?** Una parola sola: austerità,
  slancio, purezza, calore artigianale, precisione. Se non la sai, torna al
  passo 0 del workflow (nicchia + brand).
- **(b) Qual è lo spazio archetipico di quella nicchia?** Il luogo che chiunque
  associa a quella sensazione: la sala di lettura, la vetta, la serra, la teca
  illuminata, la hall che si apre sul panorama.
- **(c) Quali 5–8 tappe di contenuto?** Le sezioni reali del sito, ordinate come
  **posti** lungo il percorso, non come voci di menu.
- **(d) Qual è il verbo del movimento?** Uno solo, coerente con (a).
- **(e) Qual è il contro-campo finale?** Il momento in cui la camera si **volta
  all'indietro** e lo spettatore vede tutto ciò che ha attraversato. È la
  battuta di chiusura: quasi sempre è ciò che resta impresso.

### Tabella nicchia → metafora spaziale → oggetti-chiave

| Nicchia | Metafora / verbo | Oggetti-chiave (soggetti reali, in fila) |
|---|---|---|
| Studio legale | Biblioteca monumentale · *scendere* | volumi rilegati, scrivania sotto un fascio di luce, faldoni |
| Palestra | Ascesa atletica · *salire* | gradoni, attrezzi lungo la salita, la vetta finale |
| Brand moda | Passerella / atelier · *sfilare* | capi come installazioni sospese, specchi, luce di scena |
| SaaS | Flusso di dati · *attraversare* | nodi, superfici che si compongono, un cruscotto finale |
| Hotel / resort | Arrivo panoramico · *arrivare* | hall, corridoio, terrazza che si apre sulla vista |
| Gioielleria | Teca di luce · *avvicinarsi* | pezzi singoli su piedistalli, riflessi, faccette |
| Caffè specialty | Serra / piantagione · *risalire alla fonte* | piante, sacchi di crudo, il banco di tostatura |
| Immobiliare | Sopralluogo · *entrare* | volumi architettonici, stanze come tappe, l'affaccio |

> **Avvertenza.** Se ti sorprendi a modellare un bancone lineare con oggetti
> allineati sopra "perché è comodo montarci le cose", ti sei arreso alla forma
> del progetto sorgente. Butta e ricomincia da (a): la teca della gioielleria,
> i gradoni della palestra e i nodi del SaaS non hanno un bancone. La comodità
> geometrica non è una metafora.

---

## 2. Da tappe narrative a waypoint camera

Il ponte tra racconto e regia è una domanda sola, ripetuta per ogni tappa:
**"cosa deve stare in quadro *qui*?"**. La risposta ti dà direttamente la coppia
`{ p:[x,y,z], l:[x,y,z] }` (posizione camera + punto guardato) di quella
stazione. Non parto mai dalle coordinate: parto dall'inquadratura e le coordinate
seguono.

L'arco che uso quasi sempre, cucito dal mio percorso reale:

- **Establishing shot (stazione 0).** Camera alta e arretrata, sguardo lungo
  lungo l'asse del viaggio → l'intero spazio in vista e la sensazione di "sto
  per entrare/salire/scendere". È il fotogramma che vende l'idea nei primi
  600 ms.
- **Stazioni-soggetto (le tappe centrali).** Camera **di tre quarti** rispetto
  al gruppo di soggetti, target puntato sui **2–3 oggetti reali** allineati in
  fila lungo il percorso, così scrollando "ci passi accanto" invece di
  guardarli frontalmente come una vetrina.
- **Panoramica larga.** Una stazione arretrata con sguardo ampio che tiene più
  soggetti insieme: dà respiro e fa capire la scala dello spazio.
- **Contro-campo (verso la fine).** Sguardo **all'indietro**: la camera si volta
  e mostra tutto il percorso già fatto. È il momento memorabile del punto 1(e).
- **Chiusura intima.** Frontale, ravvicinata, sull'ultimo soggetto o sulla CTA:
  si "posa" e chiude.

Due regole che rendono tutto questo cinema e non un binario:

- **`tension = 0.4`** sulle due `CatmullRomCurve3`. Più basso e le curve
  "svirgolano" tra i waypoint (curve larghe, innaturali); più alto e diventano
  spigolose. 0.4 tiene morbido ma aderente.
- **Posizione e sguardo sono due curve diverse.** La camera può muoversi in una
  direzione mentre lo sguardo ne segue un'altra: è la parallasse da steadicam.
  Se `posCurve` e `lookCurve` fossero parallele avresti una rotaia rigida.

Non costruirti il rig a mano: usa `createCameraRig({ stations, aspect })` da
`assets/camera-rig.js` (le `stations` sono `[{p:[x,y,z], l:[x,y,z]}]`; la tension
0.4 e le due curve sono già dentro). Nel loop la camera si posiziona con
`rig.applyCamera(camera, renderT)` — e di solito è il `createRenderLoop` del
Livello A a chiamarlo per te. Per costruire la scena, il Livello B.

**Sincronia.** Le sezioni DOM e la camera sono la **stessa** timeline. Non
animo la camera con una progressione sua: derivo `t∈[0,1]` dalle sezioni HTML con
`makeTimeline(sections)` da `assets/scroll-timeline.js`, e nel loop leggo
`tl.narrativeT()`. Ogni voce è `{ el, station }` (ancora al centro) o
`{ el, range:[a,b] }` (due ancore = la camera si posa/travelling per tutta la
sezione); `el` è un elemento o il suo id. Quando una sezione è al centro, la
camera è al suo waypoint: testo e spazio si muovono insieme, sempre. Lo smoothstep
(incluso) addolcisce la prima tratta — di solito la più lunga in spazio 3D e la più
corta in scroll — così l'ingresso parte "in punta di piedi".

---

## 3. La grammatica delle animazioni state-driven

È il cuore tecnico del Livello C. **Ogni micro-animazione è pilotata da un
segnale 0→1 derivato dallo scroll**, mai da un timer autonomo. Un timer che gira
per conto suo si desincronizza dalla camera e diventa impossibile da riprodurre
al resume. Il segnale viene sempre dallo scroll: `proximity`, `fillOnce`, o un
latch costruito sopra `narrativeT()`.

### Assemble / disassemble a strati

Un oggetto composito che si **scompone** mentre la sezione è centrata: un
manufatto che si apre negli strati, un prodotto che rivela l'interno, un edificio
architettonico che si sfoglia piano per piano. Ogni strato `L` ha una quota di
riposo `L.y` e un offset firmato `L.off`; l'apertura è pilotata da `amt` (0→1):

```js
const explode = amt * amt;                 // ease-in: parte piano, non "scoppia"
for (const L of layers) {
  const targetY = L.y + L.off * ampiezza * explode;
  L.m.position.y += (targetY - L.m.position.y) * k;   // k = dampFactor(dtRaw)
}
```

**L'errore che ho fatto (diario §2.5):** apertura troppo ampia → gli strati
uscivano dal quadro proprio nel momento clou. La cura è quattro cose insieme:
`ampiezza` **compatta** (~0.75), lift ridotto, gli **offset perpendicolari allo
sguardo** (i pezzi si allargano di fianco, non uno dietro l'altro), e la stazione
camera **rialzata** per tenerli tutti in campo. La spettacolarità sta nel
movimento controllato, non nell'ampiezza.

### Riempimento persistente (`fillOnce`)

Livelli, liquidi, barre di avanzamento che **salgono e restano**. Il primo
istinto — usare la `proximity` — è sbagliato: la proximity fa 0→1→0 (picco al
centro), quindi dopo il centro il livello **si svuota** mentre sei ancora nella
sezione (diario §2.8). `fillOnce(top, viewportH)` sale una volta e resta pieno
finché non risali sopra la sezione.

```js
const level = tl.fillOnce('zonaB');               // 0→1 monotòno all'ingresso
liquid.scale.y += (level - liquid.scale.y) * dampFactor(dtRaw);
```

Usalo per: una serra che si "riempie" di piante mentre risali alla fonte, una
barra di risultati in un case-study SaaS, un livello che sale in una teca.
**Non** usarlo per animazioni che devono respirare e tornare indietro: quelle
vogliono la proximity (sotto).

### Latch (massimo visto)

Un traguardo che, una volta raggiunto, si **pianta** e non si ritrae. Nel mio
caso una punta che si conficca in un bersaglio e ci resta anche continuando a
scrollare (diario §2.9). La regola è tenere il **massimo mai visto**:

```js
prog = Math.max(prog, amt);                 // non torna più indietro
const eased = smoothstep(prog);             // arrivo morbido, non secco
marker.position.z = start + (end - start) * eased;
```

Buono per: una lancetta che raggiunge un obiettivo e ci resta, un tassello che
si incastra al suo posto, un indicatore che tocca il 100% e si blocca lì.

### Proximity (respiro al centro)

Animazioni che **vivono mentre la sezione è centrata** e si placano quando esci:
oscillazioni lente, brillii, rotazioni impercettibili. `proximity(mid,
viewportH)` dà 0 lontano → 1 al centro. Per farle respirare **in sincronia ma
non all'unisono**, sfaso la fase per elemento con `i*0.4`:

```js
const p = tl.proximity('zonaA');                      // 0 fuori → 1 al centro
items.forEach((it, i) => {
  const phase = time * 0.8 + i * 0.4;                  // sfasamento per elemento
  it.rotation.y += (Math.sin(phase) * 0.06 * p - it.rotation.y) * dampFactor(dtRaw);
});
```

I capi in passerella dondolano appena, i pezzi in una teca ruotano piano a
mostrare le faccette, i nodi di un flusso dati pulsano: tutti insieme ma
leggermente fuori fase, così lo sguardo non li legge come un'unica animazione
meccanica.

### Regola trasversale

Qualsiasi fase, jitter, o offset "casuale" viene dall'hash deterministico, **mai**
da `Math.random()` (bloccato nell'harness perché romperebbe i resume):

```js
function pseudo(i) {                      // fract(sin(i*12.9898)*43758.5453)
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
```

E **ogni inseguimento usa il damping fps-independent** (`dampFactor(dtRaw)` da
`assets/render-loop.js`), mai un lerp a fattore fisso: altrimenti la stessa scena
"sente" diversa a 30 e a 120 fps.

---

## 4. "Metodo esperienza immersiva" per ogni categoria/tappa

Questa è la ricetta ripetibile che distilla il metodo, la stessa per ogni tappa
qualunque sia la nicchia:

1. **2–3 soggetti reali** della categoria, ricostruiti come **oggetti 3D
   distinti** (non varianti dello stesso mesh): tre capi diversi, tre pietre
   diverse, tre attrezzi diversi.
2. Disposti **in fila lungo il percorso camera**, così scrollando ci passi
   accanto uno dopo l'altro.
3. Una **animazione continua pilotata dalla proximity DOM** della sezione (§3):
   respirano quando la loro sezione è al centro.
4. La **sezione HTML elenca gli stessi soggetti** con nome, descrizione e CTA:
   il testo e il 3D raccontano la stessa cosa.
5. Una **luce dedicata** al gruppo (una `PointLight` calda o fredda secondo il
   tono del brand): li stacca dal fondo.

Due divieti espliciti, entrambi pagati con esperienza:

- **Mai il lock di scroll.** Non inchiodare la pagina per far partire
  un'animazione: lo spettatore deve sempre poter continuare a scorrere. Il
  segnale della camera *è* lo scroll, non un'attesa forzata.
- **Mai hover/POV forzato.** Niente "muovi il mouse per guardarti intorno":
  frustra su desktop e non esiste su mobile.

**Perché soggetti fisici e non "ologrammi fluttuanti".** Nel progetto sorgente
ho provato la strada degli ologrammi dei prodotti sospesi in aria (diario §1,
V2) e li ho **scartati**: sembravano finti e si leggevano male. Oggetti veri,
posati nello spazio, con una loro luce e una loro ombra, comunicano artigianalità
e verità; gli ologrammi comunicano "demo tecnologica". La regola vale ovunque:
la gioielleria vuole la pietra su un piedistallo reale, non un glow flottante; il
SaaS è l'unica nicchia dove l'astrazione fluttuante è *coerente* col messaggio —
e proprio per questo è l'eccezione che conferma la regola.

---

## 5. Orchestrazione (lo stack di default: Astro + Three + Lenis)

Come si cabla tutto in un frame solo. L'ordine è:

1. **Capability gate.** Prima di importare il chunk 3D decidi il tier (Livello A):
   su reduced-motion / no-WebGL / save-data / RAM≤2GB parte il fallback e Three
   non si scarica nemmeno.
2. **Lenis** per lo smooth scroll: dà l'inerzia su cui si innesta il damping
   della camera.
3. **Un solo `requestAnimationFrame`** guida *sia* `lenis.raf(time)` *sia* il
   render. Non due loop: uno.

Nel frame, l'ordine dei calcoli:

```js
import { createRenderLoop } from './render-loop.js';
const loop = createRenderLoop({
  renderer, scene, camera,
  applyCamera: rig.applyCamera,     // il loop posiziona la camera al renderT smorzato
  getTargetT: narrativeT,           // scroll DOM → t∈[0,1]
  microLife: 0.01,                  // respiro impercettibile della camera
  onFrame: ({ time }) => {
    lenis.raf(time * 1000);                // Lenis nello stesso rAF (ms)
    scene.setZoneA(tl.proximity('zonaA')); // respiro sezione A
    scene.setZoneB(tl.fillOnce('zonaB'));  // riempimento sezione B
  },
});
loop.start();
```

Dentro, `createRenderLoop` smorza `renderT` verso `getTargetT()` con la formula
frame-rate-independent, chiama `rig.applyCamera(camera, renderT)` e
`renderer.render` per te; nel tuo `onFrame` fai avanzare Lenis e passi i segnali
`proximity`/`fillOnce` ai setter per zona (`setZoneA`, `setZoneB`, …), che li
inoltrano alle animazioni della scena. La camera "pesa", non teletrasporta.

**Le geometrie delle sezioni si misurano UNA volta**, al load e al resize (il
`tl.measure()` esposto da `makeTimeline`, già agganciato ai suoi listener), **mai
dentro il rAF**:
un `getBoundingClientRect` per frame forza un reflow e uccide la fluidità proprio
su mobile.

**Feature isolate dietro flag/moduli.** Ogni funzionalità rischiosa (nel sorgente
il set dressing e il carrello) vive in **un file + i suoi ganci**, dietro un
interruttore: se rompe, la togli senza toccare il resto del sito. È la regola che
ha reso ogni esperimento reversibile e ogni consegna sicura.

---

## File companion

- **Livello A** (`references/A-fluidita-e-robustezza.md`) — le primitive di
  fluidità e robustezza (damping FRI, dt clamp, pre-warm, viewport stabile,
  capability, determinismo) su cui poggia ogni animazione di questo livello.
- **Livello B** (`references/B-motore-mondo.md`) — renderer, ambiente PMREM,
  texture procedurali, InstancedMesh, la camera a doppio spline che qui dirigi.
- `references/trappole-note.md` — gli errori reali (sintomo → causa → fix):
  leggilo **prima** di modellare, così non li ripeti.
- `references/verifica-layout.md` — il loop di collaudo con screenshot su desktop
  **e** mobile: nessun waypoint è "fatto" finché non lo hai visto in quadro a
  entrambi i viewport.
- `assets/` — gli scheletri già neutri e già corretti (`scroll-timeline.js`,
  `render-loop.js`, `camera-rig.js`): copia da qui, non riscrivere da memoria.
