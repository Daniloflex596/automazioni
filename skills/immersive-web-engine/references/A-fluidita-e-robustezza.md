# LIVELLO A — Fluidità & robustezza

> Il **motore**, non il tema. Ogni primitiva qui è neutra: parla di `world`,
> `scene`, `stations`, `sezione` — mai di un locale, di un arredo o di un
> prodotto specifico. Il tema (cosa sono le stazioni, quali oggetti abitano la
> scena) nasce dalla nicchia del cliente e vive nel **Livello C**. Qui c'è solo
> ciò che rende l'esperienza *fluida e stabile ovunque*, riusabile tale e quale
> in qualunque progetto WebGL.
>
> Per ogni primitiva: **cosa fa · il perché · i valori calibrati · gli
> errori-da-evitare**. Il codice pronto è in `../assets/`; qui il metodo e le
> costanti. Catalogo completo dei bug in `trappole-note.md`.

## Le tre regole non negoziabili (valgono per TUTTO)

1. **Frame-rate independence.** Qualunque cosa "insegua" un target nel tempo
   (camera, riempimenti, aperture) usa il damping della §1, mai un lerp a
   fattore fisso. La fluidità deve essere identica a 20 e a 120 fps.
2. **Determinismo assoluto.** Ogni "casualità" passa dall'hash `pseudo(i)`
   (§4). `Math.random()` è **vietato**: rompe la riproducibilità build-dopo-build
   e — nell'harness di destinazione — è **bloccato** (spegne i resume).
3. **Zero asset di rete.** Texture ed environment si generano su `<canvas>`
   (vedi Livello B). Niente `.jpg/.hdr/.glb` scaricati.

---

## 1. Damping frame-rate-independent → `assets/render-loop.js`

Il singolo fattore che separa "fluido" da "fluido sul mio PC". `renderT` insegue
`targetT` (lo scroll) con un'inerzia che **non dipende dal framerate**.

```js
// nel loop, ogni frame (render-loop.js lo fa già dentro createRenderLoop):
const s = 1 - Math.pow(0.94, Math.min(dtRaw, 0.25) * 60);
renderT += (targetT - renderT) * s;
applyCamera(camera, renderT);
```

**Il perché** (bug §2.1): un lerp a **fattore fisso** `x += (t-x)*0.1` *per frame*
lega la velocità al numero di frame/secondo → a 120 fps è veloce, a 30 lento: il
"feel" non è riproducibile. `Math.pow(0.94, dt*60)` è la frazione che *resta*
dopo `dt` secondi; `1 - quello` è la frazione **percorsa** verso il target →
integrata nel tempo reale è identica a qualsiasi fps.

**Valori calibrati**
- `0.94` calibrato a mano: più vicino a 1 = camera più lenta/pesante; più bassa =
  più reattiva/secca. `0.94` è il compromesso "steadicam".
- `Math.min(dtRaw, 0.25)`: cap sul `dt` **nel damping**. Dopo un freeze del tab
  `dt` sarebbe enorme e la camera "salterebbe" tutto in un frame.
- Per le **animazioni fisiche** un cap più stretto e separato: `dt = min(dtRaw, 0.05)`.

In `assets/render-loop.js`: `createRenderLoop({ ..., damping: 0.94 })` applica la
formula; `assets/camera-rig.js` espone anche `dampFactor(dt, k)` come helper
riusabile. **Mai** un lerp fisso, da nessuna parte.

**Errori-da-evitare**: lerp a fattore fisso; dimenticare il cap sul `dt`
(salto al ritorno dal background); riusare lo stesso `dt` cappato per damping e
fisica (sono due cap diversi, 0.25 vs 0.05).

---

## 2. Anti-jank: pre-warm, `document.hidden`, dt clamp → `assets/render-loop.js`

**Pre-warm GPU.** Prima di togliere il preloader, renderizza la scena in **6
punti** lungo tutto il percorso, così shader e texture sono già compilati/caricati.

```js
import { prewarm } from './render-loop.js';
prewarm(renderer, scene, camera, applyCamera); // punti default [0.06,0.18,0.35,0.55,0.75,0.95]
```
**Il perché** (bug §2.3): compilazione shader e upload texture sono **lazy** —
avvengono la prima volta che quel materiale entra in campo → micro-scatto proprio
al primo swipe, il momento che il cliente vede per primo. Spendere ~6 render
nascosti sotto il preloader elimina l'hitch. I 6 `t` **coprono tutte le zone**
del percorso, non equispaziati a caso.

**`document.hidden` guard.** Tab in background → salta il render (GPU/batteria a
zero). `createRenderLoop` lo fa già: `if (document.hidden) return;`.

