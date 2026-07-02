/**
 * ============================================================================
 *  ARKADIA — SCENA 3D "DENTRO IL PUB"  (on-rails walkthrough)
 * ============================================================================
 *  Interno del pub procedurale (niente modelli scaricati): pavimento in legno,
 *  pareti, bancone con spine e calice, mensola bottiglie (instanced), lampade
 *  calde, insegna al neon, séparé in fondo, nebbia calda.
 *
 *  La camera parte fuori dalla porta, entra con una breve cinematica, poi lo
 *  scroll la fa percorrere un path fermandola alle "stazioni":
 *    0 soglia · 1 storia · 2 bancone(birre) · 3 tavolo(cibo) · 4 sala · 5 séparé
 *
 *  API: initPub(canvas, {quality}) -> { setProgress(t), setBurger(p), dispose, introRunning() }
 * ============================================================================
 */
import * as THREE from 'three';

export function initPub(canvas, { quality = 'high' } = {}) {
  const isHigh = quality === 'high';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: isHigh, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isHigh ? 2 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0a07);
  scene.fog = new THREE.FogExp2(0x0e0a07, 0.045);

  const env = makeEnv(renderer);
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);

  // ---- Palette ----
  const C = {
    legno: 0x3a2416, legnoTop: 0x5a3a20, muro: 0x1c1410, muroWarm: 0x2a1d12,
    ottone: 0xb98a3e, ambra: 0xc77b29, oro: 0xe8b04b, schiuma: 0xf4e9d0, rame: 0x7a2e1e,
  };
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: opts.r ?? 0.85, metalness: opts.m ?? 0, emissive: opts.e ?? 0x000000, emissiveIntensity: opts.ei ?? 1, ...opts });

  const root = new THREE.Group();
  scene.add(root);

  // ---- Pavimento ----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 40), mat(C.legno, { r: 0.6, m: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -8;
  root.add(floor);

  // ---- Soffitto ----
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 40), mat(C.muro, { r: 1 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, 4.2, -8);
  root.add(ceil);

  // ---- Pareti ----
  const wallMat = mat(C.muroWarm, { r: 1 });
  const wallL = new THREE.Mesh(new THREE.PlaneGeometry(40, 4.2), wallMat);
  wallL.rotation.y = Math.PI / 2;
  wallL.position.set(-5.2, 2.1, -8);
  root.add(wallL);
  const wallR = wallL.clone();
  wallR.rotation.y = -Math.PI / 2;
  wallR.position.x = 5.2;
  root.add(wallR);
  const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 4.2), wallMat);
  wallBack.position.set(0, 2.1, -16);
  root.add(wallBack);

  // ---- Portale d'ingresso (dietro la camera all'inizio) ----
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.4, 0.3), mat(0x120c08, { r: 0.9 }));
  doorFrame.position.set(0, 1.7, 9.4);
  root.add(doorFrame);
  const nightGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.9), new THREE.MeshBasicMaterial({ color: 0x24170c }));
  nightGlow.position.set(0, 1.7, 9.35);
  root.add(nightGlow);

  // ---- Bancone (a sinistra, lungo z) ----
  const bar = new THREE.Group();
  bar.position.set(-3.1, 0, -0.5);
  root.add(bar);
  const barFront = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 9), mat(C.legno, { r: 0.7 }));
  barFront.position.set(0, 0.55, 0);
  bar.add(barFront);
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 9.2), mat(C.legnoTop, { r: 0.4, m: 0.15 }));
  barTop.position.set(0, 1.16, 0);
  bar.add(barTop);

  // Spine (colonnina + 5 rubinetti con maniglie colorate)
  const taps = new THREE.Group();
  taps.position.set(-0.1, 1.22, 0.5);
  bar.add(taps);
  const tapBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 2.2), mat(C.ottone, { r: 0.25, m: 0.9 }));
  tapBase.position.y = 0.25;
  taps.add(tapBase);
  const handleCols = [C.oro, C.ambra, C.rame, 0x3b5e4a, C.schiuma];
  for (let i = 0; i < 5; i++) {
    const z = -0.85 + i * 0.42;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 10), mat(C.ottone, { r: 0.2, m: 0.95 }));
    neck.position.set(0.12, 0.34, z);
    taps.add(neck);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10), mat(C.ottone, { r: 0.2, m: 0.95 }));
    spout.position.set(0.18, 0.22, z);
    taps.add(spout);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mat(handleCols[i], { r: 0.4, e: handleCols[i], ei: 0.15 }));
    handle.position.set(0.12, 0.52, z);
    taps.add(handle);
  }

  // Calice pieno sul bancone
  const glass = makeGoblet();
  glass.position.set(-0.35, 1.22, -1.6);
  glass.scale.setScalar(0.9);
  bar.add(glass);

  // ---- Retro-bancone: mensola con bottiglie (instanced) ----
  const shelfX = -4.7;
  for (let s = 0; s < 3; s++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 8), mat(C.legnoTop, { r: 0.6 }));
    shelf.position.set(shelfX, 1.5 + s * 0.7, -0.5);
    root.add(shelf);
  }
  // retro illuminato
  const backLight = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.4), new THREE.MeshBasicMaterial({ color: 0x2a1a0c }));
  backLight.rotation.y = Math.PI / 2;
  backLight.position.set(-4.95, 2.2, -0.5);
  root.add(backLight);

  const bottleGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.34, 8);
  const bottleCols = [0x6a3d12, 0x2f4a2a, 0x7a2e1e, 0xc77b29, 0x1c2b3a, 0xe8b04b];
  const N = isHigh ? 54 : 30;
  const bottles = new THREE.InstancedMesh(bottleGeo, mat(0xffffff, { r: 0.35, m: 0.1 }), N);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  let bi = 0;
  for (let s = 0; s < 3 && bi < N; s++) {
    const perShelf = Math.ceil(N / 3);
    for (let k = 0; k < perShelf && bi < N; k++) {
      const z = -4 + (k / perShelf) * 7.5 + (pseudo(bi) - 0.5) * 0.1;
      dummy.position.set(shelfX + 0.02, 1.72 + s * 0.7, z);
      dummy.rotation.y = pseudo(bi * 3) * Math.PI;
      dummy.scale.setScalar(0.8 + pseudo(bi * 7) * 0.5);
      dummy.updateMatrix();
      bottles.setMatrixAt(bi, dummy.matrix);
      col.setHex(bottleCols[bi % bottleCols.length]);
      bottles.setColorAt(bi, col);
      bi++;
    }
  }
  bottles.instanceMatrix.needsUpdate = true;
  root.add(bottles);

  // ---- Tavolo (a destra) + séparé in fondo ----
  const table = new THREE.Group();
  table.position.set(2.6, 0, -3);
  root.add(table);
  const tTop = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 20), mat(C.legnoTop, { r: 0.45, m: 0.15 }));
  tTop.position.y = 1.02;
  table.add(tTop);
  const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1, 12), mat(0x201510, { r: 0.8 }));
  tLeg.position.y = 0.5;
  table.add(tLeg);
  // Piatto + burger a strati: si SCOMPONE a mezz'aria quando la sezione
  // "La Tavola" è al centro del viewport e si ricompone andando via.
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 22), mat(C.schiuma, { r: 0.6 }));
  plate.position.set(0, 1.09, 0);
  table.add(plate);

  const burger = new THREE.Group();
  burger.position.set(0, 1.11, 0);
  table.add(burger);
  // Intensità dell'esplosione del burger (0..1), pilotata da setBurger().
  let burgerAmt = 0;
  const seg = isHigh ? 20 : 12;
  // [geometria, colore, baseY, offsetEsploso]
  const burgerLayers = [
    { m: new THREE.Mesh(new THREE.SphereGeometry(0.17, seg, seg, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0x9a6a30, { r: 0.75 })), y: 0.045, off: 0 },   // pane sotto (mezza sfera capovolta)
    { m: new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.02, seg), mat(0x4a7a30, { r: 0.9 })), y: 0.062, off: 0.09 },   // insalata
    { m: new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, seg), mat(0x4a2a16, { r: 0.85 })), y: 0.1, off: 0.18 },      // hamburger 200gr
    { m: new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.014, 0.26), mat(0xe8a33c, { r: 0.5, e: 0x6a4310, ei: 0.25 })), y: 0.132, off: 0.27 }, // cheddar
    { m: new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.024, seg), mat(0xa03020, { r: 0.7 })), y: 0.152, off: 0.36 },  // pomodoro
    { m: new THREE.Mesh(new THREE.SphereGeometry(0.175, seg, seg, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xa57136, { r: 0.7 })), y: 0.165, off: 0.48 }, // pane sopra
  ];
  burgerLayers[3].m.rotation.y = Math.PI / 5; // cheddar leggermente ruotato
  burgerLayers.forEach((L) => {
    L.m.position.y = L.y;
    burger.add(L.m);
  });

  // Bersaglio freccette sulla parete destra (la Sala Giochi esiste anche in 3D)
  const dart = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 28),
    new THREE.MeshBasicMaterial({ map: makeDartboard() })
  );
  dart.rotation.y = -Math.PI / 2;
  dart.position.set(5.14, 2.1, -6.5);
  root.add(dart);

  // Séparé in fondo (booth)
  const booth = new THREE.Mesh(new THREE.BoxGeometry(3, 1.3, 0.5), mat(C.rame, { r: 0.85 }));
  booth.position.set(0, 0.65, -13.5);
  root.add(booth);

  // ---- Luci ----
  scene.add(new THREE.AmbientLight(0x3a2a18, 1.2));
  const lampPositions = [
    [-3, 3.2, 1.5], [-3, 3.2, -3], [1.5, 3.2, -3], [0, 3.2, -8], [0, 3.0, -13],
  ];
  const lamps = [];
  lampPositions.forEach((p, i) => {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), new THREE.MeshBasicMaterial({ color: 0xffd68a }));
    bulb.position.set(p[0], p[1], p[2]);
    root.add(bulb);
    // cavo
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 4.2 - p[1], 6), mat(0x100b07));
    wire.position.set(p[0], (4.2 + p[1]) / 2, p[2]);
    root.add(wire);
    const pl = new THREE.PointLight(0xffb851, isHigh ? 14 : 9, 9, 2);
    pl.position.set(p[0], p[1], p[2]);
    scene.add(pl);
    lamps.push({ bulb, pl, seed: pseudo(i * 9) });
  });

  // Insegna al neon "ARKADIA" dietro il bancone
  const neon = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.9),
    new THREE.MeshBasicMaterial({ map: makeNeon(), transparent: true })
  );
  neon.rotation.y = Math.PI / 2;
  neon.position.set(-4.9, 3.1, -0.5);
  root.add(neon);
  const neonLight = new THREE.PointLight(0xe8b04b, 6, 6, 2);
  neonLight.position.set(-4.2, 3.1, -0.5);
  scene.add(neonLight);

  // luce dalla porta (notte fuori) alle spalle
  const doorLight = new THREE.PointLight(0x6a4a2a, 5, 10, 2);
  doorLight.position.set(0, 2, 8);
  scene.add(doorLight);

  // ---- Percorso camera (stazioni) ----
  // Ogni waypoint: posizione camera + punto guardato.
  const stations = [
    { p: [0.0, 1.7, 11.0], l: [0, 1.7, 2] },      // 0 soglia (fuori dalla porta)
    { p: [0.6, 1.65, 5.5], l: [-1.5, 1.6, 1] },   // 1 storia (entrando, verso sinistra)
    { p: [-1.4, 1.55, 1.2], l: [-3.2, 1.3, -0.4] }, // 2 bancone / birre
    { p: [1.55, 1.45, -1.85], l: [2.6, 1.18, -3] }, // 3 tavolo / cibo (vicino: burger protagonista)
    { p: [0.4, 1.9, -5.5], l: [-2, 1.4, -6] },    // 4 sala (wide)
    { p: [0.0, 1.5, -10.5], l: [0, 1.0, -13.5] }, // 5 séparé / brindisi
  ];
  const posCurve = new THREE.CatmullRomCurve3(stations.map((s) => new THREE.Vector3(...s.p)), false, 'catmullrom', 0.4);
  const lookCurve = new THREE.CatmullRomCurve3(stations.map((s) => new THREE.Vector3(...s.l)), false, 'catmullrom', 0.4);

  // ---- Stato & loop ----
  let targetT = 0;     // dallo scroll (0..1)
  let renderT = 0;     // eased
  let running = true;
  let raf = 0;
  const clock = new THREE.Clock();
  const INTRO_DUR = 2.6;
  let introElapsed = 0;
  let introActive = true;

  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  function applyCamera(t) {
    const tc = Math.max(0, Math.min(1, t));
    posCurve.getPoint(tc, camPos);
    lookCurve.getPoint(tc, camLook);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  }
  applyCamera(0);

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    if (introActive) {
      introElapsed += dt;
      const k = Math.min(1, introElapsed / INTRO_DUR);
      const eased = 1 - Math.pow(1 - k, 3); // easeOutCubic
      // l'intro percorre la prima porzione del path (fuori → dentro, prime 2 stazioni)
      renderT = eased * (1 / (stations.length - 1)) * 1.15;
      if (k >= 1) introActive = false;
    } else {
      renderT += (targetT - renderT) * 0.06;
    }
    applyCamera(renderT);

    // micro-vita: bagliore lampade + leggerissimo bob
    lamps.forEach((L) => {
      const f = 0.9 + Math.sin(time * 2 + L.seed * 6) * 0.08;
      L.pl.intensity = (isHigh ? 14 : 9) * f;
    });
    camera.position.y += Math.sin(time * 0.8) * 0.01;

    // Burger esploso: pilotato dalla pagina (setBurger) quando la sezione
    // "La Tavola" è al centro del viewport. Gli strati si separano e il
    // panino LEVITA sopra il tavolo, così lo stacco si legge anche da lontano.
    const explode = burgerAmt * burgerAmt; // ease-in per uno stacco netto
    burgerLayers.forEach((L, i) => {
      L.m.position.y += (L.y + L.off * explode - L.m.position.y) * 0.12;
      L.m.rotation.y += 0.002 + i * 0.002 * explode;
    });
    burger.position.y += (1.11 + explode * 0.34 - burger.position.y) * 0.1;
    burger.rotation.y += 0.003 + explode * 0.02;

    renderer.render(scene, camera);
  }
  frame();

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  return {
    setProgress: (t) => { targetT = Math.max(0, Math.min(1, t)); },
    setBurger: (p) => { burgerAmt = Math.max(0, Math.min(1, p)); },
    introRunning: () => introActive,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      env.dispose();
    },
  };
}

