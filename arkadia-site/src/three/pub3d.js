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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isHigh ? 2 : 1.35));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0a07);
  scene.fog = new THREE.FogExp2(0x0e0a07, 0.024);

  const env = makeEnv(renderer);
  scene.environment = env;

  // In verticale (telefono) il campo visivo si allarga: si vede più scena
  // ai lati, dove in portrait l'inquadratura stringerebbe troppo.
  const fovPer = () => (window.innerWidth / window.innerHeight < 0.8 ? 64 : 55);
  const camera = new THREE.PerspectiveCamera(fovPer(), window.innerWidth / window.innerHeight, 0.1, 100);

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


  // ==================================================================
  //  METODO "ESPERIENZA IMMERSIVA ARKADIA" (da ripetere per ogni zona):
  //  1. 2-3 prodotti REALI della categoria come oggetti 3D fisici nella
  //     scena, distinti tra loro (colori/forme/ingredienti veri).
  //  2. In fila lungo il percorso camera della loro stazione: scrollando
  //     ci si passa vicino a ognuno. MAI lock di scroll né hover/POV.
  //  3. UNA animazione continua pilotata dalla proximity DOM della sezione
  //     (mescita per le birre, apertura a strati per i burger, ...).
  //  4. La sezione DOM elenca gli stessi 2-3 prodotti + CTA al /menu.
  //  5. Luce calda dedicata sugli oggetti.
  //  Prossime zone: friggitoria (fritti), caffetteria (tisane+caffè),
  //  cocktail bar sul BANCONE lato DESTRO (z locale -1..-4, oggi vuoto).
  // ==================================================================

  // ---- LE TRE DEL MOMENTO sotto le spine: si riempiono IN SINCRONIA con
  //      lo scroll. Tre colori DIVERSI e REALISTICI (mai bianchi):
  //      bionda dorata (Birra del Mese) · ramata (La Rossa) · rubino ciliegia
  //      (Chouffe Red), ognuna con la sua schiuma (crema / nocciola / rosata).
  const TRIO_COL = [0xd9921e, 0x9a4210, 0x8e1032];
  const TRIO_EMI = [0x7a4a08, 0x3f1808, 0x3c0618];
  const TRIO_EI = [0.3, 0.35, 0.4];
  const TRIO_FOAM = [0xf4e9d0, 0xe2cba4, 0xf0d6d2];
  const trio = [];
  [0.07, 0.49, 0.91].forEach((z, i) => {
    const g = new THREE.Group();
    g.position.set(0.08, 1.22, z); // esattamente sotto lo spout del rubinetto
    const glassM = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.07, 0.3, 16, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0xf3ead6, roughness: 0.08, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
    );
    glassM.position.y = 0.15;
    const liq = new THREE.Mesh(
      new THREE.CylinderGeometry(0.078, 0.064, 1, 14),
      mat(TRIO_COL[i], { r: 0.32, e: TRIO_EMI[i], ei: TRIO_EI[i] })
    );
    liq.scale.y = 0.001;
    const foam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.026, 14), mat(TRIO_FOAM[i], { r: 0.95 }));
    foam.visible = false;
    const jet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.015, 1, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: TRIO_COL[i], transparent: true, opacity: 0 })
    );
    g.add(glassM, liq, foam, jet);
    bar.add(g);
    trio.push({ liq, foam, jet });
  });
  // Cassa di legno con le bottiglie, a terra a fine bancone (lato ingresso):
  // il benvenuto della sezione "In bottiglia" quando la camera fa il giro.
  const cassa = new THREE.Group();
  cassa.position.set(0.55, 0, 3.6); // bar-locale: davanti al bancone, lato porta
  cassa.rotation.y = -0.4;
  const cassaLati = [
    [0, 0.14, 0.21, 0.56, 0.28, 0.02], [0, 0.14, -0.21, 0.56, 0.28, 0.02],
    [0.27, 0.14, 0, 0.02, 0.28, 0.4], [-0.27, 0.14, 0, 0.02, 0.28, 0.4],
    [0, 0.02, 0, 0.52, 0.03, 0.38],
  ];
  cassaLati.forEach(([px, py, pz, sx, sy, sz]) => {
    const lato = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat(0x6a4a26, { r: 0.85 }));
    lato.position.set(px, py, pz);
    cassa.add(lato);
  });
  const cassaCols = [0x5a3212, 0x3a5e2a, 0x4a1016, 0x5a3212, 0x38160e, 0x3a5e2a];
  for (let i = 0; i < 6; i++) {
    const bx = -0.16 + (i % 3) * 0.16;
    const bz = i < 3 ? -0.09 : 0.09;
    const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.24, 10), mat(cassaCols[i], { r: 0.35, e: 0x120a04, ei: 0.4 }));
    corpo.position.set(bx, 0.16, bz);
    const collo = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.035, 0.12, 8), mat(cassaCols[i], { r: 0.35 }));
    collo.position.set(bx, 0.34, bz);
    const tappo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.018, 8), mat(C.ottone, { r: 0.3, m: 0.8 }));
    tappo.position.set(bx, 0.41, bz);
    cassa.add(corpo, collo, tappo);
  }
  bar.add(cassa);

  // Secchiello del ghiaccio sul bancone con due bottiglie in fresco.
  const secchiello = new THREE.Group();
  secchiello.position.set(0.12, 1.22, 2.5);
  const secchio = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.1, 0.2, 16, 1, true),
    mat(0xc8ccd2, { r: 0.25, m: 0.85, side: THREE.DoubleSide })
  );
  secchio.position.y = 0.1;
  const secchioFondo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), mat(0xc8ccd2, { r: 0.25, m: 0.85 }));
  secchioFondo.position.y = 0.01;
  secchiello.add(secchio, secchioFondo);
  const ghiaccioM = new THREE.MeshPhysicalMaterial({ color: 0xf8fbff, roughness: 0.2, transparent: true, opacity: 0.55 });
  for (let i = 0; i < 5; i++) {
    const cubo = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.045), ghiaccioM);
    const a = i * 1.3;
    cubo.position.set(Math.cos(a) * 0.07, 0.2, Math.sin(a) * 0.07);
    cubo.rotation.set(i, a, 0.4);
    secchiello.add(cubo);
  }
  [[-0.045, 0x3a5e2a, -0.25], [0.05, 0x4a1016, 0.3]].forEach(([bx, bc, tilt]) => {
    const bott = new THREE.Group();
    const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.22, 10), mat(bc, { r: 0.3, e: 0x120a04, ei: 0.4 }));
    corpo.position.y = 0.11;
    const collo = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.11, 8), mat(bc, { r: 0.3 }));
    collo.position.y = 0.27;
    bott.add(corpo, collo);
    bott.position.set(bx, 0.08, 0);
    bott.rotation.z = tilt;
    secchiello.add(bott);
  });
  bar.add(secchiello);

  // Bottiglietta Chouffe accanto al suo bicchiere (firma della terza)
  const chBot = new THREE.Group();
  chBot.position.set(0.08, 1.22, 1.18);
  const chBody = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.2, 12), mat(0x4a1016, { r: 0.4, e: 0x200409, ei: 0.4 }));
  chBody.position.y = 0.1;
  const chNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.032, 0.11, 10), mat(0x4a1016, { r: 0.4, e: 0x200409, ei: 0.4 }));
  chNeck.position.y = 0.25;
  chBot.add(chBody, chNeck);
  bar.add(chBot);
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
  // ---- I TRE IN VOGA sul tavolo (stessa esperienza immersiva delle birre):
  //      tre piatti in fila lungo il percorso camera; scrollando la sezione
  //      Hamburger ognuno si apre a mezz'aria mostrando i SUOI ingredienti
  //      reali. Pane diverso per ognuno: sesamo (Brexit) · rustico scuro
  //      (Hellfire) · brioche lucida (Cheeseburger). Nessun lock di scroll.
  let burgerAmt = 0; // 0..1 dal DOM (sezione Hamburger centrata)
  const seg = isHigh ? 22 : 14;

  // Builder di strati (ogni ingrediente reale ha la sua mini-geometria)
  const mkPatty = () => new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.153, 0.055, seg), mat(0x4a2a16, { r: 0.85 }));
  const mkInsalata = () => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.158, 0.02, seg), mat(0x4a7a30, { r: 0.9 }));
    m.scale.z = 0.94; // foglia irregolare
    return m;
  };
  const mkCheddar = () => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.014, 0.24), mat(0xe8a33c, { r: 0.5, e: 0x6a4310, ei: 0.25 }));
    m.rotation.y = Math.PI / 5;
    return m;
  };
  const mkBacon = () => {
    // due strisce ondulate: segmenti alternati carne scura / grasso chiaro
    const g = new THREE.Group();
    for (let k = 0; k < 2; k++) {
      const strip = new THREE.Group();
      for (let s = 0; s < 3; s++) {
        const piece = new THREE.Mesh(
          new THREE.BoxGeometry(0.062, 0.012, 0.19),
          mat(s === 1 ? 0xd9a888 : 0x8a3020, { r: 0.7 })
        );
        piece.position.set(-0.062 + s * 0.062, (s % 2 ? 1 : -1) * 0.004, 0);
        strip.add(piece);
      }
      strip.position.x = -0.05 + k * 0.1;
      strip.rotation.y = (k ? -1 : 1) * 0.35;
      g.add(strip);
    }
    return g;
  };
  const mkAnelli = () => {
    const g = new THREE.Group();
    for (let k = 0; k < 2; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.017, 8, 16), mat(0xd8912f, { r: 0.55, e: 0x6a3a10, ei: 0.2 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(-0.055 + k * 0.11, 0, k ? 0.025 : -0.025);
      g.add(ring);
    }
    return g;
  };
  const mkBbq = () => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 8, 20), mat(0x5a2210, { r: 0.35, e: 0x2a0d04, ei: 0.4 }));
    m.rotation.x = Math.PI / 2;
    return m;
  };
  const mkStracciatella = () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, seg, 12), mat(0xf6f2e8, { r: 0.95 }));
    m.scale.set(1.2, 0.28, 1.1);
    return m;
  };
  const mkBomba = () => {
    const g = new THREE.Group();
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.135, 0.026, seg), mat(0xb83010, { r: 0.75, e: 0x501004, ei: 0.4 }));
    g.add(disco);
    for (let k = 0; k < 4; k++) {
      const chili = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), mat(0xe03414, { r: 0.4, e: 0xa01000, ei: 0.8 }));
      const a = (k / 4) * Math.PI * 2 + 0.6;
      chili.position.set(Math.cos(a) * 0.08, 0.018, Math.sin(a) * 0.08);
      g.add(chili);
    }
    return g;
  };
  const mkTomino = () => new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.045, seg), mat(0xf0ead8, { r: 0.85 }));
  const mkBunBottom = (color) =>
    new THREE.Mesh(new THREE.SphereGeometry(0.17, seg, seg, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(color, { r: 0.75 }));
  function mkBunTop(style) {
    const g = new THREE.Group();
    if (style === 'sesamo') {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.175, seg, seg, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xa57136, { r: 0.7 })));
      for (let k = 0; k < 9; k++) {
        const sem = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), mat(0xf2e2c0, { r: 0.9 }));
        const a = pseudo(k * 7) * Math.PI * 2;
        const e = 0.35 + pseudo(k * 3) * 0.85;
        sem.position.set(Math.cos(a) * Math.cos(e) * 0.172, Math.sin(e) * 0.172, Math.sin(a) * Math.cos(e) * 0.172);
        sem.scale.y = 0.55;
        g.add(sem);
      }
    } else if (style === 'rustico') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.178, seg, seg, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x6a4520, { r: 0.95 }));
      cap.scale.y = 0.78; // più basso e piatto, da forno a legna
      g.add(cap);
      for (let k = 0; k < 6; k++) {
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), mat(0xd9c9a8, { r: 1 }));
        const a = pseudo(k * 13) * Math.PI * 2;
        const e = 0.5 + pseudo(k * 5) * 0.8;
        fl.position.set(Math.cos(a) * Math.cos(e) * 0.174, Math.sin(e) * 0.136, Math.sin(a) * Math.cos(e) * 0.174);
        fl.scale.y = 0.25;
        g.add(fl);
      }
    } else {
      // brioche lucida, senza semi
      g.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.172, seg, seg, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshPhysicalMaterial({ color: 0xc07f3a, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 })
      ));
    }
    return g;
  }

  // Le tre ricette REALI (stesso ordine della lista in home):
  // [builder, quota base, offset di apertura]
  const RICETTE3D = [
    { // BREXIT — sesamo: insalata, 200gr, bacon, cheddar, anelli cipolla, bbq
      x: -0.33, z: -0.26,
      strati: [
        { make: () => mkBunBottom(0x9a6a30), y: 0.045, off: 0 },
        { make: mkInsalata, y: 0.062, off: 0.07 },
        { make: mkPatty, y: 0.1, off: 0.14 },
        { make: mkBacon, y: 0.135, off: 0.21 },
        { make: mkCheddar, y: 0.152, off: 0.28 },
        { make: mkAnelli, y: 0.178, off: 0.36 },
        { make: mkBbq, y: 0.198, off: 0.43 },
        { make: () => mkBunTop('sesamo'), y: 0.208, off: 0.52 },
      ],
    },
    { // HELLFIRE — rustico: insalata, 200gr, stracciatella, bomba calabra
      x: 0, z: 0,
      strati: [
        { make: () => mkBunBottom(0x8a5a28), y: 0.045, off: 0 },
        { make: mkInsalata, y: 0.062, off: 0.08 },
        { make: mkPatty, y: 0.1, off: 0.17 },
        { make: mkStracciatella, y: 0.148, off: 0.27 },
        { make: mkBomba, y: 0.178, off: 0.37 },
        { make: () => mkBunTop('rustico'), y: 0.2, off: 0.48 },
      ],
    },
    { // CHEESEBURGER — brioche: 200gr, cheddar, bacon, tomino
      x: 0.33, z: 0.26,
      strati: [
        { make: () => mkBunBottom(0xb07a38), y: 0.045, off: 0 },
        { make: mkPatty, y: 0.095, off: 0.09 },
        { make: mkCheddar, y: 0.13, off: 0.18 },
        { make: mkBacon, y: 0.148, off: 0.27 },
        { make: mkTomino, y: 0.185, off: 0.36 },
        { make: () => mkBunTop('brioche'), y: 0.222, off: 0.46 },
      ],
    },
  ];
  const burgers = [];
  RICETTE3D.forEach((cfg, bIdx) => {
    const piatto = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.025, 22), mat(C.schiuma, { r: 0.6 }));
    piatto.position.set(cfg.x, 1.09, cfg.z);
    table.add(piatto);
    const grp = new THREE.Group();
    grp.position.set(cfg.x, 1.11, cfg.z);
    grp.rotation.y = bIdx * 2.1; // ognuno mostra un lato diverso
    table.add(grp);
    const layers = cfg.strati.map((s) => {
      const m = s.make();
      m.position.y = s.y;
      grp.add(m);
      return { m, y: s.y, off: s.off };
    });
    burgers.push({ grp, layers, seed: bIdx * 2.1 });
  });
  // Luce calda dedicata sopra il tavolo: i tre panini ben definiti.
  const tavoloLight = new THREE.PointLight(0xffc06a, isHigh ? 7 : 5, 4.5, 2);
  tavoloLight.position.set(2.6, 2.35, -3);
  scene.add(tavoloLight);

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
  // corpo del bancone fino al pavimento (il piano non galleggia)
  const fritCab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.9), mat(C.legno, { r: 0.75 }));
  fritCab.position.y = -1.4;
  fritGrp.add(fritCab);
  // ---- I TRE IN VOGA della friggitoria SUL BANCONE (metodo immersivo):
  //      Patatine "Montparnasse" (formaggio fuso, cheddar e bacon) · Tagliere
  //      "Colesterolo" (gran trionfo di fritti) · Onion Rings impilati.
  //      In fila lungo lo sguardo della stazione 4; scrollando sfrigolano
  //      appena usciti dal fritto. Nessun lock.
  const CTOP = -0.89; // quota del piano del bancone friggitoria (locale a fritGrp)
  const friggFries = [];   // patatine nella coppetta
  const friggItems = [];   // pezzi sul tagliere
  const friggStack = [];   // anelli impilati
  // 1) Patatine Montparnasse: coppetta di carta, patatine cariche, colata di
  //    formaggio e briciole di bacon croccante.
  {
    const g = new THREE.Group();
    g.position.set(-0.36, CTOP, 0.42);
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.075, 0.18, 14, 1, true),
      mat(C.rame, { r: 0.7, side: THREE.DoubleSide })
    );
    cup.position.y = 0.09;
    g.add(cup);
    for (let i = 0; i < 12; i++) {
      const fry = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.17, 0.022), mat(0xe8b04b, { r: 0.55, e: 0x6a4310, ei: 0.2 }));
      const a = pseudo(i * 7) * Math.PI * 2;
      const rr = pseudo(i * 3) * 0.06;
      fry.position.set(Math.cos(a) * rr, 0.16 + pseudo(i * 5) * 0.05, Math.sin(a) * rr);
      fry.rotation.z = (pseudo(i * 11) - 0.5) * 0.5;
      fry.rotation.x = (pseudo(i * 13) - 0.5) * 0.5;
      fry.userData = { baseY: fry.position.y, ph: pseudo(i * 17) * Math.PI * 2 };
      g.add(fry);
      friggFries.push(fry);
    }
    const cheeseM = mat(0xf0b23c, { r: 0.35, e: 0x7a4a08, ei: 0.5 });
    const cheese = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), cheeseM);
    cheese.scale.set(1.15, 0.4, 1.15);
    cheese.position.y = 0.2;
    g.add(cheese);
    for (let i = 0; i < 3; i++) {
      const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.07, 8), cheeseM);
      const a = (i / 3) * Math.PI * 2 + 0.5;
      drip.position.set(Math.cos(a) * 0.105, 0.13, Math.sin(a) * 0.105);
      g.add(drip);
    }
    for (let i = 0; i < 6; i++) {
      const bit = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, 0.014), mat(0x8a3020, { r: 0.6 }));
      const a = pseudo(i * 19) * Math.PI * 2;
      bit.position.set(Math.cos(a) * 0.05, 0.226, Math.sin(a) * 0.05);
      bit.rotation.y = pseudo(i * 23) * Math.PI;
      g.add(bit);
    }
    fritGrp.add(g);
  }
  // 2) Tagliere Colesterolo: tavola di legno col manico e il gran trionfo —
  //    mozzarelline, olive ascolane, crocchette e la ciotolina di salsa.
  {
    const g = new THREE.Group();
    g.position.set(0, CTOP, 0);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.3), mat(0x8a5a28, { r: 0.6 }));
    board.position.y = 0.015;
    const manico = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12), mat(0x8a5a28, { r: 0.6 }));
    manico.position.set(0.27, 0.015, 0);
    g.add(board, manico);
    const addItem = (m, x, y, z) => {
      m.position.set(x, y, z);
      m.userData = { baseY: y, ph: pseudo((x * 13 + z * 7) * 31) * Math.PI * 2 };
      g.add(m);
      friggItems.push(m);
    };
    for (let i = 0; i < 2; i++)
      addItem(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), mat(0xd8912f, { r: 0.55, e: 0x6a3a10, ei: 0.25 })), -0.16 + i * 0.075, 0.055, 0.08);
    for (let i = 0; i < 3; i++)
      addItem(new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), mat(0xb87a20, { r: 0.6, e: 0x4a2a08, ei: 0.3 })), -0.03 + i * 0.062, 0.058, -0.08);
    for (let i = 0; i < 2; i++) {
      const cro = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.04, 0.045), mat(0xcf8828, { r: 0.6, e: 0x5a3208, ei: 0.25 }));
      cro.rotation.y = 0.5 + i * 0.9;
      addItem(cro, 0.1 + i * 0.06, 0.05, 0.05 - i * 0.11);
    }
    const ciotola = new THREE.Group();
    const cioC = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.03, 0.035, 12), mat(C.schiuma, { r: 0.5 }));
    const cioS = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.008, 12), mat(0xa03020, { r: 0.4, e: 0x400a08, ei: 0.4 }));
    cioS.position.y = 0.018;
    ciotola.add(cioC, cioS);
    addItem(ciotola, -0.17, 0.048, -0.08);
    fritGrp.add(g);
  }
  // 3) Onion Rings: pila dorata sul piattino + uno appoggiato di sbieco.
  {
    const g = new THREE.Group();
    g.position.set(0.36, CTOP, -0.42);
    const piatto = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 18), mat(C.schiuma, { r: 0.6 }));
    piatto.position.y = 0.01;
    g.add(piatto);
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.026, 10, 20), mat(0xd8912f, { r: 0.5, e: 0x6a3a10, ei: 0.25 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set((pseudo(i * 5) - 0.5) * 0.02, 0.046 + i * 0.052, (pseudo(i * 7) - 0.5) * 0.02);
      ring.userData = { baseY: ring.position.y, top: i === 3 };
      g.add(ring);
      friggStack.push(ring);
    }
    const lean = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.026, 10, 20), mat(0xd8912f, { r: 0.5, e: 0x6a3a10, ei: 0.25 }));
    lean.position.set(0.12, 0.055, 0.06);
    lean.rotation.set(1.15, 0, 0.45);
    g.add(lean);
    fritGrp.add(g);
  }
  // Luce calda bassa sul bancone: i tre prodotti ben definiti.
  const friggLight = new THREE.PointLight(0xffc06a, isHigh ? 5 : 4, 3.5, 2);
  friggLight.position.set(-3.85, 1.75, -8.7);
  scene.add(friggLight);

  // ---- IL BANCO DELLE DOLCEZZE (destra, z -12.7) — metodo immersivo:
  //      i TRE dolci reali del menu ricostruiti uno per uno.
  //      Crêpe alla Nutella · Pannacotta (il topping cambia: "chiedi il tuo")
  //      · Dolce del Giorno che gira in vetrina sull'alzata.
  const dolceGrp = new THREE.Group();
  dolceGrp.position.set(4.25, 1.7, -12.7);
  root.add(dolceGrp);
  const DTOP = -0.74; // quota del piano del banco (locale a dolceGrp)
  const dolceBase = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.1), mat(C.legnoTop, { r: 0.5 }));
  dolceBase.position.y = -0.8;
  dolceGrp.add(dolceBase);
  const dolceCab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.9), mat(C.legno, { r: 0.75 }));
  dolceCab.position.y = -1.25;
  dolceGrp.add(dolceCab);
  // 1) Crêpe alla Nutella: due quarti piegati sul piatto, colata di nutella
  //    a zig-zag e zucchero a velo.
  const crepe = new THREE.Group();
  crepe.position.set(-0.32, DTOP, -0.45);
  {
    const piatto = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 18), mat(C.schiuma, { r: 0.6 }));
    piatto.position.y = 0.01;
    crepe.add(piatto);
    // pasta dorata con i bordi brunati della piastra
    const wedgeM = mat(0xcf9038, { r: 0.6, e: 0x4a2808, ei: 0.3 });
    const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.155, 0.03, 22, 1, false, 0, Math.PI / 2), wedgeM);
    w1.position.y = 0.035;
    w1.rotation.y = Math.PI * 0.75; // la punta verso il centro del banco
    const w2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.145, 0.028, 22, 1, false, 0, Math.PI / 2), wedgeM);
    w2.position.y = 0.064;
    w2.rotation.y = Math.PI * 0.75 + 0.18;
    crepe.add(w1, w2);
    // bruniture da piastra sul bordo
    for (let i = 0; i < 4; i++) {
      const brun = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), mat(0x8a5218, { r: 0.8 }));
      const a = Math.PI * 0.75 + 0.2 + i * 0.28;
      brun.position.set(Math.cos(a) * 0.145, 0.052, Math.sin(a) * 0.145);
      brun.scale.y = 0.3;
      crepe.add(brun);
    }
    const nutMat = mat(0x3a1e0c, { r: 0.25, e: 0x1a0c04, ei: 0.6 });
    for (let i = 0; i < 3; i++) {
      const filo = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.006, 0.014), nutMat);
      filo.position.set(-0.03 + i * 0.02, 0.084, -0.03 + i * 0.03);
      filo.rotation.y = 0.6 + i * 0.5;
      crepe.add(filo);
    }
    const goccia = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), nutMat);
    goccia.position.set(-0.09, 0.03, -0.06);
    crepe.add(goccia);
    for (let i = 0; i < 5; i++) {
      const zucch = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), mat(0xffffff, { r: 1 }));
      zucch.position.set((pseudo(i * 7) - 0.5) * 0.14, 0.086, (pseudo(i * 11) - 0.5) * 0.14);
      crepe.add(zucch);
    }
  }
  dolceGrp.add(crepe);
  // 2) Pannacotta: tronco di cono che TREMA come vera pannacotta; il topping
  //    cola e cambia colore piano piano (caramello → cioccolato → frutti rossi).
  const pannacotta = new THREE.Group();
  pannacotta.position.set(0, DTOP, 0);
  const pannaBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.08, 0.095, 18),
    mat(0xf6efdc, { r: 0.45, e: 0x554a30, ei: 0.15 })
  );
  const toppingMat = mat(0xa01020, { r: 0.3, e: 0x400810, ei: 0.5 });
  {
    const piatto = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 18), mat(C.schiuma, { r: 0.6 }));
    piatto.position.y = 0.01;
    pannacotta.add(piatto);
    pannaBody.position.y = 0.068;
    pannacotta.add(pannaBody);
    const colata = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), toppingMat);
    colata.scale.set(1.05, 0.35, 1.05);
    colata.position.y = 0.118;
    pannacotta.add(colata);
    for (let i = 0; i < 2; i++) {
      const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.013, 0.045, 8), toppingMat);
      const a = i * 2.4 + 0.5;
      drip.position.set(Math.cos(a) * 0.06, 0.098, Math.sin(a) * 0.06);
      pannacotta.add(drip);
    }
    const bacca = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), mat(0x6a1020, { r: 0.3, e: 0x300810, ei: 0.5 }));
    bacca.position.y = 0.135;
    pannacotta.add(bacca);
  }
  dolceGrp.add(pannacotta);
  // 3) Dolce del Giorno: sull'alzata, gira su se stesso come in vetrina
  //    ("chiedi qual è quello di oggi": ogni sera è diverso).
  const alzata = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.06, 0.26, 14), mat(C.schiuma, { r: 0.4 }));
  alzata.position.set(0.32, DTOP + 0.13, 0.45);
  dolceGrp.add(alzata);
  const alzataPiano = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.018, 18), mat(C.schiuma, { r: 0.4 }));
  alzataPiano.position.set(0.32, DTOP + 0.265, 0.45);
  dolceGrp.add(alzataPiano);
  // Torta al cioccolato a strati: pan di spagna scuro e crema alternati,
  //  glassa lucida che cola e ciliegia — ben diversa da crêpe e pannacotta.
  const dolceFetta = new THREE.Group();
  {
    const cioccoM = mat(0x38200e, { r: 0.75 });
    const cremaM = mat(0xf2e6cc, { r: 0.7 });
    [[cioccoM, 0.03, 0.015], [cremaM, 0.018, 0.039], [cioccoM, 0.03, 0.063], [cremaM, 0.018, 0.087], [cioccoM, 0.026, 0.109]].forEach(([lm, lh, ly]) => {
      const strato = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, lh, 3), lm);
      strato.position.y = ly - 0.062;
      dolceFetta.add(strato);
    });
    const glassa = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.128, 0.02, 3),
      new THREE.MeshPhysicalMaterial({ color: 0x2a1206, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.2 })
    );
    glassa.position.y = 0.07;
    const ciliegia = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), mat(0xa01020, { r: 0.3, e: 0x500810, ei: 0.5 }));
    ciliegia.position.y = 0.098;
    dolceFetta.add(glassa, ciliegia);
  }
  dolceFetta.position.set(0.32, DTOP + 0.315, 0.45);
  dolceGrp.add(dolceFetta);
  // cacao in caduta sopra il banco (sottile, non tocca i dolci)
  const CAC_N = isHigh ? 30 : 16;
  const cacPos = new Float32Array(CAC_N * 3);
  for (let i = 0; i < CAC_N; i++) {
    cacPos[i * 3] = (pseudo(i * 3) - 0.5) * 1.4;
    cacPos[i * 3 + 1] = 0.1 + pseudo(i * 5) * 1.1;
    cacPos[i * 3 + 2] = (pseudo(i * 7) - 0.5) * 0.8;
  }
  const cacGeo = new THREE.BufferGeometry();
  cacGeo.setAttribute('position', new THREE.BufferAttribute(cacPos, 3));
  const cacao = new THREE.Points(cacGeo, new THREE.PointsMaterial({
    map: makeSoftDot(), color: 0x8a5a30, size: 0.035, transparent: true,
    opacity: 0.8, depthWrite: false,
  }));
  dolceGrp.add(cacao);
  // Luce calda bassa sul banco dei dolci.
  const dolceLight = new THREE.PointLight(0xffc06a, isHigh ? 5 : 4, 3.5, 2);
  dolceLight.position.set(3.85, 1.85, -12.7);
  scene.add(dolceLight);

  // ---- IL COCKTAIL BAR — metodo immersivo, SUL BANCONE lato destro
  //      (lo spazio vuoto oltre le spine): i tre più chiesti, ognuno col suo
  //      bicchiere e il suo colore. Spritz (calice, arancio) · Negroni
  //      (tumbler, rosso scuro) · Negroni Sbagliato (flûte, col prosecco).
  //      Scrollando si riempiono davanti a te, come le birre.
  const glassMat = () =>
    new THREE.MeshPhysicalMaterial({ color: 0xf3ead6, roughness: 0.08, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const drinks = [];
  // 1) SPRITZ: calice a stelo, arancio vivo, fetta d'arancia sul bordo, ghiaccio.
  {
    const g = new THREE.Group();
    g.position.set(0.1, 1.22, -2.0); // bar-locale: lato destro del bancone
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.012, 14), glassMat());
    foot.position.y = 0.006;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.07, 8), glassMat());
    stem.position.y = 0.045;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.04, 0.1, 16, 1, true), glassMat());
    bowl.position.y = 0.13;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.038, 1, 14), mat(0xe06010, { r: 0.3, e: 0x702806, ei: 0.4 }));
    liq.scale.y = 0.001;
    liq.userData = { base: 0.082, maxH: 0.085 };
    const iceM = new THREE.MeshPhysicalMaterial({ color: 0xf8fbff, roughness: 0.15, transparent: true, opacity: 0.5 });
    const ice1 = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.028), iceM);
    ice1.position.set(0.012, 0.15, 0.008);
    ice1.rotation.set(0.4, 0.6, 0.2);
    const slice = new THREE.Group();
    const polpa = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 16), mat(0xe89030, { r: 0.5, e: 0x6a3a08, ei: 0.35 }));
    const buccia = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 16), mat(0xc05a10, { r: 0.5 }));
    buccia.rotation.x = Math.PI / 2;
    slice.add(polpa, buccia);
    slice.position.set(0.055, 0.185, 0);
    slice.rotation.z = 0.9;
    g.add(foot, stem, bowl, liq, ice1, slice);
    bar.add(g);
    drinks.push({ grp: g, liq, garnish: slice, seed: 0.4 });
  }
  // 2) NEGRONI: tumbler basso, rosso scuro, cubo di ghiaccio e twist d'arancia.
  {
    const g = new THREE.Group();
    g.position.set(0.1, 1.22, -2.7);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.046, 0.095, 16, 1, true), glassMat());
    glass.position.y = 0.048;
    const fondo = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.012, 16), glassMat());
    fondo.position.y = 0.006;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.043, 1, 14), mat(0x8e1420, { r: 0.3, e: 0x3a0810, ei: 0.45 }));
    liq.scale.y = 0.001;
    liq.userData = { base: 0.014, maxH: 0.065 };
    const iceM2 = new THREE.MeshPhysicalMaterial({ color: 0xf8fbff, roughness: 0.15, transparent: true, opacity: 0.5 });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.036, 0.036), iceM2);
    cube.position.set(0, 0.062, 0);
    cube.rotation.set(0.3, 0.8, 0.1);
    const twist = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 6, 14, Math.PI * 1.4), mat(0xe08020, { r: 0.5, e: 0x6a3208, ei: 0.3 }));
    twist.position.set(0.035, 0.1, 0.01);
    twist.rotation.set(0.6, 0.4, 1.2);
    g.add(glass, fondo, liq, cube, twist);
    bar.add(g);
    drinks.push({ grp: g, liq, garnish: twist, seed: 2.3 });
  }
  // 3) NEGRONI SBAGLIATO: flûte alta col prosecco — bollicine che salgono.
  const bolle = [];
  {
    const g = new THREE.Group();
    g.position.set(0.1, 1.22, -3.4);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.01, 14), glassMat());
    foot.position.y = 0.005;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.055, 8), glassMat());
    stem.position.y = 0.037;
    const flute = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.024, 0.13, 14, 1, true), glassMat());
    flute.position.y = 0.13;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 1, 12), mat(0xc84838, { r: 0.28, e: 0x501410, ei: 0.4 }));
    liq.scale.y = 0.001;
    liq.userData = { base: 0.067, maxH: 0.115 };
    g.add(foot, stem, flute, liq);
    for (let i = 0; i < 4; i++) {
      const bolla = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 6, 6), mat(0xffd8c0, { r: 0.3, e: 0xffb090, ei: 0.8 }));
      bolla.position.set((pseudo(i * 9) - 0.5) * 0.03, 0.08, (pseudo(i * 13) - 0.5) * 0.03);
      bolla.userData = { ph: pseudo(i * 17), liq };
      bolla.visible = false;
      g.add(bolla);
      bolle.push(bolla);
    }
    bar.add(g);
    drinks.push({ grp: g, liq, garnish: null, seed: 4.1 });
  }

  // Luci di zona: ogni angolo del menu ha la sua lampada calda.
  [[-4.0, 2.9, -8.7], [4.0, 2.9, -12.7]].forEach((pos) => {
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

  // ---- SALA GIOCHI 3D: cabinato arcade retro + giochi da tavolo + carte ----
  // Il cabinato è contro la parete destra, davanti al bersaglio: schermo a
  // pixel che sfarfalla come un CRT. Accanto al barile: la pila di scatole
  // dei giochi con la scacchiera e le pedine, e il ventaglio di carte che
  // si apre quando la sezione Giochi è al centro.
  const arcade = new THREE.Group();
  arcade.position.set(4.85, 0, -19.75);
  arcade.rotation.y = -Math.PI / 2 + 0.14; // fronte verso la sala, appena angolato
  root.add(arcade);
  const arcBody = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.75, 0.55), mat(0x1a1420, { r: 0.7 }));
  arcBody.position.y = 0.875;
  arcade.add(arcBody);
  const arcBezel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.03), mat(0x0c0910, { r: 0.5 }));
  arcBezel.position.set(0, 1.27, 0.27);
  arcade.add(arcBezel);
  const arcScreenMat = new THREE.MeshBasicMaterial({ map: makeArcadeScreen() });
  const arcScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.34), arcScreenMat);
  arcScreen.position.set(0, 1.27, 0.29);
  arcade.add(arcScreen);
  const arcPanel = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, 0.3), mat(0x241a30, { r: 0.6 }));
  arcPanel.position.set(0, 0.97, 0.34);
  arcPanel.rotation.x = -0.3;
  arcade.add(arcPanel);
  const joyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 8), mat(0x0c0910, { r: 0.4 }));
  joyBase.position.set(-0.13, 1.03, 0.36);
  const joyBall = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), mat(0xc22a1e, { r: 0.35, e: 0x500a06, ei: 0.4 }));
  joyBall.position.set(-0.13, 1.08, 0.36);
  arcade.add(joyBase, joyBall);
  [[0.07, 0xc22a1e], [0.16, 0xe8b04b]].forEach(([bx, bc]) => {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.016, 10), mat(bc, { r: 0.35, e: bc, ei: 0.25 }));
    btn.position.set(bx, 1.0, 0.37);
    btn.rotation.x = -0.3;
    arcade.add(btn);
  });
  // insegna luminosa incassata sotto il cappello del cabinato
  const arcCap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.07, 0.58), mat(0x0c0910, { r: 0.6 }));
  arcCap.position.y = 1.79;
  arcade.add(arcCap);
  const arcMarq = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.09), new THREE.MeshBasicMaterial({ color: 0xe8b04b }));
  arcMarq.position.set(0, 1.68, 0.281);
  arcade.add(arcMarq);
  // bagliore freddo del CRT: stacca nel calore del pub
  const crtLight = new THREE.PointLight(0x7ab8ff, isHigh ? 3.5 : 2.5, 2.4, 2);
  crtLight.position.set(4.35, 1.35, -19.7);
  scene.add(crtLight);

  // Pila di scatole di giochi da tavolo + scacchiera con le pedine
  const giochiTav = new THREE.Group();
  giochiTav.position.set(4.55, 0, -22.35);
  root.add(giochiTav);
  [[0x3b5e4a, 0.05, 0.15], [0x7a2e1e, 0.14, -0.2], [0xb98a3e, 0.23, 0.35]].forEach(([bc, by, br]) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.32), mat(bc, { r: 0.7 }));
    box.position.y = by;
    box.rotation.y = br;
    giochiTav.add(box);
  });
  const chess = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: makeChecker() }));
  chess.rotation.x = -Math.PI / 2;
  chess.rotation.z = 0.35;
  chess.position.y = 0.277;
  giochiTav.add(chess);
  const meeples = [];
  [[-0.06, 0.04, 0xf4e9d0], [0.05, -0.03, 0x7a2e1e], [0.0, 0.08, 0x3b5e4a]].forEach(([mx, mz, mc], i) => {
    const mp = new THREE.Group();
    const corpo = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 10), mat(mc, { r: 0.5 }));
    corpo.position.y = 0.025;
    const testa = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), mat(mc, { r: 0.5 }));
    testa.position.y = 0.058;
    mp.add(corpo, testa);
    mp.position.set(mx, 0.28, mz);
    mp.userData = { baseY: 0.28, ph: i * 1.7 };
    giochiTav.add(mp);
    meeples.push(mp);
  });

  // Biliardino (calcio balilla): rosso contro blu in mezzo alla sala giochi.
  // Le stecche girano e scattano quando la sezione Giochi è al centro.
  const biliardino = new THREE.Group();
  biliardino.position.set(3.15, 0, -22.1);
  biliardino.rotation.y = 0.5;
  root.add(biliardino);
  const bilCorpo = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.24, 0.75), mat(C.legno, { r: 0.7 }));
  bilCorpo.position.y = 0.78;
  biliardino.add(bilCorpo);
  const bilCampo = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.02, 0.62), mat(0x2f6a3a, { r: 0.9 }));
  bilCampo.position.y = 0.9;
  biliardino.add(bilCampo);
  const bilLinea = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 0.62), mat(0xf4e9d0, { r: 0.9 }));
  bilLinea.position.y = 0.912;
  biliardino.add(bilLinea);
  [[-0.55, -0.28], [0.55, -0.28], [-0.55, 0.28], [0.55, 0.28]].forEach(([lx, lz]) => {
    const gamba = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.66, 8), mat(0x201510, { r: 0.8 }));
    gamba.position.set(lx, 0.33, lz);
    biliardino.add(gamba);
  });
  const bilAste = [];
  for (let i = 0; i < 6; i++) {
    const asta = new THREE.Group();
    asta.position.set(-0.45 + i * 0.18, 0.97, 0);
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.95, 8), mat(0xd9cdb4, { r: 0.25, m: 0.7 }));
    tubo.rotation.x = Math.PI / 2;
    asta.add(tubo);
    const manopola = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.09, 10), mat(0x100b07, { r: 0.6 }));
    manopola.rotation.x = Math.PI / 2;
    manopola.position.z = 0.46;
    asta.add(manopola);
    const squadra = i % 2 ? 0x2858c8 : 0xc22a1e; // blu contro rosso
    const nOmini = i === 0 || i === 5 ? 1 : i === 1 || i === 4 ? 2 : 3;
    for (let k = 0; k < nOmini; k++) {
      const omino = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.035), mat(squadra, { r: 0.5, e: squadra, ei: 0.12 }));
      omino.position.set(0, -0.075, (k - (nOmini - 1) / 2) * 0.17);
      asta.add(omino);
    }
    asta.userData = { ph: pseudo(i * 29) * Math.PI * 2, baseZ: 0 };
    biliardino.add(asta);
    bilAste.push(asta);
  }
  const bilPalla = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), mat(0xf4e9d0, { r: 0.4 }));
  bilPalla.position.set(0.1, 0.935, 0.05);
  biliardino.add(bilPalla);

  // Ventaglio di carte da gioco sul barile (si apre con lo scroll)
  const cardFan = new THREE.Group();
  cardFan.position.set(4.26, 0.86, -21.4);
  cardFan.rotation.y = -Math.PI / 3.2; // rivolto verso la sala
  cardFan.rotation.x = -0.15;
  root.add(cardFan);
  const cards = [];
  const cardGeo = new THREE.PlaneGeometry(0.07, 0.11);
  cardGeo.translate(0, 0.055, 0); // pivot sul bordo basso: il ventaglio ruota da lì
  for (let i = 0; i < 5; i++) {
    const card = new THREE.Mesh(cardGeo, mat(0xf4e9d0, { r: 0.6, side: THREE.DoubleSide }));
    card.position.z = i * 0.0022; // leggerissimo sfalsamento anti z-fighting
    cardFan.add(card);
    cards.push(card);
  }

  // ---- SET-PIECE TAVOLA: patatine + vapore sopra il burger ----
  const friesCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.055, 0.12, 12, 1, true),
    mat(C.rame, { r: 0.7, side: THREE.DoubleSide })
  );
  friesCup.position.set(0.25, 1.17, -0.5);
  table.add(friesCup);
  for (let i = 0; i < 7; i++) {
    const fry = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.16, 0.016), mat(0xe8b04b, { r: 0.6, e: 0x6a4310, ei: 0.15 }));
    const a = pseudo(i * 11) * Math.PI * 2;
    fry.position.set(0.25 + Math.cos(a) * 0.035, 1.26, -0.5 + Math.sin(a) * 0.035);
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

  // ======================================================================
  //  SET DRESSING — l'arredo che rende vivo il pub. Tutto statico e fuori
  //  dal corridoio della camera (x tra -2.3 e 2.3): scenografia, non
  //  ostacoli. Zone: salotto in pelle · pedana rialzata coi tavoli ·
  //  cappelli appesi · cimeli d'epoca · fumetti incorniciati · travi ·
  //  botti e piante · insegna sul fondo.
  // ======================================================================

  // -- Travi di legno a soffitto: scaldano ogni sguardo verso l'alto.
  for (let i = 0; i < 7; i++) {
    const trave = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.16, 0.32), mat(0x241609, { r: 0.95 }));
    trave.position.set(0, 4.08, 6 - i * 6);
    root.add(trave);
  }

  // -- IL SALOTTO (parete sinistra, z -13..-17): due poltrone in pelle
  //    attorno al tavolino con la lampada, tappeto e libreria dei fumetti.
  function makePoltrona() {
    const g = new THREE.Group();
    const pelle = mat(0x63301e, { r: 0.55 });
    const seduta = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.56), pelle);
    seduta.position.y = 0.34;
    const cuscino = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.5), mat(0x74402a, { r: 0.6 }));
    cuscino.position.y = 0.46;
    const schienale = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.56, 0.16), pelle);
    schienale.position.set(0, 0.6, -0.26);
    schienale.rotation.x = -0.12;
    const brL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.56), pelle);
    brL.position.set(-0.36, 0.48, 0);
    const brR = brL.clone();
    brR.position.x = 0.36;
    g.add(seduta, cuscino, schienale, brL, brR);
    for (let k = 0; k < 4; k++) {
      const gamba = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.24, 8), mat(0x1a0f08, { r: 0.8 }));
      gamba.position.set(k % 2 ? 0.26 : -0.26, 0.12, k < 2 ? 0.22 : -0.22);
      g.add(gamba);
    }
    return g;
  }
  const salotto = new THREE.Group();
  salotto.position.set(-4.0, 0, -15.0);
  root.add(salotto);
  const tappeto = new THREE.Mesh(new THREE.CircleGeometry(1.25, 26), mat(0x4a1812, { r: 0.95 }));
  tappeto.rotation.x = -Math.PI / 2;
  tappeto.position.y = 0.012;
  salotto.add(tappeto);
  const bordoTappeto = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.25, 26), mat(0xb98a3e, { r: 0.9 }));
  bordoTappeto.rotation.x = -Math.PI / 2;
  bordoTappeto.position.y = 0.013;
  salotto.add(bordoTappeto);
  const poltA = makePoltrona();
  poltA.position.set(-0.15, 0, 0.85);
  poltA.rotation.y = Math.PI + 0.5;
  salotto.add(poltA);
  const poltB = makePoltrona();
  poltB.position.set(-0.15, 0, -0.85);
  poltB.rotation.y = -0.5;
  salotto.add(poltB);
  const tavolinoS = new THREE.Group();
  const tsTop = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 18), mat(C.legnoTop, { r: 0.5 }));
  tsTop.position.y = 0.42;
  const tsLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.42, 10), mat(0x1a0f08, { r: 0.8 }));
  tsLeg.position.y = 0.21;
  tavolinoS.add(tsTop, tsLeg);
  tavolinoS.position.set(0.35, 0, 0);
  salotto.add(tavolinoS);
  // lampada da tavolo col paralume acceso
  const lampadaS = new THREE.Group();
  const lsBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.03, 12), mat(C.ottone, { r: 0.3, m: 0.8 }));
  const lsStelo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 8), mat(C.ottone, { r: 0.3, m: 0.8 }));
  lsStelo.position.y = 0.13;
  const lsParalume = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.14, 0.14, 14, 1, true),
    mat(0xe8c890, { r: 0.8, e: 0xcf9a4a, ei: 0.9, side: THREE.DoubleSide })
  );
  lsParalume.position.y = 0.3;
  lampadaS.add(lsBase, lsStelo, lsParalume);
  lampadaS.position.set(0.35, 0.45, 0);
  salotto.add(lampadaS);
  const salottoLight = new THREE.PointLight(0xffb851, isHigh ? 6 : 4, 4.5, 2);
  salottoLight.position.set(-3.6, 1.4, -15.0);
  scene.add(salottoLight);
  // libreria a parete con libri colorati e due fumetti in mostra
  const libreria = new THREE.Group();
  libreria.position.set(-5.0, 0, -17.3);
  root.add(libreria);
  const libFianchi = [-0.62, 0.62];
  libFianchi.forEach((z) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.1, 0.06), mat(C.legno, { r: 0.8 }));
    f.position.set(0, 1.05, z);
    libreria.add(f);
  });
  for (let s = 0; s < 4; s++) {
    const ripiano = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 1.24), mat(C.legnoTop, { r: 0.7 }));
    ripiano.position.set(0, 0.28 + s * 0.55, 0);
    libreria.add(ripiano);
  }
  const libriN = isHigh ? 40 : 24;
  const libroGeo = new THREE.BoxGeometry(0.16, 0.4, 0.055);
  const libri = new THREE.InstancedMesh(libroGeo, mat(0xffffff, { r: 0.85 }), libriN);
  const libroCols = [0x7a2e1e, 0x3b5e4a, 0xb98a3e, 0x2a3b5e, 0x8a5a28, 0xc22a1e];
  {
    const d = new THREE.Object3D();
    const cc = new THREE.Color();
    for (let i = 0; i < libriN; i++) {
      const shelf = i % 3;
      const k = Math.floor(i / 3) % 8;
      d.position.set(0.02, 0.52 + shelf * 0.55, -0.5 + k * 0.135 + (pseudo(i * 7) - 0.5) * 0.02);
      d.rotation.z = (pseudo(i * 3) - 0.5) * 0.08;
      d.scale.set(1, 0.8 + pseudo(i * 5) * 0.4, 1);
      d.updateMatrix();
      libri.setMatrixAt(i, d.matrix);
      cc.setHex(libroCols[i % libroCols.length]);
      libri.setColorAt(i, cc);
    }
    libri.instanceMatrix.needsUpdate = true;
  }
  libreria.add(libri);
  // due albi in mostra sul ripiano alto, appoggiati alla parete
  [0, 1].forEach((i) => {
    const albo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.42),
      new THREE.MeshBasicMaterial({ map: makePosterTex(i + 4) })
    );
    albo.position.set(0.14, 1.93, -0.28 + i * 0.55);
    albo.rotation.y = Math.PI / 2;
    albo.rotation.x = -0.06;
    libreria.add(albo);
  });

  // -- LA PEDANA (parete destra, z -14..-18.5): rialzo di legno con
  //    ringhiera, scaletta, due tavoli con sgabelli e il filo di lucine.
  const pedana = new THREE.Group();
  pedana.position.set(4.1, 0, -16.2);
  root.add(pedana);
  const pianoP = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.34, 4.5), mat(C.legno, { r: 0.85 }));
  pianoP.position.y = 0.17;
  const pianoTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 4.5), mat(C.legnoTop, { r: 0.6 }));
  pianoTop.position.y = 0.365;
  pedana.add(pianoP, pianoTop);
  // scaletta di due gradini verso il corridoio
  [[0.12, 0.5], [0.26, 0.25]].forEach(([gy, gx]) => {
    const gradino = new THREE.Mesh(new THREE.BoxGeometry(0.42, gy * 2, 1.0), mat(C.legno, { r: 0.85 }));
    gradino.position.set(-1.1 - gx, gy, 1.4);
    pedana.add(gradino);
  });
  // ringhiera sul bordo verso la sala
  for (let k = 0; k < 4; k++) {
    const paletto = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.72, 8), mat(0x1a0f08, { r: 0.7 }));
    paletto.position.set(-1.06, 0.75, -1.9 + k * 1.15);
    pedana.add(paletto);
  }
  const corrimano = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 4.0), mat(C.legnoTop, { r: 0.5 }));
  corrimano.position.set(-1.06, 1.13, -0.2);
  pedana.add(corrimano);
  // due tavoli rotondi con sgabelli
  [[-0.15, -1.2], [0.35, 0.9]].forEach(([tx, tz]) => {
    const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 16), mat(C.legnoTop, { r: 0.5 }));
    tp.position.set(tx, 1.28, tz);
    const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 10), mat(0x1a0f08, { r: 0.8 }));
    tl.position.set(tx, 0.83, tz);
    pedana.add(tp, tl);
    for (let s = 0; s < 2; s++) {
      const sx = tx + (s ? 0.62 : -0.62);
      const ss = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12), mat(0x63301e, { r: 0.6 }));
      ss.position.set(sx, 0.92, tz + (s ? 0.15 : -0.15));
      const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.52, 8), mat(0x1a0f08, { r: 0.8 }));
      sl.position.set(sx, 0.64, tz + (s ? 0.15 : -0.15));
      pedana.add(ss, sl);
    }
  });
  // filo di lucine tra due pali: l'angolo "da fuori" dentro il pub
  const paloA = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.3, 8), mat(0x1a0f08, { r: 0.8 }));
  paloA.position.set(-0.85, 1.5, -2.1);
  const paloB = paloA.clone();
  paloB.position.set(-0.85, 1.5, 2.1);
  pedana.add(paloA, paloB);
  const lucineN = isHigh ? 13 : 9;
  for (let k = 0; k < lucineN; k++) {
    const t = k / (lucineN - 1);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd68a }));
    bulb.position.set(-0.85 + Math.sin(t * Math.PI) * 0.35, 2.62 - Math.sin(t * Math.PI) * 0.38, -2.1 + t * 4.2);
    pedana.add(bulb);
  }

  // -- CAPPELLI APPESI (ingresso, parete destra) + attaccapanni.
  function makeCappello(col) {
    const g = new THREE.Group();
    const falda = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 16), mat(col, { r: 0.8 }));
    const cupola = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(col, { r: 0.8 }));
    cupola.scale.y = 0.8;
    const nastro = new THREE.Mesh(new THREE.CylinderGeometry(0.107, 0.107, 0.035, 14, 1, true), mat(0x1a0f08, { r: 0.7 }));
    nastro.position.y = 0.02;
    g.add(falda, cupola, nastro);
    return g;
  }
  [[4.4, 0x6a4a26], [5.3, 0x3a2a1a], [6.2, 0x8a6a3a]].forEach(([z, col]) => {
    const gancio = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), mat(C.ottone, { r: 0.3, m: 0.8 }));
    gancio.rotation.z = Math.PI / 2;
    gancio.position.set(5.12, 2.25, z);
    root.add(gancio);
    const cap = makeCappello(col);
    cap.position.set(5.06, 2.25, z);
    cap.rotation.z = Math.PI / 2 - 0.15;
    root.add(cap);
  });
  // attaccapanni a colonna accanto alla porta, col cappello sopra
  const attacca = new THREE.Group();
  attacca.position.set(4.65, 0, 7.6);
  root.add(attacca);
  const atBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.04, 12), mat(0x1a0f08, { r: 0.8 }));
  atBase.position.y = 0.02;
  const atPalo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.8, 10), mat(0x1a0f08, { r: 0.8 }));
  atPalo.position.y = 0.9;
  attacca.add(atBase, atPalo);
  for (let k = 0; k < 3; k++) {
    const braccio = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 6), mat(C.ottone, { r: 0.3, m: 0.8 }));
    braccio.rotation.z = Math.PI / 2 - 0.35;
    braccio.rotation.y = (k / 3) * Math.PI * 2;
    braccio.position.y = 1.68;
    attacca.add(braccio);
  }
  const capSopra = makeCappello(0x5a3a20);
  capSopra.position.set(0.1, 1.82, 0.05);
  capSopra.rotation.z = -0.25;
  attacca.add(capSopra);

  // -- CIMELI D'EPOCA (parete destra, z -6..-9): mensola con telegrafo,
  //    radio a valvole e lanterna; sopra, l'orologio da stazione.
  const mensolaC = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 2.5), mat(C.legnoTop, { r: 0.6 }));
  mensolaC.position.set(5.0, 1.55, -7.5);
  root.add(mensolaC);
  // telegrafo: base di legno, tasto d'ottone con leva e pomello
  const telegrafo = new THREE.Group();
  telegrafo.position.set(5.0, 1.58, -6.6);
  root.add(telegrafo);
  const tgBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.18), mat(0x4a2c16, { r: 0.7 }));
  tgBase.position.y = 0.025;
  const tgSupporto = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.05), mat(C.ottone, { r: 0.25, m: 0.85 }));
  tgSupporto.position.set(-0.04, 0.08, 0);
  const tgLeva = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.014, 0.02), mat(C.ottone, { r: 0.25, m: 0.85 }));
  tgLeva.position.set(0.03, 0.105, 0);
  tgLeva.rotation.z = -0.1;
  const tgPomello = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat(0x1a0f08, { r: 0.5 }));
  tgPomello.position.set(0.11, 0.12, 0);
  const tgRocchetto = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10), mat(C.rame, { r: 0.4, m: 0.6 }));
  tgRocchetto.position.set(-0.08, 0.075, 0.05);
  telegrafo.add(tgBase, tgSupporto, tgLeva, tgPomello, tgRocchetto);
  telegrafo.rotation.y = -Math.PI / 2 + 0.2;
  // radio a valvole: mobile bombato, griglia del parlante, due manopole
  const radio = new THREE.Group();
  radio.position.set(5.0, 1.58, -7.55);
  root.add(radio);
  const rdCorpo = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.16), mat(0x4a2c16, { r: 0.6 }));
  rdCorpo.position.y = 0.13;
  const rdTop = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.36, 12, 1, false, 0, Math.PI), mat(0x4a2c16, { r: 0.6 }));
  rdTop.rotation.z = Math.PI / 2;
  rdTop.position.y = 0.26;
  const rdGriglia = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.14), mat(0xc9a86a, { r: 0.95 }));
  rdGriglia.position.set(-0.07, 0.15, 0.081);
  const rdQuadrante = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.06), mat(0xe8c890, { r: 0.6, e: 0x8a6020, ei: 0.6 }));
  rdQuadrante.position.set(0.09, 0.18, 0.081);
  radio.add(rdCorpo, rdTop, rdGriglia, rdQuadrante);
  [[0.05, 0.08], [0.13, 0.08]].forEach(([mx, my]) => {
    const manopola = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 10), mat(0x1a0f08, { r: 0.5 }));
    manopola.rotation.x = Math.PI / 2;
    manopola.position.set(mx, my, 0.085);
    radio.add(manopola);
  });
  radio.rotation.y = -Math.PI / 2;
  // lanterna a olio con fiammella
  const lanterna = new THREE.Group();
  lanterna.position.set(5.0, 1.58, -8.45);
  root.add(lanterna);
  const lnBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.04, 12), mat(0x2a2a2e, { r: 0.4, m: 0.6 }));
  lnBase.position.y = 0.02;
  const lnVetro = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.14, 12, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xf3ead6, roughness: 0.1, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })
  );
  lnVetro.position.y = 0.11;
  const lnCappello = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.065, 0.05, 12), mat(0x2a2a2e, { r: 0.4, m: 0.6 }));
  lnCappello.position.y = 0.2;
  const lnManico = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 12, Math.PI), mat(0x2a2a2e, { r: 0.4, m: 0.6 }));
  lnManico.position.y = 0.23;
  const lnFiamma = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffc06a }));
  lnFiamma.scale.y = 1.5;
  lnFiamma.position.y = 0.1;
  lanterna.add(lnBase, lnVetro, lnCappello, lnManico, lnFiamma);
  // orologio da stazione sopra la mensola
  const orologio = new THREE.Group();
  orologio.position.set(5.14, 2.85, -7.5);
  orologio.rotation.y = -Math.PI / 2;
  root.add(orologio);
  const orQuadrante = new THREE.Mesh(new THREE.CircleGeometry(0.34, 26), new THREE.MeshBasicMaterial({ map: makeClockFace() }));
  const orCornice = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.028, 8, 26), mat(C.ottone, { r: 0.3, m: 0.85 }));
  orologio.add(orQuadrante, orCornice);

  // -- FUMETTI D'EPOCA incorniciati: tre in fila all'ingresso (sinistra),
  //    uno sopra la pedana.
  function makeQuadro(seed, w = 0.58, h = 0.78) {
    const g = new THREE.Group();
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.035), mat(0x1a0f08, { r: 0.6 }));
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: makePosterTex(seed) }));
    tela.position.z = 0.02;
    g.add(cornice, tela);
    return g;
  }
  [[5.4, 0], [6.5, 1], [7.6, 2]].forEach(([z, seed]) => {
    const q = makeQuadro(seed);
    q.position.set(-5.12, 2.35, z);
    q.rotation.y = Math.PI / 2;
    root.add(q);
  });
  const quadroPedana = makeQuadro(3, 0.66, 0.88);
  quadroPedana.position.set(5.12, 2.5, -16.2);
  quadroPedana.rotation.y = -Math.PI / 2;
  root.add(quadroPedana);

  // -- BOTTI decorative e PIANTE: gli angoli non restano mai vuoti.
  [[4.55, 6.6], [4.75, 5.5]].forEach(([x, z], i) => {
    const botteD = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.8, 14), mat(C.legno, { r: 0.75 }));
    botteD.position.set(x, 0.4, z);
    root.add(botteD);
    [[0.25], [0.62]].forEach(([hy]) => {
      const cerchio = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.012, 6, 16), mat(0x2a2a2e, { r: 0.4, m: 0.7 }));
      cerchio.rotation.x = Math.PI / 2;
      cerchio.position.set(x, hy, z);
      root.add(cerchio);
    });
    if (i === 0) {
      // sulla prima botte, una candela accesa
      const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.12, 10), mat(0xe8dcc0, { r: 0.8 }));
      cand.position.set(x, 0.86, z);
      const fiam = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffc06a }));
      fiam.scale.y = 1.6;
      fiam.position.set(x, 0.95, z);
      root.add(cand, fiam);
    }
  });
  function makePianta(x, z, scala = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(scala);
    const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.26, 12), mat(0x7a2e1e, { r: 0.8 }));
    vaso.position.y = 0.13;
    g.add(vaso);
    for (let k = 0; k < 5; k++) {
      const foglia = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(k % 2 ? 0x2f5e30 : 0x3b6e3a, { r: 0.9 }));
      const a = k * 1.3;
      foglia.scale.set(0.7, 1.3, 0.7);
      foglia.position.set(Math.cos(a) * 0.1, 0.42 + pseudo(k * 7) * 0.18, Math.sin(a) * 0.1);
      foglia.rotation.z = Math.cos(a) * 0.5;
      foglia.rotation.x = Math.sin(a) * 0.5;
      g.add(foglia);
    }
    root.add(g);
  }
  makePianta(-4.75, 7.9, 1.15);
  makePianta(-4.6, -25.6, 1.0);
  makePianta(3.2, -13.6, 0.8);

  // -- IL FONDO: insegna "EST. 2018" e applique calde dietro il séparé,
  //    così l'ultimo sguardo del viaggio non finisce nel buio.
  const insegnaFondo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 0.75),
    new THREE.MeshBasicMaterial({ map: makeEstTex(), transparent: true })
  );
  insegnaFondo.position.set(0, 2.55, -33.42);
  root.add(insegnaFondo);
  [-1.9, 1.9].forEach((x) => {
    const applique = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffd68a }));
    applique.position.set(x, 2.25, -33.35);
    root.add(applique);
    const piattello = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), mat(C.ottone, { r: 0.3, m: 0.8 }));
    piattello.position.set(x, 2.25, -33.44);
    root.add(piattello);
  });
  const fondoLight = new THREE.PointLight(0xffb851, isHigh ? 7 : 5, 7, 2);
  fondoLight.position.set(0, 2.4, -32.2);
  scene.add(fondoLight);

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
    { p: [0.0, 2.35, 8.6], l: [0, 1.1, -10] },      // 0 soglia: TUTTO il locale in vista
    { p: [0.6, 1.65, 5.5], l: [-1.5, 1.6, 1] },     // 1 storia (entrando, verso sinistra)
    { p: [-1.8, 1.55, 1.7], l: [-3.35, 1.33, 0.45] }, // 2 bancone: vicino alle tre sotto le spine
    { p: [1.0, 1.8, -1.05], l: [2.6, 1.15, -3.0] }, // 3 cucina: i tre panini affiancati in quadro
    { p: [-2.2, 1.6, -6.85], l: [-4.35, 1.3, -8.75] }, // 4 friggitoria: i tre in voga sul bancone
    { p: [2.15, 1.6, -11.0], l: [4.35, 1.2, -12.75] }, // 5 banco dolci: i tre dolci da vicino
    { p: [-1.95, 1.45, -4.55], l: [-3.15, 1.28, -2.85] }, // 6 cocktail bar: ritorno al bancone, lato destro
    { p: [-0.4, 1.85, -17.4], l: [3.9, 1.3, -21.4] }, // 7 sala giochi: tutta l'area in quadro (bersaglio, arcade, barile, biliardino)
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
  let introActive = false; // si parte già dentro: locale intero in vista

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

    // micro-vita: bagliore lampade + leggerissimo bob
    lamps.forEach((L) => {
      const f = 0.9 + Math.sin(time * 2 + L.seed * 6) * 0.08;
      L.pl.intensity = (isHigh ? 14 : 9) * f;
    });
    camera.position.y += Math.sin(time * 0.8) * 0.01;

    // I tre in voga si aprono a mezz'aria: pilotati dalla pagina (setBurger)
    // quando la sezione Hamburger è al centro. Ogni stack levita e respira
    // con una fase propria, ma tutti in sincronia con lo scroll.
    const explode = burgerAmt * burgerAmt; // ease-in per uno stacco netto
    burgers.forEach((B) => {
      B.layers.forEach((L, i) => {
        // apertura compatta (0.75): gli strati restano leggibili in quadro
        L.m.position.y += (L.y + L.off * 0.75 * explode - L.m.position.y) * 0.12;
        L.m.rotation.y += i * 0.0015 * explode;
      });
      const bob = Math.sin(time * 1.2 + B.seed) * 0.02;
      B.grp.position.y += (1.11 + explode * (0.16 + bob) - B.grp.position.y) * 0.1;
      B.grp.rotation.y += 0.003 + explode * 0.015;
    });

    // Le tre si riempiono in sincronia: livello = spinaAmt, getto per ognuna.
    const level3 = 0.02 + spinaAmt * 0.24;
    const pouring3 = spinaAmt > 0.06 && spinaAmt < 0.985;
    trio.forEach((t3) => {
      t3.liq.scale.y += (Math.max(0.001, level3) - t3.liq.scale.y) * 0.1;
      t3.liq.position.y = t3.liq.scale.y / 2 + 0.01;
      const top3 = t3.liq.scale.y + 0.01;
      t3.foam.visible = spinaAmt > 0.12;
      t3.foam.position.y = top3 + 0.013;
      t3.jet.material.opacity += ((pouring3 ? 0.85 : 0) - t3.jet.material.opacity) * 0.12;
      t3.jet.visible = t3.jet.material.opacity > 0.02;
      if (t3.jet.visible) {
        const h3 = Math.max(0.03, 0.44 - top3);
        t3.jet.scale.y = h3;
        t3.jet.position.y = top3 + h3 / 2;
      }
    });

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
    // Il CRT sfarfalla sempre un po', di più quando la sezione è centrata;
    // il ventaglio di carte si apre e le pedine saltellano a turno.
    const flick = 0.78 + Math.sin(time * 9.3) * 0.06 + Math.sin(time * 23.7) * 0.04 + g * 0.16;
    arcScreenMat.color.setScalar(flick);
    arcScreenMat.map.offset.y = (time * 1.7) % 1 > 0.94 ? 0.03 * g : 0;
    cards.forEach((card, i) => {
      card.rotation.z += ((i - 2) * 0.3 * g - card.rotation.z) * 0.1;
    });
    meeples.forEach((mp) => {
      mp.position.y = mp.userData.baseY + Math.max(0, Math.sin(time * 2.2 + mp.userData.ph)) * 0.035 * g;
    });
    // Biliardino: le stecche ruotano a scatti e scorrono, la pallina rimbalza.
    bilAste.forEach((asta, i) => {
      asta.rotation.x = Math.sin(time * 2.6 + asta.userData.ph) * 0.8 * g;
      asta.position.z = Math.sin(time * 1.9 + asta.userData.ph * 2) * 0.05 * g;
      if (i === 2) asta.rotation.x += Math.max(0, Math.sin(time * 5)) * 1.2 * g; // il tiro
    });
    bilPalla.position.x = Math.sin(time * 2.2) * 0.42 * Math.max(0.05, g) + 0.05;
    bilPalla.position.z = Math.cos(time * 1.7) * 0.16 * g;

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
    const fA = zoneAmt.fritti;
    // I tre in voga sfrigolano appena usciti dal fritto: le patatine saltano
    // nella coppetta, i pezzi del tagliere ballonzolano a turno, l'anello in
    // cima alla pila si solleva e ondeggia.
    friggFries.forEach((f) => {
      f.position.y = f.userData.baseY + Math.max(0, Math.sin(time * 3 + f.userData.ph)) * 0.02 * fA;
    });
    friggItems.forEach((it) => {
      it.position.y = it.userData.baseY + Math.abs(Math.sin(time * 2.4 + it.userData.ph)) * 0.025 * fA;
      it.rotation.y += 0.004 * fA;
    });
    friggStack.forEach((r) => {
      if (r.userData.top) {
        r.position.y = r.userData.baseY + (0.05 + Math.sin(time * 1.6) * 0.02) * fA;
        r.rotation.x = Math.PI / 2 + Math.sin(time * 1.3) * 0.3 * fA;
        r.rotation.z = time * 0.5 * fA;
      }
    });

    // DOLCI: la pannacotta trema, il topping cambia colore ("chiedi il tuo"),
    // il Dolce del Giorno gira in vetrina, il cacao cade.
    const dA = zoneAmt.dessert;
    const wob = Math.sin(time * 5.5) * 0.05 * dA;
    pannaBody.scale.set(1 + wob, 1 - wob * 0.8, 1 + wob);
    {
      // topping in dissolvenza tra caramello, cioccolato e frutti rossi
      const stops = [0xc07018, 0x4a2410, 0xa01020];
      const k = (time * 0.12) % 3;
      const i0 = Math.floor(k);
      const f = k - i0;
      const a = new THREE.Color(stops[i0]);
      const b = new THREE.Color(stops[(i0 + 1) % 3]);
      toppingMat.color.copy(a).lerp(b, f);
      toppingMat.emissive.copy(toppingMat.color).multiplyScalar(0.4);
    }
    crepe.rotation.z = Math.sin(time * 1.1) * 0.04 * dA;
    dolceFetta.rotation.y = time * 0.5; // il dolce del giorno gira come in vetrina
    {
      const pos = cacao.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - dt * (0.25 + dA * 0.55);
        if (y < 0.05) y = 1.2;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      cacao.material.opacity = 0.25 + dA * 0.6;
    }

    // COCKTAIL BAR: i tre drink sul bancone si riempiono in sincronia con
    // lo scroll (come le birre); guarnizioni che ondeggiano, bollicine nel
    // prosecco dello Sbagliato quando il bicchiere è pieno.
    const bA = zoneAmt.bar;
    drinks.forEach((d) => {
      const u = d.liq.userData;
      const level = Math.max(0.001, (0.06 + bA * 0.94) * u.maxH);
      d.liq.scale.y += (level - d.liq.scale.y) * 0.1;
      d.liq.position.y = u.base + d.liq.scale.y / 2;
      if (d.garnish) d.garnish.rotation.y = Math.sin(time * 1.1 + d.seed) * 0.25 * bA;
      d.grp.rotation.y += 0.0018 * bA;
    });
    bolle.forEach((bl, i) => {
      const u = bl.userData;
      const lv = u.liq.scale.y;
      bl.visible = lv > 0.04 && bA > 0.1;
      if (bl.visible) {
        const k = (time * 0.35 + u.ph + i * 0.27) % 1;
        bl.position.y = u.liq.userData.base + k * lv;
        bl.scale.setScalar(0.6 + k * 0.7);
      }
    });


    renderer.render(scene, camera);
  }
  frame();

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = fovPer();
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

