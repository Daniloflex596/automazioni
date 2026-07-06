/**
 * ============================================================================
 *  render-loop.js — loop di render con damping FRAME-RATE-INDEPENDENT
 * ============================================================================
 *  Il loop possiede lo stato `renderT` (0..1) e lo insegue verso il `targetT`
 *  che gli fornisci ogni frame via getTargetT() (tipicamente da scroll-timeline).
 *  Neutro: non sa nulla del tema, muove solo la camera lungo il rig e chiama il
 *  tuo onFrame() per le animazioni di scena.
 *
 *  TRAPPOLA (il bug piu' importante per il "feel"): smorzare con un lerp a
 *  fattore FISSO — `x += (target - x) * 0.1` per frame — lega la velocita' al
 *  numero di frame al secondo. A 120fps e' veloce, a 30fps lento: la stessa
 *  scena "sente" diversa su ogni dispositivo. La cura e' il damping dipendente
 *  dal delta-time (vedi sotto), IDENTICO nel tempo reale a 20 o 120 fps.
 *
 *  DUE guardie incluse:
 *   - document.hidden: tab in background → niente render (GPU/batteria salvi).
 *   - dt clampato: `dtRaw` a 0.25 (nel damping) e `dt` a 0.05 (per le fisiche),
 *     cosi' al ritorno da un freeze del tab non ci sono salti.
 *
 *  Uso:
 *    import { createRenderLoop, prewarm } from './render-loop.js';
 *    const rig  = createCameraRig({ stations, aspect });
 *    const tl   = makeTimeline(sections);
 *    // PRIMA di togliere il preloader: scalda shader/texture lungo il percorso
 *    prewarm(renderer, scene, camera, rig.applyCamera);
 *    const loop = createRenderLoop({
 *      renderer, scene, camera,
 *      applyCamera: rig.applyCamera,
 *      getTargetT: tl.narrativeT,
 *      microLife: 0.01,                 // opt-in: respiro impercettibile
 *      onFrame: ({ dt, time, renderT }) => { / * anima la scena * / },
 *    });
 *    loop.start();
 *
 *  API:
 *    createRenderLoop({ renderer, scene, camera, applyCamera, getTargetT,
 *                       onFrame, damping, microLife, startT })
 *        -> { start, stop, dispose, getRenderT }
 *    prewarm(renderer, scene, camera, applyCamera, points?)
 * ============================================================================
 */
import * as THREE from 'three';

const DEFAULT_PREWARM = [0.06, 0.18, 0.35, 0.55, 0.75, 0.95];

/**
 * PRE-RISCALDO GPU. Renderizza la scena in alcuni punti lungo TUTTO il percorso
 * PRIMA di togliere il preloader: shader compilati e texture caricate subito,
 * cosi' il primo scroll (specie su mobile) non incontra micro-scatti dovuti
 * all'upload "pigro" dei pezzi di scena che entrano in campo per la prima volta.
 * Da chiamare una volta, a scena costruita, prima di start().
 */
export function prewarm(renderer, scene, camera, applyCamera, points = DEFAULT_PREWARM) {
  for (const t of points) {
    applyCamera(camera, t);
    renderer.render(scene, camera);
  }
  applyCamera(camera, 0); // torna all'inizio del percorso
}

export function createRenderLoop({
  renderer,
  scene,
  camera,
  applyCamera,
  getTargetT,
  onFrame,
  damping = 0.94,   // costante di damping (piu' vicino a 1 = piu' pesante)
  microLife = 0,    // ampiezza del "respiro" della camera (0 = spento)
  startT = 0,       // valore iniziale di renderT
} = {}) {
  const clock = new THREE.Clock();
  let renderT = startT;
  let running = false;
  let raf = 0;

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);

    // Tab in background: salta il render (GPU/batteria). Il cap sul dt sotto
    // evita il salto quando si torna in primo piano.
    if (typeof document !== 'undefined' && document.hidden) return;

    const dtRaw = clock.getDelta();
    const dt = Math.min(dtRaw, 0.05); // cap "fisico" per animazioni stabili
    const time = clock.elapsedTime;

    // Damping frame-rate-independent verso il target dello scroll.
    const target = getTargetT ? getTargetT() : 0;
    const s = 1 - Math.pow(damping, Math.min(dtRaw, 0.25) * 60);
    renderT += (target - renderT) * s;
    applyCamera(camera, renderT);

    // Micro-vita (opzionale): un respiro quasi impercettibile toglie la
    // fissita' robotica. Va DOPO applyCamera, che riparte ogni frame dalla
    // posizione della curva → l'offset non e' cumulativo.
    if (microLife) camera.position.y += Math.sin(time * 0.8) * microLife;

    // Aggancio per le animazioni di scena (state-driven): il chiamante muove
    // qui i suoi oggetti in funzione di dt/time e dello stato di scroll.
    if (onFrame) onFrame({ dt, time, renderT });

    renderer.render(scene, camera);
  }

  return {
    start() {
      if (running) return;
      running = true;
      clock.getDelta(); // azzera il delta accumulato (evita un primo dt enorme)
      frame();
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    dispose() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    getRenderT() { return renderT; },
  };
}
