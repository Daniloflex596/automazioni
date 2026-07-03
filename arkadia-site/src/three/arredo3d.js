/**
 * ============================================================================
 *  ARKADIA — ARREDO / SET DRESSING (feature isolata)
 * ============================================================================
 *  CONVENZIONE: le aggiunte "rischiose" o molto estese vivono in moduli
 *  separati con un'API minima, così modificarle o eliminarle non tocca il
 *  motore. Questo modulo contiene TUTTO l'arredo decorativo del pub:
 *  salotto in pelle, pedana coi tavoli e le lucine, cappelli, cimeli
 *  d'epoca, fumetti incorniciati, travi, botti, piante, lavagne, mappa
 *  del Belgio e insegna sul fondo.
 *
 *  API: addArredo({ root, scene, mat, C, isHigh }) -> { fiammelle }
 *  - non modifica nulla fuori da root/scene;
 *  - restituisce le fiammelle da far tremolare nel frame loop (o [] se
 *    l'arredo viene spento: il loop non se ne accorge).
 * ============================================================================
 */
import * as THREE from 'three';

export function addArredo({ root, scene, mat, C, isHigh }) {
  // ======================================================================
  //  SET DRESSING — l'arredo che rende vivo il pub. Tutto statico e fuori
  //  dal corridoio della camera (x tra -2.3 e 2.3): scenografia, non
  //  ostacoli. Zone: salotto in pelle · pedana rialzata coi tavoli ·
  //  cappelli appesi · cimeli d'epoca · fumetti incorniciati · travi ·
  //  botti e piante · insegna sul fondo.
  // ======================================================================

  const fiammelle = []; // lanterna + candele: tremolano nel frame loop

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
  fiammelle.push(lnFiamma);
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
      fiammelle.push(fiam);
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

  // -- LA MAPPA DEL BELGIO incorniciata sopra il bancone: la prova di
  //    "Abbiamo portato il Belgio a Ciampino".
  const mappa = new THREE.Group();
  mappa.position.set(-5.09, 3.3, 2.4); // sopra le mensole, accanto al neon
  mappa.rotation.y = Math.PI / 2;
  root.add(mappa);
  const mpCornice = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.72, 0.04), mat(0x1a0f08, { r: 0.6 }));
  const mpTela = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.64), new THREE.MeshBasicMaterial({ map: makeMappaTex() }));
  mpTela.position.z = 0.022;
  mappa.add(mpCornice, mpTela);

  // -- LAVAGNA A CAVALLETTO all'ingresso: "OGGI IN SPINA".
  const lavagna = new THREE.Group();
  lavagna.position.set(3.5, 0, 6.6); // entra in scena col primo scroll
  lavagna.rotation.y = -0.6;
  root.add(lavagna);
  const lvBoard = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.86, 0.04), mat(0x141a16, { r: 0.9 }));
  lvBoard.position.set(0, 0.75, 0);
  lvBoard.rotation.x = -0.12;
  const lvTesto = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.76), new THREE.MeshBasicMaterial({ map: makeChalkTex() }));
  lvTesto.position.set(0, 0.75, 0.025);
  lvTesto.rotation.x = -0.12;
  const lvCorniceL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.15, 0.05), mat(C.legno, { r: 0.85 }));
  lvCorniceL.position.set(-0.3, 0.56, 0.06);
  lvCorniceL.rotation.x = -0.12;
  const lvCorniceR = lvCorniceL.clone();
  lvCorniceR.position.x = 0.3;
  const lvGambaL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.12, 0.05), mat(C.legno, { r: 0.85 }));
  lvGambaL.position.set(-0.3, 0.55, -0.22);
  lvGambaL.rotation.x = 0.28;
  const lvGambaR = lvGambaL.clone();
  lvGambaR.position.x = 0.3;
  lavagna.add(lvBoard, lvTesto, lvCorniceL, lvCorniceR, lvGambaL, lvGambaR);

  // -- LAVAGNETTA DEI PUNTEGGI accanto al bersaglio delle freccette.
  const punteggi = new THREE.Group();
  punteggi.position.set(5.13, 1.95, -19.1);
  punteggi.rotation.y = -Math.PI / 2;
  root.add(punteggi);
  const pgCornice = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.64, 0.035), mat(C.legno, { r: 0.8 }));
  const pgTela = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshBasicMaterial({ map: makeScoreTex() }));
  pgTela.position.z = 0.02;
  punteggi.add(pgCornice, pgTela);

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

  return { fiammelle };
}