**dt clamp.** Al ritorno in primo piano `getDelta()` restituisce l'intero tempo
trascorso: senza cap ogni cosa "salterebbe" avanti in un frame. Due cap: `0.25`
(damping) e `0.05` (fisica).

**Errori-da-evitare**: togliere il preloader **senza** pre-warm (hitch garantito
su mobile); renderizzare col tab nascosto; `dt` non cappato.

---

## 3. Viewport stabile su mobile + FOV adattivo → `assets/scroll-timeline.js` · `assets/camera-rig.js`

Il **singolo fix più importante** per la fluidità reale su telefono.

**Viewport stabile via probe `100vh`.** Su Chrome/Safari mobile la barra
indirizzi **collassa al primo scroll**, cambiando `innerHeight` di ~60px **di
colpo**. Se il canvas la segue, l'inquadratura **salta** proprio entrando.

```js
const probe = document.createElement('div');
probe.style.cssText =
  'position:fixed;top:0;left:0;width:0;height:100vh;pointer-events:none;visibility:hidden';
document.body.appendChild(probe);
const vpW = () => window.innerWidth;
const vpH = () => probe.offsetHeight || window.innerHeight; // altezza STABILE
```
Il probe misura l'altezza "grande" (barra ritirata) che **non cambia** durante lo
scroll: renderer e camera nascono su quella e restano fermi. Nell'asset questo è
già fatto per te: `makeTimeline()` (`assets/scroll-timeline.js`) crea e gestisce il
probe internamente ed espone `tl.viewport()` → `{ vw, vh }` (altezza stabile in
cache) da passare al resize del renderer.

**FOV adattivo** (bug §2.7): in portrait un FOV fisso stringe troppo in verticale
→ di 3 oggetti in fila se ne vedevano solo 2. `assets/camera-rig.js` espone
`fovForAspect(a)`: `a < 0.8 ? 64 : 55`.

**Resize solo su cambi veri.** Il collasso barra emette `resize` con la stessa
misura → va reso no-op: reagisci solo a cambio larghezza o Δaltezza grande
(> 150px). Nel CSS/DOM completano il fix: `overflow-x: clip` + `overscroll-behavior`
per inchiodare l'asse orizzontale; hero a **`100lvh`** (non `svh`) così al collasso
barra non spunta la sezione sotto.

**Errori-da-evitare**: agganciare il renderer a `window.innerHeight`; reagire a
ogni `resize`; FOV fisso; `100svh` sull'hero.

---

## 4. Determinismo — MAI `Math.random()` → `assets/canvas-textures.js`

```js
import { pseudo } from './canvas-textures.js';
// pseudo(i) = fract(sin(i*12.9898)*43758.5453) → [0,1)
```
Ogni "casualità" (posizioni, rotazioni, scale, fasi di oscillazione, scatter di
particelle) usa `pseudo()`. Per assi diversi, moltiplica l'indice per costanti
diverse: `pseudo(i*3)`, `pseudo(i*7)`, `pseudo(i*13)` → sequenze scorrelate ma
deterministe.

**Il perché**: il layout "casuale" dev'essere riproducibile build-dopo-build e
stabile al resume. `Math.random()` lo renderebbe impossibile — ed è **bloccato**
nell'harness di destinazione.

**Errori-da-evitare**: `Math.random()` (vietato); stesso indice su assi diversi
(`pseudo(i)` per X e Z dà x==z → oggetti in diagonale); aspettarsi qualità
crittografica (è un hash grafico).

---

## 5. Factory dei materiali (scritta GIÀ CORRETTA) → `assets/material-factory.js`

```js
import { makeMat } from './material-factory.js';
const legno = makeMat(0x3a2416, { r: 0.55, m: 0.08 });
// makeMat(color, { r=0.85, m=0, e=0x000000, ei=1, ...rest }) → MeshStandardMaterial
// r/m/e/ei = roughness/metalness/emissive/emissiveIntensity DESTRUTTURATE ED ESCLUSE
```

**Il perché** (bug §2.4): la versione ingenua scrive le proprietà giuste e poi fa
`...opts`, **ri-iniettando** le scorciatoie `r/m/e/ei` che Three non conosce → un
warning per ognuna (nel sorgente: **193**). La cura è destrutturare ed **escludere**
le scorciatoie, spread solo `...rest` (side/transparent/opacity/map…). Verificato:
da 193 warning a 0, materiali identici.

**La versione BUGGATA (da NON scrivere mai)**
```js
// ✗ ...opts ri-inietta r/m/e/ei → 193 warning
const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({
  color, roughness: opts.r ?? 0.85, /* … */, ...opts, // ← BUG
});
```

---

## 6. Capability detection `none | low | high` → `assets/capability.js`

