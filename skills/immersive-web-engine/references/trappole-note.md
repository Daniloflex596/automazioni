# Trappole note — gli errori già risolti (non ripeterli)

> Questo è **l'oro** del metodo. Ogni voce è un errore *realmente* incontrato e
> risolto in ~60 commit di tuning ossessivo su un sito immersivo vero. Leggilo
> **prima** di modellare e prima di collaudare: nessuno di questi bug è ovvio, e
> ognuno costa ore se lo scopri sul cliente. Formato: **Sintomo → Causa → Cura**,
> con i valori esatti. Neutro rispetto al tema (parlo di "camera", "sezione",
> "oggetto composito", "livello", "bersaglio").
>
> Il codice già corretto è in `../assets/`; qui c'è il *perché* di ogni scelta.

---

### 1. Jank/stutter — animazione legata al framerate
- **Sintomo:** camera e animazioni "scattano", con morbidezza diversa tra
  dispositivi veloci e lenti; a basso framerate tutto rallenta.
- **Causa:** interpolazione con lerp a **fattore fisso** per frame
  (`x += (target-x)*0.1`). I frame/secondo cambiano → la velocità effettiva
  cambia → il "feel" non è riproducibile ("fluido solo sul mio PC").
- **Cura:** damping **frame-rate-independent**: il fattore dipende dal delta-time.
  ```js
  const s = 1 - Math.pow(0.94, Math.min(dtRaw, 0.25) * 60);
  renderT += (targetT - renderT) * s;
  ```
  `0.94` calibrato a mano (→1 = più pesante); `min(dtRaw, 0.25)` evita il salto
  dopo un freeze del tab. Pronto in `assets/render-loop.js` (`createRenderLoop`)
  e `assets/camera-rig.js` (`dampFactor`).

### 2. Salto della camera al primo scroll su Chrome/Safari mobile
- **Sintomo:** entrando da smartphone, ai primissimi frame la scena "salta in
  avanti"; da desktop no.
- **Causa:** la **barra indirizzi mobile collassa al primo scroll**, cambiando
  `window.innerHeight` di ~60px di colpo. Se il canvas la segue, l'inquadratura
  salta. In più la **prima tratta** del percorso era la più corta in scroll ma la
  più lunga nello spazio 3D: partiva a velocità piena.
- **Cura:** (a) **viewport stabile** con un `probe` fisso `height:100vh` che
  misura l'altezza "grande" (barra ritirata), invariante durante lo scroll —
  renderer e camera nascono su quella; (b) **smoothstep sulla prima tratta**
  `f = f*f*(3-2f)` solo su `i===0`; (c) `overflow-x: clip` + `overscroll-behavior`
  e hero a `100lvh` (non `svh`). In `assets/camera-rig.js` e `assets/scroll-timeline.js`.
- **Verifica:** confronta screenshot a `390×784` (barra presente) e `390×844`
  (barra ritirata): l'inquadratura d'ingresso non deve spostarsi.

### 3. Micro-stutter al primissimo scroll (upload GPU pigro)
- **Sintomo:** anche con viewport stabile, un micro-scatto quando un pezzo di
  scena entra in campo per la prima volta.
- **Causa:** compilazione shader e upload texture sono **lazy** → hitch al primo
  uso.
- **Cura:** **pre-warm** su 6 punti sotto il preloader
  `[0.06,0.18,0.35,0.55,0.75,0.95]` → shader compilati e texture caricate prima.
  `prewarm(renderer, scene, camera, applyCamera)` in `assets/render-loop.js`.

### 4. ~193 warning "'r' is not a property of THREE.MeshStandardMaterial"
- **Sintomo:** `THREE.Material: 'r' is not a property…` (e `m/e/ei`) ripetuto
  centinaia di volte. Innocuo ma rumoroso — viola "console pulita".
- **Causa:** la factory scrive le proprietà giuste e poi fa `...opts`,
  **ri-iniettando** le scorciatoie `r/m/e/ei` che Three non conosce.
  ```js
  // ✗ NON FARE
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({
    color, roughness: opts.r ?? 0.85, /* … */, ...opts,   // ← rientrano r/m/e/ei: BUG
  });
  ```
- **Cura:** **destrutturare ed escludere** le scorciatoie, spread solo `...rest`.
  ```js
  // ✓ assets/material-factory.js
  const makeMat = (color, { r = 0.85, m = 0, e = 0x000000, ei = 1, ...rest } = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m, emissive: e, emissiveIntensity: ei, ...rest });
  ```
  Verificato: da 193 warning a 0, materiali identici.

### 5. Camera troppo vicina/bassa: gli oggetti escono dal quadro quando si animano
- **Sintomo:** un oggetto composito che si **scompone a strati** usciva dal quadro
  proprio nel momento clou dell'apertura.
- **Causa:** apertura degli strati troppo ampia + stazione camera troppo bassa e
  vicina, con i pezzi allineati uno dietro l'altro.
- **Cura:** apertura **compatta** (offset `* 0.75`), **lift ridotto** (~0.16),
  stazione **rialzata**, e **offset perpendicolari allo sguardo** (i pezzi si
  allargano di fianco, non in profondità). La spettacolarità sta nel movimento
  controllato, non nell'ampiezza.

### 6. Hold camera troppo stretto sulle sottopagine
- **Sintomo:** scrollando una sezione, a fine sezione la camera era già "in
  viaggio" verso la successiva: non vedevi bene gli oggetti.
