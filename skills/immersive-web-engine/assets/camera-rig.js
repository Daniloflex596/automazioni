/**
 * ============================================================================
 *  camera-rig.js — percorso camera "on-rails" a DOPPIO SPLINE
 * ============================================================================
 *  Costruisce il binario lungo cui la camera viaggia mentre l'utente scrolla.
 *  Neutro rispetto al tema: le `stations` sono waypoint generici dello spazio
 *  del tuo mondo (world/scene), non legati ad alcun soggetto. Costruiscile
 *  chiedendoti, per ogni tappa: "cosa deve stare in quadro qui?" e derivane la
 *  coppia posizione/target.
 *
 *  Ogni station e' una coppia:
 *    { p: [x,y,z],   // DOVE sta la camera
 *      l: [x,y,z] }  // DOVE guarda (target di lookAt)
 *
 *  Uso tipico:
 *    const rig = createCameraRig({ stations, aspect: w / h });
 *    camera.fov = rig.fovForAspect(w / h); camera.updateProjectionMatrix();
 *    // in ogni frame (con renderT gia' smorzato — vedi render-loop.js):
 *    rig.applyCamera(camera, renderT);
 *
 *  API:
 *    createCameraRig({ stations, aspect }) -> {
 *      posCurve, lookCurve, applyCamera, dampFactor, fovForAspect, onResize
 *    }
 * ============================================================================
 */
import * as THREE from 'three';

export function createCameraRig({ stations, aspect = 1 } = {}) {
  if (!Array.isArray(stations) || stations.length < 2) {
    throw new Error('createCameraRig: servono almeno 2 stations { p:[x,y,z], l:[x,y,z] }');
  }

  // --- DUE curve PARALLELE campionate allo stesso t ∈ [0,1] -----------------
  //  posCurve = traiettoria della camera; lookCurve = traiettoria dello sguardo.
  //  Tenerle SEPARATE e' cio' che toglie l'effetto "carrello su binario": la
  //  camera puo' muoversi in una direzione mentre il target ne segue un'altra,
  //  producendo parallasse — come una steadicam vera, non una rotaia rigida.
  //  Se posizione e sguardo condividessero UNA sola curva, ogni rotazione
  //  sarebbe incollata allo spostamento e il risultato sembrerebbe meccanico.
  //
  //  tension 0.4 (4o argomento di CatmullRomCurve3): scelta chiave. Le
  //  Catmull-Rom con tension bassa (verso 0) "svirgolano", prendendo curve
  //  larghe e innaturali tra i waypoint; con tension alta stringono e spigolano.
  //  0.4 tiene il percorso morbido ma aderente ai waypoint.
  //  closed=false: il percorso ha un inizio e una fine, non e' un anello.
  const posCurve = new THREE.CatmullRomCurve3(
    stations.map((s) => new THREE.Vector3(s.p[0], s.p[1], s.p[2])),
    false, 'catmullrom', 0.4,
  );
  const lookCurve = new THREE.CatmullRomCurve3(
    stations.map((s) => new THREE.Vector3(s.l[0], s.l[1], s.l[2])),
    false, 'catmullrom', 0.4,
  );

  // Vettori temporanei riusati ogni frame (zero allocazioni nel loop).
  const _pos = new THREE.Vector3();
  const _look = new THREE.Vector3();

  /**
   * Posiziona la camera al parametro t del percorso (t CLAMPATO in [0,1]:
   * fuori range non ha senso e produrrebbe estrapolazioni della spline).
   * Campiona ENTRAMBE le curve allo stesso t: posizione da posCurve, bersaglio
   * da lookCurve, poi lookAt.
   */
  function applyCamera(camera, t) {
    const tc = t < 0 ? 0 : t > 1 ? 1 : t;
    posCurve.getPoint(tc, _pos);
    lookCurve.getPoint(tc, _look);
    camera.position.copy(_pos);
    camera.lookAt(_look);
  }

  /**
   * Fattore di damping FRAME-RATE-INDEPENDENT.
   *   s = 1 - k^(min(dt, 0.25) * 60)
   * Da usare come: value += (target - value) * dampFactor(dt).
   * A 20 o 120 fps la "morbidezza" nel tempo reale e' identica; un lerp a
   * fattore fisso per-frame invece dipende dal framerate → feel non
   * riproducibile ("fluido sul mio PC"). k piu' vicino a 1 = piu' lento/pesante;
   * 0.94 e' un buon default calibrato a mano. min(dt, 0.25) evita salti dopo un
   * freeze del tab (il primo frame al ritorno ha un dt enorme).
   */
  function dampFactor(dt, k = 0.94) {
    return 1 - Math.pow(k, Math.min(dt, 0.25) * 60);
  }

  /**
   * FOV adattivo: in verticale (telefono, aspect < 0.8) il campo si allarga a
   * 64° cosi' si vede piu' scena ai lati; in orizzontale resta a 55°. Senza
   * questo, in portrait gli oggetti-chiave escono dai bordi del quadro.
   */
  function fovForAspect(a) {
    return a < 0.8 ? 64 : 55;
  }

  /**
   * Da chiamare quando cambia DAVVERO la geometria del viewport (rotazione /
   * ridimensionamento finestra). Aggiorna aspect e FOV e ricalcola la matrice
   * di proiezione. NB: i cambi "finti" (collasso della barra indirizzi mobile)
   * vanno filtrati a monte — vedi la nota sul viewport stabile in
   * scroll-timeline.js e la guardia in render-loop / boot.
   */
  function onResize(camera, a) {
    camera.aspect = a;
    camera.fov = fovForAspect(a);
    camera.updateProjectionMatrix();
  }

  return {
    posCurve,
    lookCurve,
    applyCamera,
    dampFactor,
    fovForAspect,
    onResize,
    initialAspect: aspect, // a disposizione del chiamante per il primo fov
    stations,
  };
}