/* ---------- helper ---------- */
function pseudo(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
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

function makeMappaTex() {
  // Mappa d'epoca del Belgio: carta invecchiata, sagoma dorata, stella su
  // Bruxelles e rotta tratteggiata che scende verso Ciampino.
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d9c9a4';
  ctx.fillRect(0, 0, 256, 192);
  ctx.strokeStyle = 'rgba(90, 60, 30, 0.35)';
  for (let k = 0; k < 6; k++) {
    ctx.strokeRect(6 + k * 2, 6 + k * 2, 244 - k * 4, 180 - k * 4);
    if (k > 0) break;
  }
  // sagoma del Belgio (stilizzata)
  ctx.fillStyle = '#b98a3e';
  ctx.beginPath();
  ctx.moveTo(70, 60);
  ctx.lineTo(110, 44);
  ctx.lineTo(150, 52);
  ctx.lineTo(178, 74);
  ctx.lineTo(170, 100);
  ctx.lineTo(140, 116);
  ctx.lineTo(104, 110);
  ctx.lineTo(78, 88);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a3c1e';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // stella su Bruxelles
  ctx.fillStyle = '#7a2e1e';
  ctx.font = '900 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('★', 124, 88);
  // rotta tratteggiata verso sud (Ciampino)
  ctx.strokeStyle = '#7a2e1e';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(124, 92);
  ctx.quadraticCurveTo(150, 140, 208, 162);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '700 13px Georgia, serif';
  ctx.fillText('BELGIQUE · BELGIË', 124, 34);
  ctx.font = 'italic 700 12px Georgia, serif';
  ctx.fillText('→ Ciampino', 205, 178);
  return new THREE.CanvasTexture(c);
}

function makeChalkTex() {
  // Lavagna col gesso: cosa gira in spina stasera.
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 224;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#161d18';
  ctx.fillRect(0, 0, 160, 224);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '700 20px Georgia, serif';
  ctx.fillText('OGGI', 80, 38);
  ctx.fillText('IN SPINA', 80, 62);
  ctx.strokeStyle = 'rgba(232, 220, 192, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(28, 76);
  ctx.lineTo(132, 76);
  ctx.stroke();
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillText('Bionda', 80, 106);
  ctx.fillText('Rossa', 80, 134);
  ctx.fillText('IPA', 80, 162);
  ctx.fillStyle = '#e8b04b';
  ctx.font = 'italic 700 15px Georgia, serif';
  ctx.fillText('+ la sorpresa', 80, 196);
  ctx.fillText('del mese ✶', 80, 214);
  return new THREE.CanvasTexture(c);
}

function makeScoreTex() {
  // Lavagnetta dei punteggi delle freccette: NOI contro VOI.
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 168;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#161d18';
  ctx.fillRect(0, 0, 128, 168);
  ctx.strokeStyle = 'rgba(232, 220, 192, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(64, 14);
  ctx.lineTo(64, 154);
  ctx.moveTo(14, 44);
  ctx.lineTo(114, 44);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '700 15px Georgia, serif';
  ctx.fillText('NOI', 38, 32);
  ctx.fillText('VOI', 92, 32);
  ctx.font = 'italic 16px Georgia, serif';
  ['301', '260', '180'].forEach((n, i) => ctx.fillText(n, 38, 72 + i * 28));
  ['301', '281', '245'].forEach((n, i) => ctx.fillText(n, 92, 72 + i * 28));
  ctx.fillStyle = '#e8b04b';
  ctx.font = '700 12px Georgia, serif';
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

