/**
 * ============================================================================
 *  ARKADIA — SCENA 3D "IL CALICE CHE SI VERSA"
 * ============================================================================
 *  Calice belga procedurale (LatheGeometry) + liquido ambrato con shader
 *  (gradiente ambra→oro + fresnel) che si riempie in base al progresso di
 *  scroll, schiuma in cima e bollicine (solo qualità alta).
 *
 *  API esposta:  initCalice(canvas, { quality }) -> { setFill, setPour, dispose }
 *    - setFill(p)  p in [0..1]  → livello del liquido + camera dolly
 *    - setPour(p)  p in [0..1]  → intensità del getto di mescita (atto "spina")
 * ============================================================================
 */
import * as THREE from 'three';

export function initCalice(canvas, { quality = 'high' } = {}) {
  const isHigh = quality === 'high';

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: isHigh,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isHigh ? 2 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 6.2);

  // --- Ambiente per i riflessi del vetro (gradiente caldo, leggero) ---
  const env = makeEnvironment(renderer);
  scene.environment = env;

  // --- Luci calde ---
  const key = new THREE.DirectionalLight(0xffe6b0, 2.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc77b29, 1.6);
  rim.position.set(-4, 1, -3);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x2a1c10, 1.2));

  // Alone dorato dietro il calice (Sprite: sempre rivolto alla camera → alone
  // morbido e circolare, niente artefatti di prospettiva).
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeRadialGlow(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.2,
    })
  );
  glow.scale.set(5, 5, 1);
  glow.position.set(0, 0.55, -3.6);
  scene.add(glow);

  // --- Gruppo calice ---
  const group = new THREE.Group();
  group.scale.setScalar(0.92);
  scene.add(group);

  // Framing: su desktop il calice sta a destra (colonna testo a sinistra),
  // su mobile è centrato dietro ai contenuti.
  let targetOffsetX = 0;
  function frameForViewport() {
    targetOffsetX = window.innerWidth > 820 ? 1.95 : 0;
  }
  frameForViewport();

  // Profilo del calice (x = raggio, y = altezza), stile goblet belga.
  const glassProfile = [
    [0.0, -1.7], [0.62, -1.7], [0.58, -1.62], [0.1, -1.5],
    [0.09, -0.6], [0.12, -0.35], [0.34, -0.05], [0.66, 0.35],
    [0.72, 0.7], [0.62, 1.05], [0.6, 1.28], [0.63, 1.32],
  ].map((p) => new THREE.Vector2(p[0], p[1]));

  const glassGeo = new THREE.LatheGeometry(glassProfile, isHigh ? 96 : 48);
  // Vetro trasparente (senza transmission) → mostra il liquido dentro in modo
  // prevedibile su ogni GPU (transmission non è supportata dai renderer software
  // e da alcune GPU integrate). depthWrite:false evita conflitti col liquido.
  const glassMat = isHigh
    ? new THREE.MeshPhysicalMaterial({
        color: 0xf3ead6,
        roughness: 0.08,
        metalness: 0,
        transparent: true,
        opacity: 0.24,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
        side: THREE.DoubleSide,
        envMapIntensity: 0.7,
        depthWrite: false,
      })
    : new THREE.MeshStandardMaterial({
        color: 0xede4d0,
        roughness: 0.14,
        metalness: 0.1,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        envMapIntensity: 1,
        depthWrite: false,
      });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  group.add(glass);

  // --- Liquido: profilo interno, si scala in verticale per riempirsi ---
  const innerProfile = [
    [0.0, -0.58], [0.1, -0.58], [0.11, -0.35], [0.32, -0.06],
    [0.63, 0.34], [0.69, 0.68], [0.59, 1.02],
  ].map((p) => new THREE.Vector2(p[0], p[1]));
  const liquidBottom = -0.58;
  const liquidTop = 1.02;
  const liquidHeight = liquidTop - liquidBottom;

  const liquidGeo = new THREE.LatheGeometry(innerProfile, isHigh ? 96 : 48);
  const liquidMat = new THREE.ShaderMaterial({
    uniforms: {
      uBottom: { value: new THREE.Color(0xd8912f) }, // oro ambrato (fondo)
      uTop: { value: new THREE.Color(0x8f4413) }, // ambra scura (pelo)
      uYmin: { value: liquidBottom },
      uYmax: { value: liquidTop },
    },
    vertexShader: `
      varying vec3 vN;
      varying vec3 vView;
      varying float vY;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        vY = position.y;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uBottom;
      uniform vec3 uTop;
      uniform float uYmin;
      uniform float uYmax;
      varying vec3 vN;
      varying vec3 vView;
      varying float vY;
      void main() {
        float t = clamp((vY - uYmin) / (uYmax - uYmin), 0.0, 1.0);
        vec3 col = mix(uBottom, uTop, t);
        // fresnel discreto: solo un accenno di riflesso caldo sui bordi
        float fres = pow(1.0 - max(dot(normalize(vN), normalize(vView)), 0.0), 3.0);
        col += fres * vec3(0.28, 0.18, 0.05);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    transparent: false,
    side: THREE.DoubleSide,
  });
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  // pivot alla base: riposiziono la geometria in modo che il fondo sia a y=0,
  // poi scalo il gruppo liquido dal fondo.
  const liquidPivot = new THREE.Group();
  liquid.position.y = -liquidBottom; // porta il fondo a 0 dentro il pivot
  liquidPivot.position.y = liquidBottom;
  liquidPivot.add(liquid);
  liquidPivot.scale.y = 0.001;
  group.add(liquidPivot);

  // --- Schiuma: testa sottile in cima al liquido (non una palla) ---
  const foam = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, isHigh ? 40 : 20, isHigh ? 20 : 10, 0, Math.PI * 2, 0, Math.PI / 2.2),
    new THREE.MeshStandardMaterial({
      color: 0xf4e9d0,
      roughness: 0.95,
      metalness: 0,
      emissive: 0x1a1510,
      emissiveIntensity: 0.2,
    })
  );
  foam.scale.set(0.62, 0.16, 0.62); // disco appiattito
  group.add(foam);

  // --- Bollicine (solo qualità alta) ---
  let bubbles = null;
  if (isHigh) {
    const COUNT = 90;
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = Math.random() * 0.5;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random();
      pos[i * 3 + 2] = Math.sin(a) * r;
      seed[i] = Math.random();
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    bg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const bm = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFill: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uFill;
        varying float vA;
        void main() {
          float rise = mod(position.y + uTime * (0.15 + aSeed * 0.2), 1.0);
          float h = -0.58 + rise * (1.02 - -0.58) * uFill;
          vec3 p = vec3(position.x, h, position.z);
          vA = (1.0 - rise) * uFill;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = min(9.0, (1.2 + aSeed * 1.6) * (14.0 / -mv.z));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vA;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          if (dot(c, c) > 0.25) discard;
          gl_FragColor = vec4(1.0, 0.92, 0.75, vA * 0.7);
        }
      `,
    });
    bubbles = new THREE.Points(bg, bm);
    group.add(bubbles);
  }

  // --- Getto di mescita (atto "spina") ---
  const pour = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.11, 2.2, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xe8b04b,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    })
  );
  pour.position.set(0, 2.1, 0);
  group.add(pour);

  // --- Stato & animazione ---
  let fill = 0;
  let pourAmt = 0;
  let raf = 0;
  let running = true;
  const clock = new THREE.Clock();

  function updateFill(p) {
    fill = clamp01(p);
    const eased = fill;
    liquidPivot.scale.y = Math.max(0.001, eased);
    liquidPivot.visible = fill > 0.012;
    const topY = liquidBottom + liquidHeight * eased;
    // La schiuma segue il pelo del liquido e si allarga leggermente col riempimento
    // (il bacino del calice è più largo in alto).
    const rim = 0.5 + eased * 0.22;
    foam.position.y = topY - 0.01;
    foam.visible = fill > 0.02;
    foam.scale.set(rim, 0.16, rim);
    if (bubbles) bubbles.material.uniforms.uFill.value = eased;

    // Posizione orizzontale (destra su desktop) con lerp morbido.
    group.position.x += (targetOffsetX - group.position.x) * 0.1;
    glow.position.x = group.position.x;
    const lookX = targetOffsetX * 0.45;

    // Camera dolly: parte lontana/alta, si avvicina mentre si riempie.
    const camZ = 6.4 - fill * 1.6;
    const camY = 0.8 - fill * 0.8;
    camera.position.z += (camZ - camera.position.z) * 0.08;
    camera.position.y += (camY - camera.position.y) * 0.08;
    camera.position.x += (lookX - camera.position.x) * 0.08;
    camera.lookAt(lookX, 0.1 + fill * 0.2, 0);
  }

  function updatePour(p) {
    pourAmt = clamp01(p);
  }

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    group.rotation.y += 0.0016;
    // micro-oscillazione del riempimento già gestita da updateFill (lerp camera)
    updateFill(fill);
    if (bubbles) bubbles.material.uniforms.uTime.value = t;
    // getto
    pour.material.opacity += (pourAmt * 0.85 - pour.material.opacity) * 0.1;
    pour.visible = pour.material.opacity > 0.01;
    pour.scale.y = 0.6 + pourAmt * 0.4;
    renderer.render(scene, camera);
  }
  frame();

  // --- Resize ---
  function onResize() {
    frameForViewport();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // --- Pausa quando off-screen (risparmio batteria) ---
  const io = new IntersectionObserver(
    (entries) => {
      running = entries[0].isIntersecting;
      if (running) {
        clock.getDelta();
        frame();
      } else {
        cancelAnimationFrame(raf);
      }
    },
    { threshold: 0 }
  );
  io.observe(canvas);

  return {
    setFill: (p) => updateFill(p),
    setPour: (p) => updatePour(p),
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      renderer.dispose();
      env.dispose();
    },
  };
}

/* ---------- helper ---------- */
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function makeEnvironment(renderer) {
  // Gradiente equirettangolare caldo → riflessi credibili sul vetro.
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#241a10');
  g.addColorStop(0.5, '#6b4a20');
  g.addColorStop(1, '#0e0a07');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose();
  pmrem.dispose();
  return rt.texture;
}

function makeRadialGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  g.addColorStop(0, 'rgba(232,176,75,0.6)');
  g.addColorStop(0.3, 'rgba(199,123,41,0.22)');
  g.addColorStop(0.6, 'rgba(199,123,41,0.06)');
  g.addColorStop(1, 'rgba(14,10,7,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
