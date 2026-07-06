# LIVELLO B — Il motore-mondo

> Come si **costruisce la scena**: renderer, atmosfera, ambiente, camera che
> viaggia, sincronia scroll↔camera. Neutro: geometrie e palette arrivano dal
> tema (Livello C), qui c'è l'impalcatura che regge qualunque mondo. Presuppone
> il Livello A (fluidità/robustezza) già cablato.
>
> Codice pronto in `../assets/`. Stack di riferimento: Astro (statico +
> `<noscript>` naturale) + Three.js + Lenis (smooth scroll su cui si innesta il
> damping). I principi valgono anche a stack diverso (R3F, vanilla): cambiano le
> API, non le leggi.

---

## 1. Renderer, tone mapping, fog (l'atmosfera) → `assets/canvas-textures.js`

Le impostazioni che danno la resa "cinema":

```js
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;
renderer.setPixelRatio(pixelRatioFor(tier));   // 2 high / 1.35 low (Livello A §6)
scene.background = new THREE.Color(BG);         // colore di fondo del tema
scene.fog = new THREE.FogExp2(BG, 0.024);       // STESSO colore del background
```

**ACES** dà il rolloff morbido sulle alte luci (i colori non "bruciano");
**exposure 1.45** schiarisce quel tanto che serve dopo ACES (che scurisce le
ombre); **FogExp2** (esponenziale) dà profondità e nasconde il "bordo del mondo".
La nebbia deve avere **lo stesso colore del background**, così sfuma nel nulla
senza uno stacco visibile.

Intona `BG`, i tre color-stop dell'ambiente (§2) e l'esposizione al **mood della
nicchia**: un laboratorio freddo, un fondale marino, una serra calda — cambiano i
colori, non la tecnica.

**Errori-da-evitare**: fog di colore diverso dal background (si vede un "muro" di
nebbia colorata); dimenticare l'exposure dopo ACES (scena spenta).

---

## 2. Ambiente PMREM + texture procedurali → `assets/canvas-textures.js`

**Environment da un gradiente 16×64.** Un canvas minuscolo diventa
l'illuminazione d'ambiente (riflessi/IBL) passando dal `PMREMGenerator`:

```js
import { makeEnvTexture } from './canvas-textures.js';
scene.environment = makeEnvTexture(renderer, ['#2a2a30', '#4a4a52', '#0e0e12']);
// 3 color-stop (alto/metà/basso) = i colori-guida del TEMA, non del pub.
```
Bastano 3 color-stop e 16×64 px: la PMREM lo sfoca in una IBL morbida coerente su
tutti i materiali standard/physical, a costo quasi zero.

**Texture procedurali.** Superfici ripetute, insegne, targhe, etichette, scrim:
tutto su `<canvas>` 2D → `CanvasTexture`. `assets/canvas-textures.js` offre
`makeGradientTexture(stops, opts)` (fondali/scrim/cieli) e `makeLabelTexture(text,
opts)` (qualunque testo dentro la scena — insegne, numeri, nomi di stazione:
passi tu testo e colori, resta neutro). Zero richieste di rete, zero peso,
**riproducibilità totale**. Prezzo: stile "illustrato", non fotografico — di
norma un vantaggio di coerenza artistica.

**Errori-da-evitare**: environment grande (inutile, la PMREM lo sfoca comunque);
non fare `dispose()` di texture e generatore intermedi (leak di render target —
gli asset lo fanno già).

---

## 3. Camera a doppio spline (il cuore cinematografico) → `assets/camera-rig.js`

Muove la camera lungo un percorso continuo fatto di `stations` (waypoint). Due
curve `CatmullRomCurve3` **parallele** campionate allo **stesso** `t ∈ [0,1]`:
`posCurve` (**dove sta** la camera) e `lookCurve` (**dove guarda**).

```js
import { createCameraRig } from './camera-rig.js';
const rig = createCameraRig({ stations, aspect: w / h });
// stations = [{ p:[x,y,z], l:[x,y,z] }, …]  (posizione + punto guardato)
// in ogni frame, con renderT già smorzato (Livello A §1):
rig.applyCamera(camera, renderT);
```

Internamente: `new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4)`.

**Perché non sembra "su binario"** (i tre accorgimenti):
1. **Position e look sono due curve diverse.** La camera può traslare in una
   direzione mentre lo sguardo ne segue un'altra → **parallasse**, come una
   steadicam vera. È questo, più di tutto, a togliere la sensazione di trenino.
2. **Damping** (Livello A §1): `renderT` insegue `targetT` con inerzia → la
   camera "pesa", non teletrasporta.
3. **Micro-vita**: un respiro impercettibile aggiunto **dopo** `applyCamera`, nel
   loop: `camera.position.y += Math.sin(time*0.8)*0.01` (±1 cm). `createRenderLoop`
   ha l'opzione `microLife`.

**tension `0.4`** è il valore chiave: con tension più bassa le Catmull-Rom
"svirgolano" (curve larghe innaturali tra i waypoint); 0.4 tiene il percorso
morbido ma aderente. `closed = false` (percorso aperto, non anello). **`t` sempre
clampato** in `applyCamera`: fuori da [0,1] una curva aperta estrapola e la camera
schizza fuori scena.

**Il criterio dei waypoint** (la parte registica) è nel Livello C: per ogni tappa
"cosa deve stare in quadro qui?" → da lì la coppia `{p, l}`.

