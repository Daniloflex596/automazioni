/**
 * ============================================================================
 *  scroll-timeline.js — mappa lo SCROLL del DOM sullo stato del mondo 3D
 * ============================================================================
 *  La camera e le sezioni HTML condividono LA STESSA timeline: quando una
 *  sezione e' al centro dello schermo, la camera e' nel punto giusto della
 *  scena. Testo e spazio si muovono insieme. Neutro: le sezioni sono elementi
 *  generici, le "station" indici astratti del percorso camera.
 *
 *  makeTimeline(sections) accetta un elenco di voci, ognuna in una di queste
 *  forme (mescolabili):
 *    { el, station }              una sezione ancorata al suo CENTRO
 *    { el, range: [stA, stB] }    una sezione con DUE ancore (inizio/fine):
 *                                 la camera si "posa" su stA..stB per tutta la
 *                                 sezione e trasla solo tra una sezione e l'altra
 *    [el, station]                forma compatta della prima
 *    [el, stA, stB]               forma compatta della seconda
 *  dove `el` puo' essere un HTMLElement gia' risolto oppure una stringa id.
 *
 *  Ritorna: { narrativeT, proximity, fillOnce, measure, dispose, viewport }.
 *
 *  --- NOTA: VIEWPORT STABILE (probe 100vh) ---------------------------------
 *  Su Chrome/Safari mobile la barra degli indirizzi COLLASSA al primo scroll e
 *  cambia window.innerHeight di ~60px di colpo. Se la coreografia e' calcolata
 *  su innerHeight, il mapping scroll→camera "salta" proprio all'ingresso. Qui
 *  un probe fisso alto 100vh misura l'altezza "grande" (barra ritirata) che NON
 *  cambia durante lo scroll; l'altezza in cache si aggiorna solo su cambi VERI
 *  (Δlarghezza, oppure Δaltezza > 150px = rotazione/finestra), non sul collasso
 *  barra. Abbina lato CSS: overflow-x: clip + overscroll-behavior, e hero in
 *  100lvh (non 100svh) cosi' al collasso barra non spunta la sezione sotto.
 *
 *  --- FLUIDITA': misura UNA volta sola --------------------------------------
 *  Le geometrie (offsetTop/offsetHeight) si misurano al load e al resize, MAI
 *  dentro il loop RAF: niente getBoundingClientRect per frame, niente reflow
 *  forzato → lo scroll resta liscio anche su mobile. Nel raf leggiamo solo
 *  window.scrollY (economico, non forza layout).
 * ============================================================================
 */

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
// smoothstep: raccordo con derivata nulla agli estremi. Applicato tra le ancore
// fa "posare" la camera sulle stazioni; sulla PRIMA tratta serve anche a far
// partire l'ingresso "in punta di piedi" (la tratta con meno corsa di scroll e
// piu' distanza 3D, che senza easing "spara" la camera dentro al primo swipe).
export const smoothstep = (f) => f * f * (3 - 2 * f);

function resolveEl(x) {
  if (!x) return null;
  if (typeof x === 'string') {
    return typeof document !== 'undefined' ? document.getElementById(x) : null;
  }
  return x; // gia' un HTMLElement
}

// Normalizza le varie forme di voce in { el, a, b } (a=b → ancora al centro).
function normalizeSection(s) {
  if (Array.isArray(s)) {
    const [el, a, b] = s;
    return { el: resolveEl(el), a, b: b ?? a };
  }
  if (s && s.range) {
    return { el: resolveEl(s.el), a: s.range[0], b: s.range[1] ?? s.range[0] };
  }
  return { el: resolveEl(s.el), a: s.station, b: s.station };
}