Decide **prima di scaricare Three.js** che esperienza servire.

```js
import { detectTier, pixelRatioFor, tierSettings } from './capability.js';
const tier = detectTier(); // 'none' | 'low' | 'high'
```

| Condizione | Tier |
|---|---|
| `prefers-reduced-motion: reduce` | `none` |
| `navigator.connection.saveData` | `none` |
| nessun contesto WebGL/WebGL2 | `none` |
| `navigator.deviceMemory <= 2` | `none` |
| mobile (`max-width:820px` **o** UA `Mobi\|Android`) | `low` |
| tutto il resto | `high` |

Su `'none'` non scarichi nemmeno il chunk 3D (centinaia di KB) → fallback leggero
immediato: rispetto per l'utente, la batteria, la connessione. Il tier scala anche
**quanto** disegni: `pixelRatioFor(tier)` cappa il devicePixelRatio (**2** high /
**1.35** low — è la leva #1 sul framerate mobile, i pixel crescono col quadrato);
`tierSettings(tier)` restituisce `{ antialias, instanceScale, lightBudget,
particles, … }` da applicare alla scena.

**Errori-da-evitare**: scaricare Three e poi decidere; non cappare il
devicePixelRatio; `deviceMemory` senza default (`|| 4`); fidarsi solo della
larghezza per "mobile" (aggiungi il test UA).

---

## 7. Fallback a cascata + `<noscript>` → `assets/boot.js`

Degrada con grazia lungo tre gradini: **motore 3D pieno → esperienza leggera →
SVG/HTML statico**. Nessun percorso lascia l'utente davanti a una pagina vuota.

```js
import { bootImmersive } from './boot.js';
await bootImmersive({
  canvas, tier,
  loadEngine: async (canvas, tier) => {
    const { initWorld } = await import('./world.js'); // import DINAMICO: pesa solo qui
    return initWorld(canvas, { tier });
  },
  loadFallback: async () => { /* esperienza leggera 2D/SVG */ },
  onProgress: (p) => preloader.setProgress(p),
});
```

**Guardia anti doppio-boot** (bug §2.12). Se il motore ha già preso scroll e
split-text e poi **fallisce**, il fallback rischia di crearne un secondo (jank +
testo doppio). `bootImmersive` alza `window.__ENGINE_BOOTED__ = true`; il modulo
di fallback lo controlla e salta il proprio setup di scroll/reveal.

**`<noscript>`** (progressive enhancement). I contenuti rivelati via JS partono a
`opacity:0`; senza JS resterebbero invisibili:
```html
<noscript><style>
  [data-reveal],[data-stagger] > *,.split-inner{opacity:1!important;transform:none!important}
</style></noscript>
```

**Errori-da-evitare**: fallback che ricrea scroll/split dopo un boot parziale
(usa `__ENGINE_BOOTED__`); reveal a `opacity:0` senza `<noscript>`; nessun ramo
statico (tieni l'SVG nel markup).

---

## 8. Refresh pulito + deep-link → `assets/boot.js`

```js
import { setupScrollRestoration } from './boot.js';
const { isReload } = setupScrollRestoration();
// onora location.hash SOLO se !isReload
```
Al refresh riparti **dall'alto** (mai dalla posizione di prima); il deep-link
`#sezione` resta onorato solo alla **prima** navigazione. `history.scrollRestoration
= 'manual'` va messo anche **inline nell'`<head>`** per battere sul tempo il
browser; il rilevamento reload-vs-navigate usa `PerformanceNavigationTiming.type`
(bug §2.13).

---

## Ordine di boot (dove ogni primitiva entra in gioco)

1. `history.scrollRestoration = 'manual'` inline + `setupScrollRestoration()` (§8).
2. **`detectTier()`** (§6) — *prima* di qualsiasi import 3D.
3. Se `none` → **fallback** (§7) e stop.
4. Crea smooth-scroll, `__ENGINE_BOOTED__ = true`, misura la geometria delle
   sezioni **una volta** (Livello B / `scroll-timeline.js`).
5. `import()` dinamico del motore → costruisci scena (probe viewport §3, renderer
   con dpr cappato §6, env/materiali/camera — Livello B).
6. **Pre-warm** su 6 punti (§2) → togli il preloader.
7. Loop (`createRenderLoop`): `document.hidden` guard (§2) · dt clamp (§2) ·
   damping (§1) · `applyCamera` · micro-vita · segnali di scroll (Livello C).
8. `resize` con guard sui cambi veri (§3).

→ Prosegui con **`B-motore-mondo.md`** (come costruire la scena) e
**`C-regia-e-metodo.md`** (come dirigerla sulla nicchia).
