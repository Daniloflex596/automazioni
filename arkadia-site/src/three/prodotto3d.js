/**
 * ============================================================================
 *  ARKADIA — MINI SCENA 3D DI PRODOTTO ("l'ologramma del panino")
 * ============================================================================
 *  Piccolo canvas trasparente accanto alla voce di menu: il prodotto ruota e
 *  si SCOMPONE mostrando ogni ingrediente stilizzato, poi si ricompone.
 *  Data-driven: ogni prodotto è una lista di strati (tipo + colore).
 *  Leggerissima: render solo quando visibile (IntersectionObserver).
 *
 *  API: initProdotto(canvas, strati) -> { dispose }
 *  Strato: { tipo: 'bun-top'|'bun-bottom'|'patty'|'disco'|'quadro'|'anello'|'cotoletta', color, h? }
 * ============================================================================
 */
import * as THREE from 'three';

const M = (color, e = 0x000000, ei = 0.35, r = 0.7) =>
  new THREE.MeshStandardMaterial({ color, roughness: r, emissive: e, emissiveIntensity: ei });

function buildStrato(s) {
  switch (s.tipo) {
    case 'bun-top': {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), M(s.color ?? 0xa57136, 0x3a2410));
      // semi di sesamo
      for (let i = 0; i < 8; i++) {
        const seed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), M(0xf4e9d0, 0x333333, 0.2));
        const a = (i / 8) * Math.PI * 2;
        seed.position.set(Math.cos(a) * 0.32, 0.42, Math.sin(a) * 0.32);
        m.add(seed);
      }
      return m;
    }
    case 'bun-bottom':
      return new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(s.color ?? 0x9a6a30, 0x3a2410));
    case 'patty':
      return new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.2, 20), M(s.color ?? 0x4a2a16, 0x1a0d06));
    case 'cotoletta':
      return new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.14, 20), M(s.color ?? 0xc98a3a, 0x5a3a10));
    case 'disco': // insalata, pomodoro, salse…
      return new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, s.h ?? 0.06, 20), M(s.color, 0x111111));
    case 'quadro': // cheddar, formaggi a fetta
      return new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.95), M(s.color ?? 0xe8a33c, 0x6a4310));
    case 'anello': { // anelli di cipolla
      const g = new THREE.Group();
      [[-0.2, 0.06], [0.22, -0.04], [0, 0.12]].forEach(([x, z], i) => {
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 8, 16), M(s.color ?? 0xd8a860, 0x6a4a20));
        t.rotation.x = Math.PI / 2 + (i - 1) * 0.18;
        t.position.set(x, 0, z);
        g.add(t);
      });
      return g;
    }
    case 'bacon': { // strisce ondulate
      const g = new THREE.Group();
      [-0.18, 0.18].forEach((x, i) => {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.045, 1.05), M(s.color ?? 0x8a2a1a, 0x3a0d08));
        strip.rotation.y = (i - 0.5) * 0.35;
        strip.rotation.z = (i - 0.5) * 0.22;
        strip.position.x = x;
        g.add(strip);
      });
      return g;
    }
    default:
      return new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16), M(s.color ?? 0xffffff));
  }
}

export function initProdotto(canvas, strati) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;

  const scene = new THREE.Scene(); // sfondo trasparente: fluttua sulla pagina
  const camera = new THREE.PerspectiveCamera(36, canvas.clientWidth / canvas.clientHeight, 0.1, 20);
  camera.position.set(0, 0, 5.6);

  const key = new THREE.DirectionalLight(0xffe0b0, 2.6);
  key.position.set(2.5, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe8b04b, 1.4);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x6a5236, 1.6));

  const g = new THREE.Group();
  scene.add(g);
  const meshes = strati.map((s, i) => {
    const m = buildStrato(s);
    m.userData.idx = i;
    g.add(m);
    return m;
  });
  const n = meshes.length;

  let raf = 0;
  let running = false;
  const clock = new THREE.Clock();
  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    // ciclo: chiuso (2s) → esploso (2s) → chiuso… con easing morbido
    const cyc = (Math.sin(t * 0.7) + 1) / 2;
    const k = cyc * cyc * (3 - 2 * cyc);
    meshes.forEach((m, i) => {
      const centered = i - (n - 1) / 2;
      m.position.y = centered * (0.13 + k * 0.22); // apertura compatta: tutto resta in frame
      m.rotation.y = t * 0.2 * (i % 2 ? 1 : -1) * k;
    });
    g.rotation.y = t * 0.45;
    g.position.y = Math.sin(t * 1.3) * 0.04;
    renderer.render(scene, camera);
  }

  // Render solo quando il canvas è in viewport
  const io = new IntersectionObserver((en) => {
    const vis = en[0].isIntersecting;
    if (vis && !running) {
      running = true;
      clock.getDelta();
      frame();
    } else if (!vis) {
      running = false;
      cancelAnimationFrame(raf);
    }
  });
  io.observe(canvas);

  return {
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      renderer.dispose();
    },
  };
}

// Ricette 3D dei prodotti: ogni voce di menu ha i SUOI strati (dal basso in su).
export const RICETTE = {
  brexit: [
    { tipo: 'bun-bottom' },
    { tipo: 'disco', color: 0x4a7a30, h: 0.07 },   // insalata
    { tipo: 'patty' },                              // hamburger 200gr
    { tipo: 'bacon' },                              // bacon croccante
    { tipo: 'quadro', color: 0xe8a33c },            // cheddar
    { tipo: 'anello' },                             // anelli di cipolla
    { tipo: 'disco', color: 0x5a2210, h: 0.05 },    // salsa barbecue
    { tipo: 'bun-top' },
  ],
  hellfire: [
    { tipo: 'bun-bottom' },
    { tipo: 'disco', color: 0x4a7a30, h: 0.07 },    // insalata
    { tipo: 'patty' },                               // hamburger 200gr
    { tipo: 'disco', color: 0xf4ecdc, h: 0.09 },     // stracciatella
    { tipo: 'disco', color: 0xb02010, h: 0.07 },     // bomba calabra
    { tipo: 'bun-top' },
  ],
  cheeseburger: [
    { tipo: 'bun-bottom' },
    { tipo: 'patty' },                               // hamburger 200gr
    { tipo: 'bacon' },                               // bacon
    { tipo: 'disco', color: 0xf0e6d0, h: 0.1 },      // tomino
    { tipo: 'quadro', color: 0xe8a33c },             // cheddar
    { tipo: 'bun-top' },
  ],
};