export function makeTimeline(sections, { lastStation } = {}) {
  const items = (sections || []).map(normalizeSection).filter((it) => it.el);

  // Ultima stazione = normalizzatore per portare narrativeT in [0,1].
  const maxSt = items.reduce((mx, it) => Math.max(mx, it.a, it.b), 0);
  const lastSt = (lastStation ?? maxSt) || 1;

  // --- Probe per il viewport stabile (vedi nota in testa) -------------------
  let probe = null;
  if (typeof document !== 'undefined') {
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:100vh;pointer-events:none;visibility:hidden';
    document.body.appendChild(probe);
  }
  const probeH = () =>
    (probe && probe.offsetHeight) ||
    (typeof window !== 'undefined' ? window.innerHeight : 0);

  // --- Cache: viewport + geometrie sezioni ----------------------------------
  let vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  let vh = probeH();
  const geoMid = new Map(); // el -> centro (offsetTop + offsetHeight/2)
  const geoTop = new Map(); // el -> offsetTop
  let anchors = [];         // [{ y, st }] strettamente crescente in y

  function refreshViewport() {
    const w = typeof window !== 'undefined' ? window.innerWidth : 0;
    const h = probeH();
    // Aggiorna solo su cambi VERI: ignora il collasso barra (Δh piccolo).
    if (w !== vw || Math.abs(h - vh) > 150) {
      vw = w;
      vh = h;
    }
  }

  function measure() {
    refreshViewport();
    geoMid.clear();
    geoTop.clear();
    anchors = [];
    items.forEach((it) => {
      const top = it.el.offsetTop;
      const h = it.el.offsetHeight;
      geoTop.set(it.el, top);
      geoMid.set(it.el, top + h / 2);
      if (it.a === it.b) {
        // Sezione ancorata al CENTRO (una sola stazione).
        anchors.push({ y: top + h / 2, st: it.a });
      } else {
        // DUE ancore: "hold" stretto agli estremi della sezione cosi' la camera
        // resta posata/travelling per TUTTA la sezione e non parte in anticipo.
        const m = Math.min(h * 0.5, vh * 0.28);
        anchors.push({ y: top + m, st: it.a });
        anchors.push({ y: top + h - m, st: it.b });
      }
    });
    anchors.sort((p, q) => p.y - q.y);
    // Ancore strettamente crescenti (sezioni corte o adiacenti che si toccano).
    for (let i = 1; i < anchors.length; i++) {
      if (anchors[i].y <= anchors[i - 1].y) anchors[i].y = anchors[i - 1].y + 1;
    }
  }

  /**
   * Progresso narrativo t ∈ [0,1] per il percorso camera. Interpola tra le
   * ancore con smoothstep (la camera si "posa" su ogni stazione), normalizzato
   * sull'ultima stazione.
   */
  function narrativeT() {
    if (!anchors.length) return 0;
    const mid = (typeof window !== 'undefined' ? window.scrollY : 0) + vh / 2;
    if (mid <= anchors[0].y) {
      // Prima dell'ingresso: sali dolcemente verso la prima ancora.
      return (anchors[0].st / lastSt) * Math.max(0, mid / (anchors[0].y || 1));
    }
    for (let i = 0; i < anchors.length - 1; i++) {
      if (mid <= anchors[i + 1].y) {
        const span = anchors[i + 1].y - anchors[i].y || 1;
        const f = smoothstep(clamp01((mid - anchors[i].y) / span));
        return (anchors[i].st + (anchors[i + 1].st - anchors[i].st) * f) / lastSt;
      }
    }
    return anchors[anchors.length - 1].st / lastSt;
  }

  /**
   * Prossimita' di una sezione al centro del viewport: 0 lontana → 1 centrata.
   * Pilota le micro-animazioni "che pulsano al centro" (respiro, apertura a
   * strati, brindisi). Accetta l'elemento o il suo id.
   */
  function proximity(el) {
    const node = resolveEl(el);
    const mid = node && geoMid.get(node);
    if (mid === undefined) return 0;
    const center = mid - (typeof window !== 'undefined' ? window.scrollY : 0);
    return Math.max(0, 1 - Math.abs(center - vh / 2) / (vh * 0.85));
  }

  /**
   * Riempimento PERSISTENTE: 0→1 all'ingresso della sezione, poi RESTA pieno;
   * si svuota solo risalendo sopra la sezione. Per barre/livelli che si
   * riempiono una volta e non devono "svuotarsi a meta' lista". Accetta
   * l'elemento o il suo id.
   */
  function fillOnce(el) {
    const node = resolveEl(el);
    const top = node && geoTop.get(node);
    if (top === undefined) return 0;
    const y = typeof window !== 'undefined' ? window.scrollY : 0;
    return clamp01((y + vh * 0.6 - top) / (vh * 0.75));
  }

  // --- Listener: ri-misura al resize e al load, mai nel raf ------------------
  const onResize = () => { refreshViewport(); measure(); };
  const onLoad = () => measure();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('load', onLoad);
  }
  measure();

  function dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onLoad);
    }
    if (probe) probe.remove();
    geoMid.clear();
    geoTop.clear();
    anchors = [];
  }

  return {
    narrativeT,
    proximity,
    fillOnce,
    measure,
    dispose,
    viewport: () => ({ vw, vh }), // altezza STABILE in cache (per il resize del renderer)
  };
}