/* ---------- helper ---------- */
function pseudo(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function makeGoblet() {
  const profile = [
    [0, -0.6], [0.22, -0.6], [0.2, -0.55], [0.04, -0.5], [0.04, -0.2],
    [0.06, -0.12], [0.13, 0.0], [0.24, 0.16], [0.26, 0.28], [0.22, 0.42], [0.23, 0.46],
  ].map((p) => new THREE.Vector2(p[0], p[1]));
  const g = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 40),
    new THREE.MeshPhysicalMaterial({ color: 0xf3ead6, roughness: 0.1, transparent: true, opacity: 0.28, clearcoat: 0.5, side: THREE.DoubleSide, depthWrite: false })
  );
  g.add(glass);
  const liquid = new THREE.Mesh(
    new THREE.LatheGeometry([[0, -0.5], [0.04, -0.5], [0.06, -0.12], [0.13, 0], [0.24, 0.16], [0.25, 0.28]].map((p) => new THREE.Vector2(p[0], p[1])), 32),
    new THREE.MeshStandardMaterial({ color: 0xc77b29, emissive: 0x5a2e0e, emissiveIntensity: 0.4, roughness: 0.4, side: THREE.DoubleSide })
  );
  g.add(liquid);
  const foam = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), new THREE.MeshStandardMaterial({ color: 0xf4e9d0, roughness: 0.95 }));
  foam.scale.set(1, 0.35, 1);
  foam.position.y = 0.29;
  g.add(foam);
  return g;
}

function makeEnv(renderer) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, '#2a1d10'); grad.addColorStop(0.5, '#5a3d1e'); grad.addColorStop(1, '#0e0a07');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 16, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose(); pmrem.dispose();
  return rt.texture;
}

function makeDartboard() {
  // Bersaglio stilizzato in palette: anelli concentrici + spicchi alternati.
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const cx = 64, cy = 64;
  ctx.fillStyle = '#17100b';
  ctx.fillRect(0, 0, 128, 128);
  // spicchi alternati
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 58, (i / 20) * Math.PI * 2, ((i + 1) / 20) * Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#2a1d12' : '#f4e9d0';
    ctx.fill();
  }
  // anelli
  const rings = [
    [58, '#7a2e1e', 3], [44, '#e8b04b', 3], [30, '#7a2e1e', 3], [16, '#e8b04b', 3],
  ];
  rings.forEach(([r, col, w]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.stroke();
  });
  // centro
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#7a2e1e';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = '#e8b04b';
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function makeNeon() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = 'italic 700 76px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#e8b04b';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#ffe6b0';
  ctx.fillText('Arkadia', 256, 64);
  ctx.shadowBlur = 10;
  ctx.fillText('Arkadia', 256, 64);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}