function makeArcadeScreen() {
  // Schermo CRT retro: file di "invasori" a pixel, colpi e navicella in basso.
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#070a16';
  ctx.fillRect(0, 0, 64, 64);
  const cols = ['#7ee08a', '#e8b04b', '#f4e9d0'];
  for (let row = 0; row < 3; row++) {
    ctx.fillStyle = cols[row];
    for (let k = 0; k < 5; k++) {
      const x = 6 + k * 11 + (row % 2 ? 2 : 0);
      const y = 8 + row * 9;
      ctx.fillRect(x, y, 7, 5);
      ctx.fillRect(x - 1, y + 1, 1, 2);
      ctx.fillRect(x + 7, y + 1, 1, 2);
    }
  }
  // colpi
  ctx.fillStyle = '#f4e9d0';
  ctx.fillRect(30, 38, 1, 5);
  ctx.fillRect(45, 42, 1, 5);
  // navicella del giocatore
  ctx.fillStyle = '#7ee08a';
  ctx.fillRect(27, 54, 9, 3);
  ctx.fillRect(30, 52, 3, 2);
  // scanline leggere
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = 0; y < 64; y += 2) ctx.fillRect(0, y, 64, 1);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeChecker() {
  // Scacchiera in palette per il tavolo dei giochi.
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const s = 8;
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#2a1d12' : '#d9cdb4';
      ctx.fillRect(x * s, y * s, s, s);
    }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