- **Causa:** un'unica ancora (il centro) per sezione, con margine troppo largo.
- **Cura:** **due ancore per sezione** (inizio/fine) con margine stretto
  `min(h*0.5, vh*0.28)` → la camera si posa sulla stazione per tutta la sezione e
  trasla solo nei cambi. `makeTimeline` (voci `{ el, range:[a,b] }`) in
  `assets/scroll-timeline.js`.

### 7. Solo 2 oggetti su 3 visibili in portrait
- **Sintomo:** da smartphone, di tre soggetti in fila se ne vedevano solo due.
- **Causa:** FOV fisso troppo stretto in verticale.
- **Cura:** **FOV adattivo** `aspect < 0.8 ? 64 : 55`. `fovForAspect` in
  `assets/camera-rig.js`.

### 8. Riempimento che si "svuota" a metà sezione
- **Sintomo:** un livello (barra/liquido) tornava vuoto prima di lasciare la
  sezione.
- **Causa:** pilotato dalla **`proximity`** (0→1→0, picco al centro) → dopo il
  picco calava.
- **Cura:** **`fillOnce`** — riempimento **persistente**:
  `clamp01((scrollY + vh*0.6 - top) / (vh*0.75))`, sale una volta e resta.
  In `assets/scroll-timeline.js`.

### 9. Un elemento non si "pianta" e si ritrae
- **Sintomo:** una punta che si conficca in un bersaglio arrivava vicino ma
  restava sospesa e, continuando a scrollare, si ritraeva.
- **Causa 1** (mira): l'apice arrivava corto di pochi cm. **Causa 2**
  (persistenza): pilotato dalla `proximity` → si piantava solo all'istante del
  picco, poi tornava indietro.
- **Cura:** correggi la mira **e** usa un **latch**: `prog = Math.max(prog, amt)`
  (massimo mai visto) con `smoothstep(prog)` per l'arrivo morbido → arriva al
  centro seguendo lo scroll e **resta**.

### 10. Discendenti tagliati (g/p/q/j) nei titoli split-text
- **Sintomo:** la coda della "g" (e p/q/j) appariva tranciata.
- **Causa:** lo split-text avvolge ogni parola in una maschera `overflow:hidden`
  (per il reveil); con `line-height` stretto del serif il discendente usciva sotto
  il padding-box e veniva clippato.
- **Cura:** `padding-bottom: 0.36em` + `margin-bottom: -0.36em` (spazio sotto la
  baseline senza cambiare interlinea) e `translateY(150%)` sul buffer nascosto
  (deve essere **≥** del padding, altrimenti la parola spunta prima del reveal).

### 11. Doppio smooth-scroll + testo doppio quando il 3D fallisce dopo l'init
- **Sintomo:** bug latente — se il motore falliva DOPO aver creato scroll e
  split-text, il fallback ne creava un **secondo** (jank + testo doppio).
- **Causa:** il fallback ricreava scroll/split senza sapere che il principale li
  aveva già allestiti.
- **Cura:** guardia globale `window.__ENGINE_BOOTED__`: se è `true`, il fallback
  aggancia solo l'update e NON crea un secondo motore di scroll/reveal.
  Gestita in `assets/boot.js` (`bootImmersive`).

### 12. Refresh che non torna in cima (sottopagine)
- **Sintomo:** aggiornando una sottopagina, non si tornava in cima.
- **Causa:** il browser ripristina la posizione di scroll al reload; con lo smooth
  scroll e un `#hash` nell'URL, la pagina restava dov'era.
- **Cura:** `history.scrollRestoration = 'manual'` (anche **inline nell'`<head>`**
  per battere il timing) + rilevamento **reload vs navigate** via
  `PerformanceNavigationTiming.type`: su reload sempre in cima, il deep-link
  `#sezione` onorato solo alla prima navigazione. `setupScrollRestoration` in
  `assets/boot.js`.

### 13. Codice morto (scaffold di feature mai attivate)
- **Sintomo:** una funzione (es. il gate di un'intro cinematica mai avviata) era
  sempre `false` → un'attesa che era un no-op; scaffold di una feature rimossa.
- **Causa:** codice sopravvissuto a un cambio di direzione.
- **Cura:** rimuovi il ramo morto **e** la relativa API, poi **verifica
  l'invarianza** (scroll/camera identici). Il dead code confonde chi legge e
  nasconde bug.

### 14. Minori ma reali
- **z-fighting / collisioni** tra un elemento e la camera in apertura, o tra due
  elementi ravvicinati → sposta gli oggetti (una lavagna troppo addosso alla
  camera, una mappa che compenetra una mensola: bastano pochi cm).
- **`grep -c` interrompe le catene `&&`** quando trova zero match (exit code 1):
  negli script di verifica separa i comandi con `;`, non con `&&`.
- **Editor "file not read"** dopo modifiche via script esterni: fai una Read prima
  della Edit.
- **Preview server morto** dopo un reset del container: rilancia `npm run preview`
  prima degli screenshot.
- **Screenshot in timeout** (swiftshader lento con scena piena): alza i timeout
  (`setDefaultTimeout(90000)`).

---

## Regola d'oro dei bug

1. La fluidità deve essere **identica a 20 e a 120 fps** (mai un lerp fisso).
2. La console deve essere a **0 warning / 0 error**.
3. Ogni fix si verifica con **screenshot desktop *e* mobile**, un parametro alla
   volta (vedi `verifica-layout.md`). Un cambiamento non è "fatto" finché non l'hai
   *visto* in quadro a entrambi i viewport.
