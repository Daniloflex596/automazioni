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
 *  API: initPub(canvas, {quality}) -> { setProgress(t), dispose, introRunning() }
 * ============================================================================
 */
import * as THREE from 'three';

export function initPub(canvas, { quality = 'high' } = {}) {
  const isHigh = quality === 'high';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: isHigh, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isHigh ? 2 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0a07);
  scene.fog = new THREE.FogExp2(0x0e0a07, 0.024);

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

  // ---- Pavimento: legno a doghe (texture procedurale) ----
  const woodTex = makeWood();
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.repeat.set(4, 12);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 46),
    new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55, metalness: 0.08 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -11;
  root.add(floor);

  // ---- Soffitto ----
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 46), mat(C.muro, { r: 1 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, 4.2, -11);
  root.add(ceil);

  // ---- Pareti ----
  const wallMat = mat(C.muroWarm, { r: 1 });
  const wallL = new THREE.Mesh(new THREE.PlaneGeometry(46, 4.2), wallMat);
  wallL.rotation.y = Math.PI / 2;
  wallL.position.set(-5.2, 2.1, -11);
  root.add(wallL);
  const wallR = wallL.clone();
  wallR.rotation.y = -Math.PI / 2;
  wallR.position.x = 5.2;
  root.add(wallR);
  const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 4.2), wallMat);
  wallBack.position.set(0, 2.1, -33.5);
  root.add(wallBack);

  // ---- Portale d'ingresso (dietro la camera all'inizio) ----
  // Portale APERTO: due stipiti + architrave, il varco è libero (la camera
  // ci passa dentro senza mai andare a nero) e una luce calda sulla soglia.
  const jambMat = mat(0x1a110a, { r: 0.85 });
  const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 0.3), jambMat);
  jambL.position.set(-1.5, 1.7, 9.4);
  root.add(jambL);
  const jambR = jambL.clone();
  jambR.position.x = 1.5;
  root.add(jambR);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.4, 0.3), jambMat);
  lintel.position.set(0, 3.2, 9.4);
  root.add(lintel);
  const nightGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.4), new THREE.MeshBasicMaterial({ color: 0x3a2413 }));
  nightGlow.position.set(0, 1.7, 9.62);
  root.add(nightGlow);
  const soglia = new THREE.PointLight(0xffc06a, 9, 7, 2);
  soglia.position.set(0, 2.9, 8.6);
  scene.add(soglia);

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

  // LE TRE DEL MOMENTO sul bancone: pinta del mese, calice di rossa,
  // bottiglia Chouffe Red. Il POV le raggiunge una a una (setBirraFocus).
  function birraMomento(z, build) {
    const g = new THREE.Group();
    g.position.set(-0.3, 1.22, z);
    build(g);
    bar.add(g);
    return g;
  }
  // 0 · Birra del Mese: pinta dorata con schiuma
  birraMomento(-2.6, (g) => {
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.3, 16, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0xf3ead6, roughness: 0.08, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    gl.position.y = 0.15;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.068, 0.24, 14), mat(0xe8b04b, { r: 0.3, e: 0x6a4a10, ei: 0.5 }));
    liq.position.y = 0.13;
    const fo = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.03, 14), mat(0xf4e9d0, { r: 0.95 }));
    fo.position.y = 0.27;
    g.add(gl, liq, fo);
  });
  // 1 · La Rossa: calice a stelo con liquido rosso-ambrato
  birraMomento(-3.4, (g) => {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8), mat(0xd9cdb4, { r: 0.2 }));
    st.position.y = 0.07;
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8),
      new THREE.MeshPhysicalMaterial({ color: 0xf3ead6, roughness: 0.08, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false }));
    cup.position.y = 0.2;
    const liq = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), mat(0x8a2a12, { r: 0.3, e: 0x4a1006, ei: 0.55 }));
    liq.position.y = 0.19;
    const fo = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.026, 14), mat(0xf4e9d0, { r: 0.95 }));
    fo.position.y = 0.3;
    g.add(st, cup, liq, fo);
  });
  // 2 · Chouffe Red: bottiglia rossa alla ciliegia + ciliegina
  birraMomento(-4.2, (g) => {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.3, 14), mat(0x6a1015, { r: 0.25, e: 0x300508, ei: 0.5 }));
    body.position.y = 0.15;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.05, 0.16, 10), mat(0x6a1015, { r: 0.25, e: 0x300508, ei: 0.5 }));
    neck.position.y = 0.38;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 10), mat(0xb02030, { r: 0.4, e: 0x500810, ei: 0.4 }));
    cap.position.y = 0.47;
    const cher = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), mat(0xc01828, { r: 0.3, e: 0x600810, ei: 0.6 }));
    cher.position.set(0.12, 0.035, 0.05);
    g.add(body, neck, cap, cher);
  });

  // POV birre: posizioni camera ravvicinate davanti a ciascun oggetto (mondo).
  const BIRRA_POV = [
    { p: [-2.0, 1.62, -3.1], l: [-3.4, 1.45, -3.1] },
    { p: [-2.0, 1.62, -3.9], l: [-3.4, 1.45, -3.9] },
    { p: [-2.0, 1.66, -4.7], l: [-3.4, 1.5, -4.7] },
  ];
  let birraFocus = -1;
  let focusAmt = 0;
  const focusP = new THREE.Vector3();
  const focusL = new THREE.Vector3();

  // ---- LA MESCITA: pinta sotto la spina centrale che si riempie (setSpina) ----
  // Il momento-firma della sezione Birre: getto ambrato + livello che sale + schiuma.
  const pinta = new THREE.Group();
  pinta.position.set(0.08, 1.22, 0.49); // sotto lo spout del rubinetto centrale
  bar.add(pinta);
  const pintaGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.075, 0.26, 18, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xf3ead6, roughness: 0.08, transparent: true, opacity: 0.22,
      clearcoat: 0.4, side: THREE.DoubleSide, depthWrite: false,
    })
  );
  pintaGlass.position.y = 0.13;
  pinta.add(pintaGlass);
  const pintaLiquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.066, 1, 16),
    new THREE.MeshStandardMaterial({ color: 0xc77b29, emissive: 0x5a2e0e, emissiveIntensity: 0.5, roughness: 0.35 })
  );
  pintaLiquid.scale.y = 0.001;
  pinta.add(pintaLiquid);
  const pintaFoam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.078, 0.078, 0.024, 16),
    new THREE.MeshStandardMaterial({ color: 0xf4e9d0, roughness: 0.95 })
  );
  pintaFoam.visible = false;
  pinta.add(pintaFoam);
  // getto dal rubinetto centrale (spout a y≈0.22+0.5-1.22-... calcolato in locale pinta)
  const pour = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.016, 1, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xe8b04b, transparent: true, opacity: 0 })
  );
  pinta.add(pour);
  let spinaAmt = 0; // 0..1 dal DOM (sezione Birre centrata)

  // ---- IL BRINDISI: due boccali al séparé che si toccano (setBrindisi) ----
  const brindisi = new THREE.Group();
  brindisi.position.set(0, 1.42, -27.35);
  root.add(brindisi);
  function makeMug(side) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.11, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0xc77b29, emissive: 0x6a3a12, emissiveIntensity: 0.45, roughness: 0.3 })
    );
    g.add(body);
    const foamTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.125, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0xf4e9d0, roughness: 0.95 })
    );
    foamTop.position.y = 0.17;
    g.add(foamTop);
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.017, 8, 14, Math.PI * 1.3),
      new THREE.MeshStandardMaterial({ color: 0xd9cdb4, roughness: 0.4 })
    );
    handle.position.x = side * 0.12;
    handle.rotation.z = side > 0 ? -Math.PI / 2.6 : Math.PI - Math.PI / 2.6;
    g.add(handle);
    return g;
  }
  const mugL = makeMug(-1);
  mugL.position.set(-0.38, 0, 0);
  brindisi.add(mugL);
  const mugR = makeMug(1);
  mugR.position.set(0.38, 0, 0);
  brindisi.add(mugR);
  let brindisiAmt = 0; // 0..1 dal DOM (sezione Prenotazione centrata)

  // ---- Polvere dorata nell'aria (solo tier high): atmosfera da luce di lampada ----
  let dust = null;
  if (isHigh) {
    const DN = 130;
    const dpos = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = (pseudo(i * 3) - 0.5) * 9;
      dpos[i * 3 + 1] = 0.6 + pseudo(i * 5) * 3.2;
      dpos[i * 3 + 2] = -30 + pseudo(i * 7) * 40;
    }
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    dust = new THREE.Points(
      dgeo,
      new THREE.PointsMaterial({
        map: makeSoftDot(), color: 0xe8b04b, size: 0.045, transparent: true,
        opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
      })
    );
    root.add(dust);
  }

  // ---- Retro-bancone: mensola con bottiglie (instanced) ----
  const shelfX = -4.7;
  for (let s = 0; s < 3; s++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 8), mat(C.legnoTop, { r: 0.6 }));
    shelf.position.set(shelfX, 1.5 + s * 0.7, -0.5);
    root.add(shelf);
  }
  // retro-bancone in mattoni a vista, scaldato dal neon
  const brickTex = makeBrick();
  brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping;
  brickTex.repeat.set(4, 1.6);
  const backLight = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 2.4),
    new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.95, emissive: 0x33200e, emissiveIntensity: 0.4 })
  );
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
  // Piatto + burger a strati: si SCOMPONE a mezz'aria quando la camera
  // arriva al tavolo (la stazione "La Tavola") e si ricompone andando via.
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
  dart.position.set(5.14, 2.1, -20.5);
  root.add(dart);

  // ---- SET-PIECE SALA GIOCHI: freccetta che vola nel bersaglio + dadi ----
  // La freccetta parte a mezz'aria e si conficca nel centro quando la sezione
  // Giochi è al centro dello schermo (setGiochi 0→1). I dadi rotolano su un
  // barile accanto e si fermano.
  const dartArrow = new THREE.Group();
  const dartShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8),
    mat(0xd9cdb4, { r: 0.4 })
  );
  dartShaft.rotation.z = Math.PI / 2;
  dartArrow.add(dartShaft);
  const dartTip = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.06, 8), mat(C.ottone, { r: 0.2, m: 0.9 }));
  dartTip.rotation.z = -Math.PI / 2;
  dartTip.position.x = 0.13;
  dartArrow.add(dartTip);
  const dartFl = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 4), mat(C.rame, { r: 0.6, e: C.rame, ei: 0.25 }));
  dartFl.rotation.z = Math.PI / 2;
  dartFl.position.x = -0.13;
  dartArrow.add(dartFl);
  const dartFrom = new THREE.Vector3(3.4, 1.75, -19.6);
  const dartTo = new THREE.Vector3(4.9, 2.1, -20.5);
  dartArrow.position.copy(dartFrom);
  root.add(dartArrow);

  // Lampada da pub sopra il bersaglio: la Sala Giochi ha la sua luce di scena.
  const dartBulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffd68a }));
  dartBulb.position.set(4.55, 3.0, -20.5);
  root.add(dartBulb);
  const dartWire = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 1.2, 6), mat(0x100b07));
  dartWire.position.set(4.55, 3.6, -20.5);
  root.add(dartWire);
  const dartLight = new THREE.PointLight(0xffb851, isHigh ? 10 : 7, 6, 2);
  dartLight.position.set(4.5, 2.9, -20.6);
  scene.add(dartLight);

  // ======================================================================
  //  LE ZONE DEL MENU — ogni categoria ha il suo fondale di animazioni
  // ======================================================================
  const zoneAmt = { fritti: 0, dessert: 0, bar: 0, cucina: 0 };

  // ---- ANGOLO FRITTI (sinistra, z -8.7): patatine impazzite ----
  // Si dilatano, si spezzano in due e si riuniscono, mentre gli onion ring
  // girano su se stessi. Un bancone-friggitoria le ancora al mondo.
  const fritGrp = new THREE.Group();
  fritGrp.position.set(-4.25, 1.85, -8.7);
  root.add(fritGrp);
  const fritBase = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.1), mat(C.legnoTop, { r: 0.5 }));
  fritBase.position.y = -0.95;
  fritGrp.add(fritBase);
  const FRY_N = isHigh ? 22 : 12;
  const fries3 = [];
  const fryMat3 = mat(0xe8b04b, { r: 0.5, e: 0x7a4a10, ei: 0.35 });
  for (let i = 0; i < FRY_N; i++) {
    // ogni "patatina" è una coppia di metà: si separano (si spezzano) e si riuniscono
    const pair = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.17, 0.055), fryMat3);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.17, 0.055), fryMat3);
    a.position.y = 0.09;
    b.position.y = -0.09;
    pair.add(a, b);
    pair.position.set((pseudo(i * 3) - 0.5) * 1.7, (pseudo(i * 5) - 0.5) * 1.5, (pseudo(i * 7) - 0.5) * 0.8);
    pair.userData = { ph: pseudo(i * 11) * Math.PI * 2, a, b, baseY: pair.position.y };
    fritGrp.add(pair);
    fries3.push(pair);
  }
  const rings3 = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.045, 8, 18),
      mat(0xd8912f, { r: 0.55, e: 0x6a3a10, ei: 0.3 })
    );
    ring.position.set(-0.7 + i * 0.7, 0.75 - i * 0.18, 0.25);
    ring.userData.ph = pseudo(i * 13) * 6;
    fritGrp.add(ring);
    rings3.push(ring);
  }

  // ---- ANGOLO DOLCI (destra, z -12.7): torte orbitanti + cacao che cade ----
  const dolceGrp = new THREE.Group();
  dolceGrp.position.set(4.25, 1.7, -12.7);
  root.add(dolceGrp);
  const alzata = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.1, 0.5, 14), mat(C.schiuma, { r: 0.4 }));
  alzata.position.y = -0.85;
  dolceGrp.add(alzata);
  const fette = [];
  for (let i = 0; i < 3; i++) {
    const fetta = new THREE.Group();
    // fetta = prisma triangolare (cilindro a 3 segmenti) + glassa
    const base3 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.13, 3), mat(0xf0e0c0, { r: 0.7 }));
    const glassa = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.265, 0.045, 3), mat(C.rame, { r: 0.45, e: 0x4a1a10, ei: 0.3 }));
    glassa.position.y = 0.085;
    const ciliegia = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), mat(0xa01020, { r: 0.3, e: 0x500810, ei: 0.5 }));
    ciliegia.position.y = 0.16;
    fetta.add(base3, glassa, ciliegia);
    fetta.userData.ph = (i / 3) * Math.PI * 2;
    dolceGrp.add(fetta);
    fette.push(fetta);
  }
  // cacao in caduta (points in loop)
  const CAC_N = isHigh ? 36 : 18;
  const cacPos = new Float32Array(CAC_N * 3);
  for (let i = 0; i < CAC_N; i++) {
    cacPos[i * 3] = (pseudo(i * 3) - 0.5) * 1.4;
    cacPos[i * 3 + 1] = pseudo(i * 5) * 1.6;
    cacPos[i * 3 + 2] = (pseudo(i * 7) - 0.5) * 0.8;
  }
  const cacGeo = new THREE.BufferGeometry();
  cacGeo.setAttribute('position', new THREE.BufferAttribute(cacPos, 3));
  const cacao = new THREE.Points(cacGeo, new THREE.PointsMaterial({
    map: makeSoftDot(), color: 0x8a5a30, size: 0.035, transparent: true,
    opacity: 0.8, depthWrite: false,
  }));
  dolceGrp.add(cacao);

  // ---- IL BAR (sinistra, z -16.7): shaker che shakera + Martini + tazzina ----
  const barGrp = new THREE.Group();
  barGrp.position.set(-4.25, 1.6, -16.7);
  root.add(barGrp);
  const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.0), mat(C.legnoTop, { r: 0.5 }));
  barBase.position.y = -0.8;
  barGrp.add(barBase);
  // shaker (corpo + coperchio)
  const shaker = new THREE.Group();
  const shBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.34, 14), mat(C.ottone, { r: 0.18, m: 0.95 }));
  const shTop = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 0.14, 14), mat(C.ottone, { r: 0.18, m: 0.95 }));
  shTop.position.y = 0.24;
  shaker.add(shBody, shTop);
  shaker.position.set(-0.45, -0.5, 0.1);
  barGrp.add(shaker);
  // Martini con liquido ambrato
  const martini = new THREE.Group();
  const mCono = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.15, 16, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xf3ead6, roughness: 0.08, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })
  );
  mCono.rotation.x = Math.PI;
  mCono.position.y = -0.28;
  const mLiq = new THREE.Mesh(new THREE.ConeGeometry(0.135, 0.11, 16), mat(C.oro, { r: 0.3, e: 0x6a4a10, ei: 0.5 }));
  mLiq.rotation.x = Math.PI;
  mLiq.position.y = -0.3;
  const mStelo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), mat(0xd9cdb4, { r: 0.2 }));
  mStelo.position.y = -0.48;
  martini.add(mCono, mLiq, mStelo);
  martini.position.set(0.1, 0, 0.15);
  barGrp.add(martini);
  // tazzina di caffè con vapore
  const tazzina = new THREE.Group();
  const tzCorpo = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.09, 12), mat(C.schiuma, { r: 0.4 }));
  const tzManico = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.011, 6, 10, Math.PI * 1.4), mat(C.schiuma, { r: 0.4 }));
  tzManico.position.x = 0.085;
  tazzina.add(tzCorpo, tzManico);
  tazzina.position.set(0.62, -0.68, 0.05);
  barGrp.add(tazzina);
  const steamBar = [];
  for (let i = 0; i < 2; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeSoftDot(), color: 0xf4e9d0, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    sp.scale.setScalar(0.1);
    sp.position.copy(tazzina.position);
    sp.userData.seed = pseudo(i * 31);
    barGrp.add(sp);
    steamBar.push(sp);
  }

  // ---- CUCINA (attorno al tavolo): due burger fluttuanti che si smontano
  //      e rimontano in loop, satelliti del burger principale ----
  const flyBurgers = [];
  function makeFlyBurger(px, py, pz, scale) {
    const g = new THREE.Group();
    const seg2 = isHigh ? 14 : 10;
    const layers = [
      { m: new THREE.Mesh(new THREE.SphereGeometry(0.17, seg2, seg2, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0x9a6a30, { r: 0.75 })), off: 0 },
      { m: new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, seg2), mat(0x4a2a16, { r: 0.85 })), off: 0.09 },
      { m: new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.014, 0.25), mat(0xe8a33c, { r: 0.5, e: 0x6a4310, ei: 0.25 })), off: 0.16 },
      { m: new THREE.Mesh(new THREE.SphereGeometry(0.17, seg2, seg2, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xa57136, { r: 0.7 })), off: 0.24 },
    ];
    layers.forEach((L) => g.add(L.m));
    g.position.set(px, py, pz);
    g.scale.setScalar(scale);
    g.userData = { layers, ph: pseudo(px * 7 + pz) * Math.PI * 2 };
    root.add(g);
    flyBurgers.push(g);
    return g;
  }
  makeFlyBurger(1.7, 2.1, -3.9, 0.85);
  makeFlyBurger(3.4, 2.35, -2.4, 0.7);

  // Luci di zona: ogni angolo del menu ha la sua lampada calda.
  [[-4.0, 2.9, -8.7], [4.0, 2.9, -12.7], [-4.0, 2.9, -16.7]].forEach((pos) => {
    const zl = new THREE.PointLight(0xffb851, isHigh ? 9 : 6, 5.5, 2);
    zl.position.set(pos[0], pos[1], pos[2]);
    scene.add(zl);
    const zb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffd68a }));
    zb.position.set(pos[0], pos[1] + 0.1, pos[2]);
    root.add(zb);
    const zw = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.1, 6), mat(0x100b07));
    zw.position.set(pos[0], 3.6, pos[2]);
    root.add(zw);
  });

  // Barile con due dadi
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.85, 14), mat(C.legno, { r: 0.75 }));
  barrel.position.set(4.4, 0.42, -21.6);
  root.add(barrel);
  const diceMat = mat(C.schiuma, { r: 0.5 });
  const die1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), diceMat);
  die1.position.set(4.34, 0.9, -21.55);
  root.add(die1);
  const die2 = die1.clone();
  die2.position.set(4.48, 0.9, -21.68);
  root.add(die2);
  let giochiAmt = 0;

  // ---- SET-PIECE TAVOLA: patatine + vapore sopra il burger ----
  const friesCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.055, 0.12, 12, 1, true),
    mat(C.rame, { r: 0.7, side: THREE.DoubleSide })
  );
  friesCup.position.set(0.34, 1.17, -0.22);
  table.add(friesCup);
  for (let i = 0; i < 7; i++) {
    const fry = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.16, 0.016), mat(0xe8b04b, { r: 0.6, e: 0x6a4310, ei: 0.15 }));
    const a = pseudo(i * 11) * Math.PI * 2;
    fry.position.set(0.34 + Math.cos(a) * 0.035, 1.26, -0.22 + Math.sin(a) * 0.035);
    fry.rotation.z = (pseudo(i * 5) - 0.5) * 0.5;
    fry.rotation.x = (pseudo(i * 3) - 0.5) * 0.3;
    table.add(fry);
  }
  // Vapore: 3 sprite morbidi che salgono sopra il burger
  const steamMat = new THREE.SpriteMaterial({
    map: makeSoftDot(), color: 0xf4e9d0, transparent: true, opacity: 0.0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const steam = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(steamMat.clone());
    s.scale.setScalar(0.14);
    s.position.set(0, 1.4, 0);
    s.userData.seed = pseudo(i * 17);
    table.add(s);
    steam.push(s);
  }

  // ---- SET-PIECE BRINDISI: esplosione di schiuma al tocco dei boccali ----
  const BURST_N = 26;
  const burstPos = new Float32Array(BURST_N * 3);
  const burstDir = [];
  for (let i = 0; i < BURST_N; i++) {
    const a = pseudo(i * 3) * Math.PI * 2;
    const e = pseudo(i * 7) * Math.PI * 0.6;
    burstDir.push(new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e) + 0.4, Math.sin(a) * Math.cos(e) * 0.4));
  }
  const burstGeo = new THREE.BufferGeometry();
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
  const burst = new THREE.Points(
    burstGeo,
    new THREE.PointsMaterial({
      map: makeSoftDot(), color: 0xf4e9d0, size: 0.06, transparent: true,
      opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  burst.position.set(0, 1.62, -27.35);
  root.add(burst);
  let burstT = -1; // -1 = inattivo; 0..1 = animazione in corso
  let burstArmed = true;

  // ---- SET-PIECE STORIA: insegne d'epoca appese sopra il bancone ----
  // (aderenti alla parete sinistra: la stazione "storia" le inquadra entrando)
  const anniPanels = [];
  [['2018', 3.4], ['LA RADICE', 2.2], ['OGGI', 1.0]].forEach(([txt, z], i) => {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 0.36),
      new THREE.MeshBasicMaterial({ map: makeYearCard(txt), transparent: true, opacity: 0.95 })
    );
    p.position.set(-5.05, 3.05, z);
    p.rotation.y = Math.PI / 2;
    p.userData.seed = pseudo(i * 23);
    root.add(p);
    anniPanels.push(p);
  });

  // Séparé in fondo (booth)
  const booth = new THREE.Mesh(new THREE.BoxGeometry(3, 1.3, 0.5), mat(C.rame, { r: 0.85 }));
  booth.position.set(0, 0.65, -27.5);
  root.add(booth);

  // ---- Luci ----
  scene.add(new THREE.AmbientLight(0x5a4228, 2.0));
  scene.add(new THREE.HemisphereLight(0x6a4e2e, 0x241608, 1.1));
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
    { p: [0.0, 1.7, 11.0], l: [0, 1.7, 2] },        // 0 soglia (fuori dalla porta)
    { p: [0.6, 1.65, 5.5], l: [-1.5, 1.6, 1] },     // 1 storia (entrando, verso sinistra)
    { p: [-1.4, 1.55, 1.2], l: [-3.2, 1.3, -0.4] }, // 2 bancone / birre
    { p: [1.55, 1.45, -1.85], l: [2.6, 1.18, -3] }, // 3 cucina (tavolo: burger protagonista)
    { p: [-1.2, 1.7, -6.4], l: [-4.3, 1.85, -8.7] }, // 4 angolo fritti (sinistra)
    { p: [1.3, 1.65, -10.5], l: [4.4, 1.75, -12.7] }, // 5 angolo dolci (destra)
    { p: [-1.3, 1.7, -14.4], l: [-4.4, 1.65, -16.7] }, // 6 il bar / cocktail (sinistra)
    { p: [2.0, 1.75, -18.6], l: [5.2, 2.0, -20.9] }, // 7 sala giochi (bersaglio + barile)
    { p: [0.0, 2.1, -23.0], l: [0, 1.5, -3.0] },    // 8 il luogo: sguardo all'indietro su tutto il pub
    { p: [0.0, 1.5, -24.3], l: [0, 1.05, -27.4] },  // 9 séparé / brindisi
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

  const lastLook = new THREE.Vector3();
  function applyCamera(t) {
    const tc = Math.max(0, Math.min(1, t));
    posCurve.getPoint(tc, camPos);
    lookCurve.getPoint(tc, camLook);
    camera.position.copy(camPos);
    lastLook.copy(camLook); camera.lookAt(lastLook);
  }
  applyCamera(0);

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dtRaw = clock.getDelta();
    const dt = Math.min(dtRaw, 0.05); // cap per le animazioni fisiche
    const time = clock.elapsedTime;

    if (introActive) {
      // Timeline su TEMPO REALE (non su dt cappato): a bassi framerate
      // l'intro deve comunque durare INTRO_DUR secondi, non dilatarsi.
      const k = Math.min(1, time / INTRO_DUR);
      const eased = 1 - Math.pow(1 - k, 3); // easeOutCubic
      // l'intro percorre la prima porzione del path (fuori → dentro, prime 2 stazioni)
      renderT = eased * (1 / (stations.length - 1)) * 1.15;
      if (k >= 1) introActive = false;
    } else {
      // Smoothing indipendente dal framerate: stessa "morbidezza" a 20 o 120fps.
      const s = 1 - Math.pow(0.94, Math.min(dtRaw, 0.25) * 60);
      renderT += (targetT - renderT) * s;
    }
    applyCamera(renderT);
    // POV birra: la camera plana sull'oggetto della birra scelta (hover/click/scroll).
    const wantFocus = birraFocus >= 0 ? 1 : 0;
    focusAmt += (wantFocus - focusAmt) * (1 - Math.pow(0.9, Math.min(dtRaw, 0.25) * 60));
    if (focusAmt > 0.002 && birraFocus >= 0) {
      const F = BIRRA_POV[birraFocus];
      focusP.set(F.p[0], F.p[1], F.p[2]);
      focusL.set(F.l[0], F.l[1], F.l[2]);
      camera.position.lerp(focusP, focusAmt);
      lastLook.lerp(focusL, focusAmt);
      camera.lookAt(lastLook);
    }

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

    // La mescita: livello della pinta = spinaAmt; getto visibile mentre versa.
    const level = 0.02 + spinaAmt * 0.2;
    pintaLiquid.scale.y += (Math.max(0.001, level) - pintaLiquid.scale.y) * 0.1;
    pintaLiquid.position.y = pintaLiquid.scale.y / 2 + 0.01;
    const liqTop = pintaLiquid.scale.y + 0.01;
    pintaFoam.visible = spinaAmt > 0.12;
    pintaFoam.position.y = liqTop + 0.012;
    const pouring = spinaAmt > 0.06 && spinaAmt < 0.985;
    pour.material.opacity += ((pouring ? 0.85 : 0) - pour.material.opacity) * 0.12;
    pour.visible = pour.material.opacity > 0.02;
    if (pour.visible) {
      // dallo spout (y≈0.44 in locale pinta) al pelo del liquido
      const spoutY = 0.44;
      const h = Math.max(0.03, spoutY - liqTop);
      pour.scale.y = h;
      pour.position.y = liqTop + h / 2;
    }

    // Il brindisi: i boccali si inclinano l'uno verso l'altro e si toccano.
    const cheer = brindisiAmt * brindisiAmt;
    mugL.rotation.z += (-0.5 * cheer - mugL.rotation.z) * 0.1;
    mugR.rotation.z += (0.5 * cheer - mugR.rotation.z) * 0.1;
    mugL.position.x += (-0.38 + 0.19 * cheer - mugL.position.x) * 0.1;
    mugR.position.x += (0.38 - 0.19 * cheer - mugR.position.x) * 0.1;
    brindisi.position.y = 1.42 + Math.sin(time * 1.6) * 0.015 * cheer;

    // Polvere dorata: deriva lenta nell'aria calda.
    if (dust) {
      dust.rotation.y = time * 0.014;
      dust.position.y = Math.sin(time * 0.25) * 0.12;
    }

    // Sala Giochi: la freccetta vola verso il bersaglio (con leggera parabola)
    // e i dadi rotolano finché la sezione non è centrata.
    const g = giochiAmt * giochiAmt * (3 - 2 * giochiAmt); // smoothstep
    dartArrow.position.lerpVectors(dartFrom, dartTo, g);
    dartArrow.position.y += Math.sin(g * Math.PI) * 0.22; // arco di volo
    dartArrow.rotation.z = (1 - g) * -0.35;
    dartArrow.rotation.y = (1 - g) * 0.4;
    const roll = 1 - g;
    die1.rotation.x += roll * 0.12;
    die1.rotation.z += roll * 0.09;
    die2.rotation.x -= roll * 0.1;
    die2.rotation.y += roll * 0.11;

    // Vapore del burger: sale, si allarga e svanisce in loop.
    steam.forEach((s, i) => {
      const k = (time * 0.35 + s.userData.seed + i * 0.33) % 1;
      s.position.y = 1.32 + k * 0.5;
      s.position.x = Math.sin((time + i) * 1.3) * 0.04;
      s.scale.setScalar(0.1 + k * 0.22);
      s.material.opacity = Math.sin(k * Math.PI) * 0.16;
    });

    // Brindisi: al culmine del tocco parte l'esplosione di schiuma (one-shot,
    // si riarma quando i boccali si allontanano).
    if (cheer > 0.88 && burstArmed) {
      burstT = 0;
      burstArmed = false;
    }
    if (cheer < 0.3) burstArmed = true;
    if (burstT >= 0) {
      burstT += dt * 1.6;
      const life = Math.min(1, burstT);
      const pos = burst.geometry.attributes.position;
      for (let i = 0; i < BURST_N; i++) {
        const d = burstDir[i];
        const r = life * (0.25 + pseudo(i * 5) * 0.3);
        pos.setXYZ(i, d.x * r, d.y * r - life * life * 0.18, d.z * r);
      }
      pos.needsUpdate = true;
      burst.material.opacity = Math.sin(Math.min(1, life) * Math.PI) * 0.9;
      if (life >= 1) burstT = -1;
    } else {
      burst.material.opacity = 0;
    }

    // Gli anni della Storia fluttuano piano, come appesi nell'aria.
    anniPanels.forEach((p, i) => {
      p.position.y = 2.35 + Math.sin(time * 0.7 + p.userData.seed * 6) * 0.05;
      p.rotation.y = Math.PI / 2;
    });

    // ---- Fondali del menu: si accendono quando la loro sezione è centrata ----
    // FRITTI: si dilatano (scale), si spezzano (le metà si separano) e ruotano.
    const fA = zoneAmt.fritti;
    fries3.forEach((pair) => {
      const u = pair.userData;
      const w = Math.sin(time * 2.1 + u.ph);
      const stretch = 1 + Math.max(0, w) * 0.7 * fA;        // dilatazione
      const split = Math.max(0, -w) * 0.16 * fA;            // spezzata
      u.a.scale.y = stretch;
      u.b.scale.y = stretch;
      u.a.position.y = 0.09 * stretch + split;
      u.b.position.y = -0.09 * stretch - split;
      pair.rotation.z = Math.sin(time * 0.9 + u.ph) * 0.5 * fA;
      pair.rotation.x = Math.cos(time * 0.7 + u.ph) * 0.3 * fA;
      pair.position.y = u.baseY + Math.sin(time * 1.1 + u.ph) * 0.12 * fA;
    });
    rings3.forEach((r) => {
      r.rotation.x = time * (0.6 + r.userData.ph * 0.1) * Math.max(0.15, fA);
      r.rotation.y = time * 0.4 * Math.max(0.15, fA);
    });

    // DOLCI: le fette orbitano attorno all'alzata, il cacao cade in loop.
    const dA = zoneAmt.dessert;
    fette.forEach((f) => {
      const u = f.userData;
      const ang = time * (0.35 + 0.5 * dA) + u.ph;
      const rOrb = 0.28 + 0.3 * dA;
      f.position.set(Math.cos(ang) * rOrb, Math.sin(time * 0.8 + u.ph) * 0.22 * dA - 0.35, Math.sin(ang) * rOrb);
      f.rotation.y = ang * 1.6;
      f.rotation.z = Math.sin(time + u.ph) * 0.25 * dA;
    });
    {
      const pos = cacao.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - dt * (0.25 + dA * 0.55);
        if (y < -0.9) y = 0.9;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      cacao.material.opacity = 0.25 + dA * 0.6;
    }

    // BAR: lo shaker shakera davvero, il Martini ondeggia, la tazzina fuma.
    const bA = zoneAmt.bar;
    shaker.rotation.z = Math.sin(time * 16) * 0.22 * bA;
    shaker.position.y = -0.5 + Math.abs(Math.sin(time * 16)) * 0.1 * bA;
    martini.rotation.z = Math.sin(time * 1.4) * 0.1 * bA;
    martini.position.y = Math.sin(time * 1.1) * 0.1 * bA;
    steamBar.forEach((sp, i) => {
      const k = (time * 0.4 + sp.userData.seed + i * 0.5) % 1;
      sp.position.y = tazzina.position.y + 0.12 + k * 0.42;
      sp.position.x = tazzina.position.x + Math.sin((time + i) * 1.6) * 0.03;
      sp.scale.setScalar(0.07 + k * 0.16);
      sp.material.opacity = Math.sin(k * Math.PI) * 0.3 * Math.max(0.3, bA);
    });

    // CUCINA: i burger satelliti si smontano e rimontano in loop continuo.
    const cA = Math.max(0.12, zoneAmt.cucina);
    flyBurgers.forEach((g) => {
      const u = g.userData;
      const cyc = (Math.sin(time * 0.9 + u.ph) + 1) / 2; // 0 chiuso → 1 esploso
      u.layers.forEach((L, li) => {
        L.m.position.y = L.off * (0.3 + cyc * 1.6) * cA;
        L.m.rotation.y = time * (0.3 + li * 0.15);
      });
      g.rotation.y = time * 0.25 + u.ph;
      g.position.y += Math.sin(time * 1.2 + u.ph) * 0.0012;
    });

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
    setSpina: (p) => { spinaAmt = Math.max(0, Math.min(1, p)); },
    setBrindisi: (p) => { brindisiAmt = Math.max(0, Math.min(1, p)); },
    setGiochi: (p) => { giochiAmt = Math.max(0, Math.min(1, p)); },
    setBirraFocus: (i) => { birraFocus = Number.isInteger(i) && i >= 0 && i <= 2 ? i : -1; },
    setZone: (name, p) => {
      if (name in zoneAmt) zoneAmt[name] = Math.max(0, Math.min(1, p));
    },
    getT: () => ({ targetT, renderT, intro: introActive }),
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

function makeYearCard(txt) {
  // Cartellino d'epoca fluttuante: testo dorato su velo scuro, bordo sottile.
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 216;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(14, 10, 7, 0.72)';
  ctx.fillRect(0, 0, 512, 216);
  ctx.strokeStyle = 'rgba(232, 176, 75, 0.85)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 492, 196);
  ctx.font = '700 92px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#e8b04b';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#f4e9d0';
  ctx.fillText(txt, 256, 112);
  return new THREE.CanvasTexture(c);
}

function makeWood() {
  // Doghe di legno caldo con venature — disegnate a mano su canvas.
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const plank = 32;
  for (let y = 0; y < 256; y += plank) {
    // tonalità leggermente diversa per doga
    const t = 0.85 + pseudo(y) * 0.35;
    ctx.fillStyle = `rgb(${Math.round(58 * t)}, ${Math.round(36 * t)}, ${Math.round(22 * t)})`;
    ctx.fillRect(0, y, 256, plank);
    // venature
    ctx.strokeStyle = 'rgba(20, 12, 7, 0.35)';
    ctx.lineWidth = 1;
    for (let v = 0; v < 5; v++) {
      const vy = y + 4 + pseudo(y * 7 + v) * (plank - 8);
      ctx.beginPath();
      ctx.moveTo(0, vy);
      for (let x = 0; x <= 256; x += 32) {
        ctx.lineTo(x, vy + Math.sin(x * 0.05 + v) * 1.5);
      }
      ctx.stroke();
    }
    // fuga tra le doghe
    ctx.fillStyle = 'rgba(10, 6, 4, 0.8)';
    ctx.fillRect(0, y + plank - 1.5, 256, 1.5);
  }
  return new THREE.CanvasTexture(c);
}

function makeBrick() {
  // Mattoni a vista in palette, con fughe scure e variazioni di tono.
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#17100b'; // fuga
  ctx.fillRect(0, 0, 256, 128);
  const bw = 42, bh = 18, gap = 3;
  let row = 0;
  for (let y = 0; y < 128; y += bh + gap) {
    const off = row % 2 ? -(bw + gap) / 2 : 0;
    for (let x = off; x < 256; x += bw + gap) {
      const t = 0.8 + pseudo(x * 13 + y * 7) * 0.5;
      ctx.fillStyle = `rgb(${Math.round(74 * t)}, ${Math.round(40 * t)}, ${Math.round(24 * t)})`;
      ctx.fillRect(x, y, bw, bh);
    }
    row++;
  }
  return new THREE.CanvasTexture(c);
}

function makeSoftDot() {
  // Puntino morbido per la polvere dorata (sprite radiale sfumato).
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 1, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,235,190,0.9)');
  g.addColorStop(0.5, 'rgba(232,176,75,0.35)');
  g.addColorStop(1, 'rgba(232,176,75,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
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