**Errori-da-evitare**: una sola curva (position=look → torni sul binario); tension
0/default (traiettorie larghe); non clampare `t` (schizzi a inizio/fine scroll);
waypoint frontali agli oggetti in fila (li vedi in colonna, uno copre l'altro).

---

## 4. Timeline scroll ↔ camera → `assets/scroll-timeline.js`

Camera e sezioni HTML sono **la stessa timeline**: quando una sezione è al centro,
la camera è nel punto giusto della scena. Testo e spazio si muovono insieme. Un
solo costruttore, `makeTimeline(sections)`, copre sia la home sia le sottopagine:

```js
import { makeTimeline } from './scroll-timeline.js';
const tl = makeTimeline([
  { el: 'intro', station: 0 },   // sezione ancorata al suo CENTRO
  { el: 'zonaA', range: [1, 2] },// DUE ancore: la camera "si posa" da 1 a 2
  ['zonaB', 3],                   // forma compatta di { el, station }
  ['zonaC', 4, 5],                // forma compatta di { el, range }
], { lastStation: 5 });
// tl.narrativeT() → t∈[0,1] per la camera (getTargetT del render loop);
// tl.proximity(el) e tl.fillOnce(el) per le animazioni (Livello C).
// el = HTMLElement o stringa id.
```

`tl.narrativeT()` interpola tra le ancore con **smoothstep** (la camera si "posa"
su ogni stazione) e sulla prima tratta fa partire l'ingresso "in punta di piedi":
la prima tratta è la più corta in scroll ma la più lunga nello spazio 3D → senza
easing il primo swipe "spara" la camera dentro (trappola §2). Una sezione con
`range:[a,b]` genera **due ancore** (margine `min(h*0.5, vh*0.28)`): la camera
resta posata/in-travelling per tutta la sezione e trasla solo nei cambi — senza,
a fine sezione era già "in viaggio" e non ti faceva vedere gli oggetti (trappola §6).

**Il viewport stabile è dentro `makeTimeline`.** Gestisce da sé il `probe` a
`100vh` (Livello A §3) e ri-misura le geometrie solo al `load`/`resize` via
`tl.measure()`, **mai dentro il loop RAF** (un `getBoundingClientRect` per frame
forza reflow → scroll a scatti su mobile). Espone `tl.viewport()` → `{ vw, vh }`
(altezza stabile in cache) per il resize del renderer, e `tl.dispose()`.

I segnali `tl.proximity(el)` e `tl.fillOnce(el)` (più il pattern `latch`)
pilotano le **micro-animazioni** degli oggetti: il loro USO — la grammatica delle
animazioni state-driven — è il cuore del **Livello C**.

---

## 5. InstancedMesh per i ripetuti → `assets/material-factory.js`

Disegna centinaia di copie della stessa geometria in **un solo draw call**.

```js
import { makeMat } from './material-factory.js';
import { pseudo } from './canvas-textures.js';
const inst = new THREE.InstancedMesh(geo, makeMat(0xffffff, { r: 0.35, m: 0.1 }), N);
const dummy = new THREE.Object3D();
for (let i = 0; i < N; i++) {
  dummy.position.set(x0 + (pseudo(i) - 0.5) * 0.1, y0, z0 + i * step);
  dummy.rotation.y = pseudo(i * 3) * Math.PI;          // asse diverso → costante diversa
  dummy.scale.setScalar(0.8 + pseudo(i * 7) * 0.5);    // varietà deterministica
  dummy.updateMatrix();
  inst.setMatrixAt(i, dummy.matrix);
}
inst.instanceMatrix.needsUpdate = true;                // OBBLIGATORIO
```

**Il perché**: gli oggetti ripetuti (decine/centinaia) sono il modo più facile per
uccidere il framerate mobile con i draw call. Un `InstancedMesh` = 1 draw call per
tutte le istanze. Il conteggio `N` scala col tier (`tierSettings(tier).instanceScale`).
Posizioni/rotazioni/scale vengono da `pseudo()` (Livello A §4), mai da
`Math.random`.

**Errori-da-evitare**: un `Mesh` per copia (N draw call, crollo su mobile);
dimenticare `instanceMatrix.needsUpdate = true` (tutto resta all'origine);
`Math.random` per il layout.

---

## 6. Orchestrazione (come si mette insieme)

Un solo `requestAnimationFrame` guida sia `lenis.raf(time)` sia il render.
`createRenderLoop` (Livello A) è quel loop: gli passi il `getTargetT`
(= `narrativeT`/`menuT`) e l'`applyCamera` del rig; dentro `onFrame` muovi gli
oggetti in funzione dei segnali di scroll (Livello C):

```js
import { createRenderLoop, prewarm } from './render-loop.js';
prewarm(renderer, scene, camera, rig.applyCamera);      // sotto il preloader
const loop = createRenderLoop({
  renderer, scene, camera,
  applyCamera: rig.applyCamera,
  getTargetT: tl.narrativeT,     // scroll → t (Livello B §4)
  microLife: 0.01,               // respiro della camera (Livello B §3)
  onFrame: ({ dt, time, renderT }) => {
    // qui gli setter di scena: proximity/fillOnce/latch → apri/riempi/pianta
  },
});
loop.start();
```

**Feature isolate dietro flag/moduli.** Se una feature è rischiosa (set dressing
extra, carrello, un widget), vive in un file isolato agganciato da un solo punto:
cancelli il file + il suo gancio e il mondo torna com'era. Rende ogni esperimento
reversibile — regola architetturale, non stile.

→ Prosegui con **`C-regia-e-metodo.md`**: scegliere la metafora spaziale dalla
nicchia (mai un pub), tradurre le tappe in waypoint, e la grammatica delle
animazioni state-driven. Errori noti in **`trappole-note.md`**; collaudo in
**`verifica-layout.md`**.
