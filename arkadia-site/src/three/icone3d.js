/**
 * ============================================================================
 *  ARKADIA — ICONE 3D DEL MENU (renderer condiviso)
 * ============================================================================
 *  Ogni voce del /menu ha la sua mini icona 3D, costruita proceduralmente e
 *  DISTINTA per prodotto (bicchiere giusto, colore giusto, guarnizione giusta).
 *
 *  Vincolo tecnico: i browser limitano i contesti WebGL attivi (~8-16), il
 *  menu ha ~60 voci. Quindi: UN solo WebGLRenderer offscreen; ogni voce ha un
 *  canvas 2D; a ogni frame si renderizzano SOLO le icone visibili (IO) e il
 *  frame viene copiato nel canvas 2D con drawImage. Budget per frame limitato.
 *
 *  API: initIcone(canvases) — canvas.micona con data-icona='{"t":"tipo",...}'
 * ============================================================================
 */
import * as THREE from 'three';

const W = 128, H = 160;

export function initIcone(canvases) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 12);
  camera.position.set(0, 0.95, 3.2);
  camera.lookAt(0, 0.45, 0);
  scene.add(new THREE.AmbientLight(0xffe2b8, 1.5));
  const key = new THREE.PointLight(0xffc06a, 26, 12, 2);
  key.position.set(1.7, 2.5, 2.3);
  scene.add(key);
  const rim = new THREE.PointLight(0x9cc2ff, 7, 12, 2);
  rim.position.set(-2.1, 1.5, -1.8);
  scene.add(rim);

  /* ---------- materiali & primitive ---------- */
  const M = (color, o = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.6, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1 });
  const GLASS = () =>
    new THREE.MeshPhysicalMaterial({ color: 0xf3ead6, roughness: 0.06, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const ICE = () =>
    new THREE.MeshPhysicalMaterial({ color: 0xf8fbff, roughness: 0.15, transparent: true, opacity: 0.5 });
  const cyl = (rt, rb, h, m, open = false, seg = 18) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), m);
  const sph = (r, m, seg = 16) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, 12), m);
  const box = (x, y, z, m) => new THREE.Mesh(new THREE.BoxGeometry(x, y, z), m);
  const tor = (r, t, m) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 18), m);
  const col = (s, d) => parseInt(s || d, 16);
  const liquidE = (c) => {
    // emissiva scura derivata dal colore: liquido caldo mai sbiancato
    const cc = new THREE.Color(c);
    return cc.multiplyScalar(0.35).getHex();
  };
  const liq = (rt, rb, h, c) => cyl(rt, rb, h, M(c, { r: 0.28, e: liquidE(c), ei: 0.55 }));

  /* guarnizioni riusabili */
  const gLime = () => {
    const m = sph(0.09, M(0x7ab830, { r: 0.5, e: 0x2a5008, ei: 0.4 }));
    m.scale.set(1, 0.55, 0.55);
    return m;
  };
  const gSlice = (c = 0xe89030) => {
    const g = new THREE.Group();
    const polpa = cyl(0.11, 0.11, 0.02, M(c, { r: 0.5, e: liquidE(c), ei: 0.4 }));
    const buccia = tor(0.11, 0.014, M(0xc05a10, { r: 0.5 }));
    buccia.rotation.x = Math.PI / 2;
    g.add(polpa, buccia);
    g.rotation.z = 0.85;
    return g;
  };
  const gMenta = () => {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const f = sph(0.05, M(0x3f8a28, { r: 0.6 }));
      f.scale.set(1, 0.5, 0.7);
      f.position.set(-0.05 + i * 0.05, i * 0.03, (i - 1) * 0.03);
      g.add(f);
    }
    return g;
  };
  const gFragola = () => {
    const g = new THREE.Group();
    const f = sph(0.08, M(0xd02030, { r: 0.4, e: 0x500810, ei: 0.4 }));
    f.scale.y = 1.2;
    const ciuffo = cyl(0.045, 0.02, 0.04, M(0x3f8a28, { r: 0.6 }));
    ciuffo.position.y = 0.09;
    g.add(f, ciuffo);
    return g;
  };
  const gCannuccia = (c = 0xc22a1e) => {
    const s = cyl(0.018, 0.018, 0.55, M(c, { r: 0.5 }));
    s.rotation.z = -0.3;
    return s;
  };
  const piatto = (r = 0.42) => {
    const p = cyl(r, r * 0.92, 0.045, M(0xf4e9d0, { r: 0.55 }));
    p.position.y = 0.02;
    return p;
  };

  /* ---------- BICCHIERI ---------- */
  function pinta({ c }) {
    const g = new THREE.Group();
    const colr = col(c, 'e8c04a');
    const glass = cyl(0.3, 0.24, 0.9, GLASS(), true);
    glass.position.y = 0.45;
    const l = liq(0.27, 0.22, 0.72, colr);
    l.position.y = 0.38;
    const foam = cyl(0.285, 0.285, 0.09, M(0xf4e9d0, { r: 0.95 }));
    foam.position.y = 0.79;
    g.add(glass, l, foam);
    return g;
  }
  function bottiglia({ c, lab }) {
    const g = new THREE.Group();
    const vetro = col(c, '5a3212');
    const body = cyl(0.21, 0.23, 0.6, M(vetro, { r: 0.35, e: liquidE(vetro), ei: 0.4 }));
    body.position.y = 0.3;
    const spalla = cyl(0.075, 0.21, 0.2, M(vetro, { r: 0.35, e: liquidE(vetro), ei: 0.4 }));
    spalla.position.y = 0.7;
    const collo = cyl(0.06, 0.075, 0.24, M(vetro, { r: 0.35, e: liquidE(vetro), ei: 0.4 }));
    collo.position.y = 0.9;
    const tappo = cyl(0.068, 0.068, 0.05, M(0xb98a3e, { r: 0.3, m: 0.8 }));
    tappo.position.y = 1.03;
    const label = cyl(0.218, 0.235, 0.22, M(col(lab, 'e8b04b'), { r: 0.7 }));
    label.position.y = 0.32;
    g.add(body, spalla, collo, tappo, label);
    return g;
  }
  function tumbler({ c, ice, twist, frutto }) {
    const g = new THREE.Group();
    const glass = cyl(0.3, 0.26, 0.55, GLASS(), true);
    glass.position.y = 0.28;
    const fondo = cyl(0.26, 0.26, 0.05, GLASS());
    fondo.position.y = 0.03;
    const l = liq(0.27, 0.24, 0.38, col(c, '8e1420'));
    l.position.y = 0.26;
    g.add(glass, fondo, l);
    if (ice) {
      const cube = box(0.18, 0.18, 0.18, ICE());
      cube.position.set(0.03, 0.4, 0.02);
      cube.rotation.set(0.4, 0.7, 0.15);
      g.add(cube);
    }
    if (twist) {
      const tw = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 14, Math.PI * 1.4), M(0xe08020, { r: 0.5, e: 0x6a3208, ei: 0.3 }));
      tw.position.set(0.2, 0.56, 0.05);
      tw.rotation.set(0.6, 0.3, 1.1);
      g.add(tw);
    }
    if (frutto) {
      const fr = gFragola();
      fr.position.set(0.22, 0.58, 0);
      g.add(fr);
    }
    return g;
  }
  function highball({ c, c2, mint, lime, slice, straw }) {
    const g = new THREE.Group();
    const glass = cyl(0.24, 0.21, 0.85, GLASS(), true);
    glass.position.y = 0.43;
    const fondo = cyl(0.21, 0.21, 0.05, GLASS());
    fondo.position.y = 0.03;
    if (c2) {
      const l2 = liq(0.2, 0.19, 0.2, col(c2, 'c02040'));
      l2.position.y = 0.16;
      const l1 = liq(0.21, 0.2, 0.42, col(c, 'f09030'));
      l1.position.y = 0.47;
      g.add(l2, l1);
    } else {
      const l = liq(0.21, 0.19, 0.62, col(c, 'c87828'));
      l.position.y = 0.37;
      g.add(l);
    }
    g.add(glass, fondo);
    if (mint) {
      const m = gMenta();
      m.position.set(0, 0.72, 0);
      g.add(m);
    }
    if (lime) {
      const li = gLime();
      li.position.set(0.2, 0.85, 0);
      li.rotation.z = 0.5;
      g.add(li);
    }
    if (slice) {
      const sl = gSlice(col(slice, 'e89030'));
      sl.position.set(0.22, 0.82, 0);
      g.add(sl);
    }
    if (straw) {
      const st = gCannuccia();
      st.position.set(-0.1, 0.75, 0);
      g.add(st);
    }
    return g;
  }
  function goblet({ c, slice, ice }) {
    const g = new THREE.Group();
    const foot = cyl(0.2, 0.23, 0.045, GLASS());
    foot.position.y = 0.02;
    const stem = cyl(0.035, 0.035, 0.28, GLASS());
    stem.position.y = 0.18;
    const bowl = cyl(0.32, 0.2, 0.5, GLASS(), true);
    bowl.position.y = 0.57;
    const l = liq(0.29, 0.19, 0.4, col(c, 'e06010'));
    l.position.y = 0.53;
    g.add(foot, stem, bowl, l);
    if (ice) {
      const cube = box(0.15, 0.15, 0.15, ICE());
      cube.position.set(-0.04, 0.68, 0.03);
      cube.rotation.set(0.4, 0.6, 0.2);
      g.add(cube);
    }
    if (slice) {
      const sl = gSlice(col(slice, 'e89030'));
      sl.position.set(0.29, 0.85, 0);
      g.add(sl);
    }
    return g;
  }
  function coupe({ c }) {
    const g = new THREE.Group();
    const foot = cyl(0.2, 0.23, 0.045, GLASS());
    foot.position.y = 0.02;
    const stem = cyl(0.03, 0.03, 0.34, GLASS());
    stem.position.y = 0.21;
    const bowl = cyl(0.36, 0.14, 0.26, GLASS(), true);
    bowl.position.y = 0.51;
    const l = liq(0.33, 0.13, 0.18, col(c, '7a1620'));
    l.position.y = 0.49;
    g.add(foot, stem, bowl, l);
    return g;
  }
  function flute({ c }) {
    const g = new THREE.Group();
    const foot = cyl(0.17, 0.2, 0.04, GLASS());
    foot.position.y = 0.02;
    const stem = cyl(0.028, 0.028, 0.22, GLASS());
    stem.position.y = 0.15;
    const tube = cyl(0.15, 0.11, 0.72, GLASS(), true);
    tube.position.y = 0.62;
    const l = liq(0.13, 0.1, 0.56, col(c, 'c84838'));
    l.position.y = 0.56;
    g.add(foot, stem, tube, l);
    for (let i = 0; i < 3; i++) {
      const b = sph(0.02, M(0xffd8c0, { r: 0.3, e: 0xffb090, ei: 0.8 }), 8);
      b.position.set((i - 1) * 0.05, 0.42 + i * 0.16, 0.02 * (i - 1));
      g.add(b);
    }
    return g;
  }
  function balloon({ c, lime }) {
    const g = new THREE.Group();
    const foot = cyl(0.2, 0.23, 0.045, GLASS());
    foot.position.y = 0.02;
    const stem = cyl(0.035, 0.035, 0.2, GLASS());
    stem.position.y = 0.14;
    const bowl = sph(0.34, GLASS());
    bowl.scale.y = 0.92;
    bowl.position.y = 0.5;
    const l = liq(0.28, 0.22, 0.26, col(c, 'dce8e0'));
    l.position.y = 0.42;
    g.add(foot, stem, bowl, l);
    if (lime) {
      const li = gLime();
      li.position.set(0.16, 0.72, 0.08);
      li.rotation.z = 0.6;
      g.add(li);
    }
    return g;
  }
  function shot({ c }) {
    const g = new THREE.Group();
    const glass = cyl(0.17, 0.13, 0.32, GLASS(), true);
    glass.position.y = 0.36;
    const fondo = cyl(0.13, 0.13, 0.05, GLASS());
    fondo.position.y = 0.23;
    const l = liq(0.15, 0.12, 0.22, col(c, 'c87828'));
    l.position.y = 0.37;
    g.add(glass, fondo, l);
    g.scale.setScalar(1.35);
    return g;
  }
  function vino({ c }) {
    const g = new THREE.Group();
    const foot = cyl(0.19, 0.22, 0.04, GLASS());
    foot.position.y = 0.02;
    const stem = cyl(0.028, 0.028, 0.3, GLASS());
    stem.position.y = 0.19;
    const bowl = cyl(0.26, 0.15, 0.46, GLASS(), true);
    bowl.position.y = 0.57;
    const l = liq(0.23, 0.14, 0.28, col(c, '7a1626'));
    l.position.y = 0.49;
    g.add(foot, stem, bowl, l);
    return g;
  }

  /* ---------- CAFFETTERIA ---------- */
  function tazzina() {
    const g = new THREE.Group();
    g.add(piatto(0.34));
    const cup = cyl(0.24, 0.16, 0.24, M(0xf4e9d0, { r: 0.4 }));
    cup.position.y = 0.16;
    const caffe = cyl(0.2, 0.2, 0.03, M(0x3a2010, { r: 0.3, e: 0x180a04, ei: 0.5 }));
    caffe.position.y = 0.27;
    const manico = tor(0.1, 0.03, M(0xf4e9d0, { r: 0.4 }));
    manico.position.set(0.26, 0.16, 0);
    g.add(cup, caffe, manico);
    g.scale.setScalar(1.15);
    return g;
  }
  function mug({ c }) {
    const g = new THREE.Group();
    const body = cyl(0.24, 0.22, 0.52, GLASS(), true);
    body.position.y = 0.27;
    const fondo = cyl(0.22, 0.22, 0.05, GLASS());
    fondo.position.y = 0.03;
    const l = liq(0.21, 0.2, 0.36, col(c, 'c87828'));
    l.position.y = 0.24;
    const crema = cyl(0.215, 0.215, 0.06, M(0xf0e2c8, { r: 0.9 }));
    crema.position.y = 0.46;
    const manico = tor(0.11, 0.028, M(0xd9cdb4, { r: 0.4 }));
    manico.position.set(0.27, 0.27, 0);
    g.add(body, fondo, l, crema, manico);
    return g;
  }
  function tisana() {
    const g = new THREE.Group();
    g.add(piatto(0.4));
    const cup = cyl(0.3, 0.22, 0.26, M(0xf4e9d0, { r: 0.4 }));
    cup.position.y = 0.17;
    const the = cyl(0.26, 0.26, 0.03, M(0xc08828, { r: 0.3, e: 0x5a3808, ei: 0.5 }));
    the.position.y = 0.29;
    const manico = tor(0.11, 0.03, M(0xf4e9d0, { r: 0.4 }));
    manico.position.set(0.32, 0.17, 0);
    // cartellino della bustina appeso al bordo
    const filo = cyl(0.006, 0.006, 0.16, M(0xd9cdb4, { r: 0.8 }));
    filo.position.set(-0.28, 0.24, 0);
    filo.rotation.z = 0.35;
    const tag = box(0.11, 0.14, 0.015, M(0xc85028, { r: 0.7 }));
    tag.position.set(-0.32, 0.12, 0);
    g.add(cup, the, manico, filo, tag);
    return g;
  }

  /* ---------- CUCINA ---------- */
  const STRATI = {
    insalata: () => { const m = cyl(0.36, 0.34, 0.05, M(0x4a7a30, { r: 0.9 })); m.scale.z = 0.93; return [m, 0.05]; },
    patty: () => [cyl(0.3, 0.305, 0.13, M(0x4a2a16, { r: 0.85 })), 0.13],
    cotoletta: () => [cyl(0.33, 0.335, 0.08, M(0xd0882a, { r: 0.6, e: 0x5a3208, ei: 0.25 })), 0.08],
    bacon: () => {
      const g = new THREE.Group();
      for (let k = 0; k < 2; k++) {
        const s = box(0.36, 0.03, 0.14, M(k ? 0x8a3020 : 0xa04028, { r: 0.7 }));
        s.position.set(0, 0, -0.09 + k * 0.18);
        s.rotation.y = (k ? -1 : 1) * 0.3;
        g.add(s);
      }
      return [g, 0.04];
    },
    cheddar: () => { const m = box(0.5, 0.035, 0.5, M(0xe8a33c, { r: 0.5, e: 0x6a4310, ei: 0.25 })); m.rotation.y = Math.PI / 5; return [m, 0.035]; },
    stracciatella: () => { const m = sph(0.26, M(0xf6f2e8, { r: 0.95 })); m.scale.set(1.2, 0.3, 1.1); return [m, 0.1]; },
    bomba: () => [cyl(0.27, 0.275, 0.06, M(0xb83010, { r: 0.75, e: 0x501004, ei: 0.4 })), 0.06],
    secchi: () => {
      const g = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        const s = box(0.14, 0.03, 0.08, M(0x8a2818, { r: 0.7 }));
        s.position.set(-0.12 + k * 0.12, 0, (k % 2 ? 1 : -1) * 0.06);
        s.rotation.y = k;
        g.add(s);
      }
      return [g, 0.04];
    },
    tomino: () => [cyl(0.2, 0.2, 0.1, M(0xf0ead8, { r: 0.85 })), 0.1],
    anelli: () => {
      const g = new THREE.Group();
      for (let k = 0; k < 2; k++) {
        const r = tor(0.12, 0.035, M(0xd8912f, { r: 0.55, e: 0x6a3a10, ei: 0.2 }));
        r.rotation.x = Math.PI / 2;
        r.position.set(-0.1 + k * 0.2, 0, k ? 0.05 : -0.05);
        g.add(r);
      }
      return [g, 0.07];
    },
    pomodoro: () => [cyl(0.28, 0.28, 0.05, M(0xa03020, { r: 0.7 })), 0.05],
  };
  function burger({ pane, s, mini }) {
    const g = new THREE.Group();
    let y = 0.02;
    const bb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0x9a6a30, { r: 0.75 }));
    bb.position.y = y + 0.09;
    g.add(bb);
    y += 0.1;
    (s || []).forEach((nome) => {
      const f = STRATI[nome];
      if (!f) return;
      const [mesh, h] = f();
      mesh.position.y = y + h / 2;
      g.add(mesh);
      y += h;
    });
    // pane superiore per stile
    if (pane === 'rustico') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0x6a4520, { r: 0.95 }));
      cap.scale.y = 0.72;
      cap.position.y = y;
      g.add(cap);
      for (let k = 0; k < 4; k++) {
        const fl = sph(0.03, M(0xd9c9a8, { r: 1 }), 8);
        const a = k * 1.9;
        fl.position.set(Math.cos(a) * 0.2, y + 0.16, Math.sin(a) * 0.2);
        fl.scale.y = 0.3;
        g.add(fl);
      }
    } else if (pane === 'brioche') {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshPhysicalMaterial({ color: 0xc07f3a, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 })
      );
      cap.position.y = y;
      g.add(cap);
    } else {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.345, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0xa57136, { r: 0.7 }));
      cap.position.y = y;
      g.add(cap);
      if (pane === 'sesamo')
        for (let k = 0; k < 8; k++) {
          const se = sph(0.022, M(0xf2e2c0, { r: 0.9 }), 8);
          const a = k * 0.82;
          const e = 0.4 + (k % 3) * 0.25;
          se.position.set(Math.cos(a) * Math.cos(e) * 0.34, y + Math.sin(e) * 0.34, Math.sin(a) * Math.cos(e) * 0.34);
          se.scale.y = 0.5;
          g.add(se);
        }
    }
    if (mini) g.scale.setScalar(0.78);
    g.position.y = 0.04;
    return g;
  }
  function bowl() {
    const g = new THREE.Group();
    const ciotola = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0xf4e9d0, { r: 0.5 }));
    ciotola.position.y = 0.4;
    ciotola.scale.y = 0.85;
    g.add(ciotola);
    for (let k = 0; k < 6; k++) {
      const foglia = sph(0.1, M(k % 2 ? 0x4a7a30 : 0x6a9a40, { r: 0.85 }));
      const a = k * 1.1;
      foglia.scale.set(1, 0.5, 0.8);
      foglia.position.set(Math.cos(a) * 0.18, 0.44 + (k % 3) * 0.04, Math.sin(a) * 0.18);
      g.add(foglia);
    }
    const pomo = sph(0.07, M(0xc03020, { r: 0.5, e: 0x500c08, ei: 0.4 }));
    pomo.position.set(0.12, 0.52, -0.1);
    const nacho = box(0.16, 0.02, 0.14, M(0xe8b04b, { r: 0.6 }));
    nacho.rotation.set(0.4, 0.6, 0);
    nacho.position.set(-0.14, 0.54, 0.08);
    const salsa = sph(0.08, M(0xf6f2e8, { r: 0.9 }));
    salsa.scale.y = 0.4;
    salsa.position.set(0, 0.5, 0.14);
    g.add(pomo, nacho, salsa);
    return g;
  }
  function salsiccia() {
    const g = new THREE.Group();
    g.add(piatto(0.44));
    const s1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 6, 12), M(0x8a3a1c, { r: 0.6, e: 0x3a1408, ei: 0.3 }));
    s1.rotation.z = Math.PI / 2;
    s1.rotation.y = 0.3;
    s1.position.y = 0.13;
    const s2 = s1.clone();
    s2.rotation.y = -0.35;
    s2.position.set(0.03, 0.24, -0.05);
    const salsa = sph(0.1, M(0xc09030, { r: 0.4, e: 0x5a3808, ei: 0.4 }));
    salsa.scale.y = 0.3;
    salsa.position.set(-0.2, 0.09, 0.22);
    g.add(s1, s2, salsa);
    return g;
  }

  /* ---------- FRITTI ---------- */
  function friescup({ cheese, pepe }) {
    const g = new THREE.Group();
    const cup = cyl(0.26, 0.18, 0.42, M(0x7a2e1e, { r: 0.7, side: THREE.DoubleSide }), true);
    cup.position.y = 0.24;
    g.add(cup);
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7;
      const fry = box(0.05, 0.42, 0.05, M(0xe8b04b, { r: 0.55, e: 0x6a4310, ei: 0.2 }));
      fry.position.set(Math.cos(a) * 0.1, 0.45, Math.sin(a) * 0.1);
      fry.rotation.z = Math.sin(a) * 0.25;
      fry.rotation.x = Math.cos(a * 2) * 0.2;
      g.add(fry);
      if (pepe) {
        const p = sph(0.014, M(0x201510, { r: 0.9 }), 6);
        p.position.set(Math.cos(a) * 0.1, 0.56 + (i % 3) * 0.03, Math.sin(a) * 0.1 + 0.03);
        g.add(p);
      }
    }
    if (cheese) {
      const ch = sph(0.19, M(0xf0b23c, { r: 0.35, e: 0x7a4a08, ei: 0.5 }));
      ch.scale.set(1.1, 0.35, 1.1);
      ch.position.y = 0.52;
      g.add(ch);
      for (let i = 0; i < 4; i++) {
        const bit = box(0.05, 0.02, 0.035, M(0x8a3020, { r: 0.6 }));
        const a = i * 1.6;
        bit.position.set(Math.cos(a) * 0.1, 0.58, Math.sin(a) * 0.1);
        g.add(bit);
      }
    }
    if (pepe) {
      const cr = sph(0.17, M(0xf0e8d0, { r: 0.6, e: 0x6a6048, ei: 0.2 }));
      cr.scale.set(1.05, 0.3, 1.05);
      cr.position.y = 0.5;
      g.add(cr);
    }
    return g;
  }
  function stick() {
    const g = new THREE.Group();
    const cup = cyl(0.22, 0.16, 0.4, M(0xb98a3e, { r: 0.7, side: THREE.DoubleSide }), true);
    cup.position.y = 0.23;
    g.add(cup);
    for (let i = 0; i < 8; i++) {
      const a = i * 0.8;
      const fry = box(0.045, 0.6, 0.045, M(0xe0a838, { r: 0.55, e: 0x6a4310, ei: 0.2 }));
      fry.position.set(Math.cos(a) * 0.08, 0.5, Math.sin(a) * 0.08);
      fry.rotation.z = Math.sin(a) * 0.12;
      g.add(fry);
    }
    return g;
  }
  function rings() {
    const g = new THREE.Group();
    g.add(piatto(0.4));
    for (let i = 0; i < 3; i++) {
      const r = tor(0.2, 0.07, M(0xd8912f, { r: 0.5, e: 0x6a3a10, ei: 0.25 }));
      r.rotation.x = Math.PI / 2;
      r.position.set((i % 2 ? 1 : -1) * 0.02, 0.12 + i * 0.14, (i % 2 ? -1 : 1) * 0.02);
      g.add(r);
    }
    const lean = tor(0.2, 0.07, M(0xd8912f, { r: 0.5, e: 0x6a3a10, ei: 0.25 }));
    lean.position.set(0.3, 0.16, 0.12);
    lean.rotation.set(1.1, 0, 0.5);
    g.add(lean);
    return g;
  }
  function nuggets() {
    const g = new THREE.Group();
    g.add(piatto(0.42));
    for (let i = 0; i < 4; i++) {
      const n = sph(0.14, M(0xd8912f, { r: 0.6, e: 0x6a3a10, ei: 0.25 }));
      n.scale.set(1.15, 0.55, 0.9);
      const a = i * 1.65;
      n.position.set(Math.cos(a) * 0.17, 0.12 + (i === 3 ? 0.1 : 0), Math.sin(a) * 0.17);
      n.rotation.y = a;
      g.add(n);
    }
    return g;
  }
  function palline() {
    const g = new THREE.Group();
    g.add(piatto(0.42));
    for (let i = 0; i < 5; i++) {
      const p = sph(0.13, M(0xa87830, { r: 0.7, e: 0x4a3010, ei: 0.25 }));
      const a = i * 1.3;
      const top = i === 4;
      p.position.set(top ? 0 : Math.cos(a) * 0.18, top ? 0.32 : 0.15, top ? 0 : Math.sin(a) * 0.18);
      g.add(p);
    }
    return g;
  }
  function tagliere() {
    const g = new THREE.Group();
    const board = box(0.85, 0.06, 0.55, M(0x8a5a28, { r: 0.6 }));
    board.position.y = 0.05;
    const manico = cyl(0.1, 0.1, 0.06, M(0x8a5a28, { r: 0.6 }));
    manico.position.set(0.52, 0.05, 0);
    g.add(board, manico);
    for (let i = 0; i < 2; i++) {
      const mo = cyl(0.07, 0.07, 0.1, M(0xd8912f, { r: 0.55, e: 0x6a3a10, ei: 0.25 }));
      mo.position.set(-0.28 + i * 0.15, 0.13, 0.14);
      g.add(mo);
    }
    for (let i = 0; i < 3; i++) {
      const ol = sph(0.055, M(0xb87a20, { r: 0.6, e: 0x4a2a08, ei: 0.3 }));
      ol.position.set(-0.05 + i * 0.13, 0.12, -0.14);
      g.add(ol);
    }
    const ring = tor(0.09, 0.032, M(0xd8912f, { r: 0.5, e: 0x6a3a10, ei: 0.25 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0.24, 0.12, 0.1);
    const cro = box(0.18, 0.075, 0.09, M(0xcf8828, { r: 0.6, e: 0x5a3208, ei: 0.25 }));
    cro.rotation.y = 0.6;
    cro.position.set(-0.3, 0.12, -0.12);
    g.add(ring, cro);
    g.scale.setScalar(1.05);
    g.position.y = 0.1;
    return g;
  }

  /* ---------- DESSERT ---------- */
  function crepe() {
    const g = new THREE.Group();
    g.add(piatto(0.44));
    const wm = M(0xcf9038, { r: 0.6, e: 0x4a2808, ei: 0.3 });
    const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.41, 0.07, 22, 1, false, 0, Math.PI / 2), wm);
    w1.position.y = 0.09;
    w1.rotation.y = Math.PI * 0.72;
    const w2 = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.38, 0.065, 22, 1, false, 0, Math.PI / 2), wm);
    w2.position.y = 0.16;
    w2.rotation.y = Math.PI * 0.72 + 0.2;
    g.add(w1, w2);
    const nut = M(0x3a1e0c, { r: 0.25, e: 0x1a0c04, ei: 0.6 });
    for (let i = 0; i < 3; i++) {
      const filo = box(0.28, 0.016, 0.035, nut);
      filo.position.set(-0.06 + i * 0.05, 0.21, -0.06 + i * 0.07);
      filo.rotation.y = 0.5 + i * 0.5;
      g.add(filo);
    }
    for (let i = 0; i < 4; i++) {
      const z = sph(0.014, M(0xffffff, { r: 1 }), 6);
      z.position.set(-0.12 + i * 0.09, 0.22, 0.05 - i * 0.05);
      g.add(z);
    }
    return g;
  }
  function pannacotta() {
    const g = new THREE.Group();
    g.add(piatto(0.4));
    const body = cyl(0.2, 0.26, 0.32, M(0xf6efdc, { r: 0.45, e: 0x554a30, ei: 0.15 }));
    body.position.y = 0.2;
    const top = sph(0.2, M(0xa01020, { r: 0.3, e: 0x400810, ei: 0.5 }));
    top.scale.set(1.05, 0.35, 1.05);
    top.position.y = 0.37;
    g.add(body, top);
    for (let i = 0; i < 2; i++) {
      const drip = cyl(0.03, 0.045, 0.14, M(0xa01020, { r: 0.3, e: 0x400810, ei: 0.5 }));
      const a = i * 2.4 + 0.5;
      drip.position.set(Math.cos(a) * 0.2, 0.3, Math.sin(a) * 0.2);
      g.add(drip);
    }
    const bacca = sph(0.045, M(0x6a1020, { r: 0.3, e: 0x300810, ei: 0.5 }));
    bacca.position.y = 0.43;
    g.add(bacca);
    return g;
  }
  function torta() {
    const g = new THREE.Group();
    g.add(piatto(0.42));
    const cioc = M(0x38200e, { r: 0.75 });
    const crema = M(0xf2e6cc, { r: 0.7 });
    [[cioc, 0.09], [crema, 0.055], [cioc, 0.09], [crema, 0.055], [cioc, 0.08]].reduce((y, [m, h]) => {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, h, 3), m);
      s.position.y = y + h / 2;
      g.add(s);
      return y + h;
    }, 0.045);
    const glassa = new THREE.Mesh(
      new THREE.CylinderGeometry(0.37, 0.365, 0.05, 3),
      new THREE.MeshPhysicalMaterial({ color: 0x2a1206, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.2 })
    );
    glassa.position.y = 0.44;
    const cil = sph(0.06, M(0xa01020, { r: 0.3, e: 0x500810, ei: 0.5 }));
    cil.position.y = 0.52;
    g.add(glassa, cil);
    return g;
  }

  const BUILD = {
    pinta, bottiglia, tumbler, highball, goblet, coupe, flute, balloon, shot, vino,
    tazzina, mug, tisana, burger, bowl, salsiccia,
    friescup, stick, rings, nuggets, palline, tagliere,
    crepe, pannacotta, torta,
  };

  /* ---------- entries + loop ---------- */
  const entries = [];
  const byCanvas = new Map();
  canvases.forEach((c, i) => {
    let spec = {};
    try {
      spec = JSON.parse(c.dataset.icona || '{}');
    } catch {}
    const e = { c, ctx: c.getContext('2d'), spec, grp: null, vis: false, ph: (i % 12) * 0.55 };
    entries.push(e);
    byCanvas.set(c, e);
  });
  const io = new IntersectionObserver(
    (ents) => ents.forEach((en) => {
      const e = byCanvas.get(en.target);
      if (e) e.vis = en.isIntersecting;
    }),
    { rootMargin: '90px' }
  );
  entries.forEach((e) => io.observe(e.c));

  const BUDGET = matchMedia('(max-width: 820px)').matches ? 4 : 8;
  const clock = new THREE.Clock();
  let rr = 0;
  let running = true;
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    const vis = entries.filter((e) => e.vis);
    if (!vis.length) return;
    const n = Math.min(BUDGET, vis.length);
    for (let k = 0; k < n; k++) {
      const e = vis[(rr + k) % vis.length];
      if (!e.grp) {
        const b = BUILD[e.spec.t];
        if (!b) {
          e.vis = false;
          e.c.style.display = 'none';
          continue;
        }
        e.grp = b(e.spec);
      }
      e.grp.rotation.y = t * 0.5 + e.ph;
      scene.add(e.grp);
      renderer.render(scene, camera);
      scene.remove(e.grp);
      e.ctx.clearRect(0, 0, e.c.width, e.c.height);
      e.ctx.drawImage(renderer.domElement, 0, 0, e.c.width, e.c.height);
    }
    rr = (rr + n) % vis.length;
  }
  loop();

  return {
    dispose() {
      running = false;
      io.disconnect();
      renderer.dispose();
    },
  };
}