function makePosterTex(seed) {
  // Copertina di fumetto d'epoca: fondo pieno, retino a pallini, burst
  // diagonale, titolo urlato e una pinta-eroe al centro. Tutto in palette.
  const TITOLI = ['CAPITAN LUPPOLO', 'LA PINTA INFINITA', 'IL BARONE BREXIT', 'NOTTI AL BANCONE', 'ARKADIA COMICS', 'SFIDA AL BANCONE'];
  const BG = ['#7a2e1e', '#3b5e4a', '#b98a3e', '#2a3b5e', '#8a5a28', '#c22a1e'];
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = BG[seed % BG.length];
  ctx.fillRect(0, 0, 192, 256);
  // retino a pallini stile stampa anni '60
  ctx.fillStyle = 'rgba(14, 10, 7, 0.22)';
  for (let y = 0; y < 256; y += 12)
    for (let x = (y / 12) % 2 ? 6 : 0; x < 192; x += 12) {
      ctx.beginPath();
      ctx.arc(x, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  // burst dietro l'eroe
  ctx.fillStyle = 'rgba(244, 233, 208, 0.85)';
  ctx.beginPath();
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r = i % 2 ? 44 : 70;
    ctx.lineTo(96 + Math.cos(a) * r, 150 + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  // la pinta-eroe
  ctx.fillStyle = '#c77b29';
  ctx.fillRect(78, 128, 36, 46);
  ctx.fillStyle = '#f4e9d0';
  ctx.fillRect(74, 118, 44, 12);
  // testata e numero
  ctx.fillStyle = '#0e0a07';
  ctx.fillRect(0, 0, 192, 44);
  ctx.fillStyle = '#f4e9d0';
  ctx.font = '900 19px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(TITOLI[seed % TITOLI.length], 96, 29, 180);
  ctx.fillStyle = '#e8b04b';
  ctx.font = '700 13px Georgia, serif';
  ctx.fillText(`N.${(seed % 9) + 1} · 10¢`, 96, 60);
  ctx.font = 'italic 700 14px Georgia, serif';
  ctx.fillStyle = '#f4e9d0';
  ctx.fillText('ogni giovedì al pub', 96, 236);
  return new THREE.CanvasTexture(c);
}

function makeClockFace() {
  // Orologio da stazione: quadrante crema, numeri romani accennati,
  // lancette ferme sull'ora dell'aperitivo.
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#efe6cf';
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a1d12';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50);
    ctx.lineTo(64 + Math.cos(a) * 57, 64 + Math.sin(a) * 57);
    ctx.stroke();
  }
  // lancette sulle 19:00 — l'ora in cui si apre
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.lineTo(64 + Math.cos(Math.PI * 0.83) * 30, 64 + Math.sin(Math.PI * 0.83) * 30);
  ctx.stroke();
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.lineTo(64, 64 - 46);
  ctx.stroke();
  ctx.fillStyle = '#2a1d12';
  ctx.beginPath();
  ctx.arc(64, 64, 4.5, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function makeEstTex() {
  // Insegna sul fondo del locale: EST. 2018, oro su trasparente.
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 136;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 136);
  ctx.textAlign = 'center';
  ctx.shadowColor = '#e8b04b';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#e8c06a';
  ctx.font = '700 30px Georgia, serif';
  ctx.fillText('— ARKADIA —', 256, 44);
  ctx.font = 'italic 700 44px Georgia, serif';
  ctx.fillStyle = '#ffe6b0';
  ctx.fillText('EST. 2018', 256, 100);
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
