/**
 * ============================================================================
 *  ARKADIA — /menu · orchestratore della sottopagina menu
 * ============================================================================
 *  Riusa la scena 3D del calice (con fallback a 3 tier), lo smooth scroll
 *  Lenis, split-text/reveal via IntersectionObserver e gestisce le tab
 *  categoria "sticky" (evidenzia quella attiva durante lo scroll).
 * ============================================================================
 */
import Lenis from 'lenis';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Refresh o apertura diretta (anche via QR): riparti sempre dall'inizio della
// carta, mai dalla posizione di prima. I deep-link con #sezione (dalla home)
// restano onorati più sotto, quando Lenis è pronto.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) window.scrollTo(0, 0);

function detectTier() {
  if (reduced) return 'none';
  const conn = navigator.connection;
  if (conn && conn.saveData) return 'none';
  const gl =
    document.createElement('canvas').getContext('webgl2') ||
    document.createElement('canvas').getContext('webgl');
  if (!gl) return 'none';
  const mem = navigator.deviceMemory || 4;
  if (mem <= 2) return 'none';
  const mobile = matchMedia('(max-width: 820px)').matches || /Mobi|Android/i.test(navigator.userAgent);
  return mobile ? 'low' : 'high';
}

/* Preloader */
const preloader = document.getElementById('preloader');
const plFill = preloader?.querySelector('.pl-fill');
const plPct = document.getElementById('pl-pct');
let preloaderHidden = false;
function setPreload(p) {
  const v = Math.round(clamp01(p) * 100);
  if (plFill) plFill.style.height = v + '%';
  if (plPct) plPct.textContent = v + '%';
}
function hidePreloader() {
  if (preloaderHidden) return;
  preloaderHidden = true;
  setPreload(1);
  preloader?.classList.add('is-done');
  document.body.dataset.ready = 'true';
}

/* Calice (3D o fallback SVG) */
const canvas = document.getElementById('scena-canvas');
const fallback = document.getElementById('scena-fallback');
const fallbackFill = fallback?.querySelector('.fb-fill');
const fallbackFoam = fallback?.querySelector('.fb-foam');
let scene3d = null;
let pub = null; // scena pub condivisa con la home

// Route menu→stazioni del pub. Ogni sezione può avere una stazione fissa
// [id, st] oppure un TRATTO di percorso [id, stInizio, stFine]: la camera
// viaggia lentamente lungo quel tratto per tutta la sezione (le Birre fanno
// il giro del bancone: arrivo dall'ingresso → spine da vicino → sala).
const MROUTE = [
  ['cat-birre', 1.7, 2.2], ['cat-fritti', 4], ['cat-hamburger', 3],
  ['cat-dessert', 5], ['cat-da-bere', 6], ['cat-caffetteria', 6],
  // Cocktail: mini-travelling lungo la fila dei drink sul bancone — lo
  // sguardo scivola da Spritz a Negroni allo Sbagliato, uno per uno.
  ['cat-cocktail', 6, 6.09],
  ['cat-giochi', 7],
];
// FLUIDITÀ: geometria misurata una volta (al load e al resize), MAI nel raf —
// niente getBoundingClientRect o offsetTop per frame, niente reflow forzato.
const geoMid = new Map();
const geoTop = new Map();
let mpts = [];
// VIEWPORT STABILE: la barra degli indirizzi di Chrome mobile collassa al
// primo scroll cambiando innerHeight → cache aggiornata solo su resize veri
// (cambio larghezza o Δaltezza > 150px), così la camera non salta.
let vw = window.innerWidth;
let vh = window.innerHeight;
function aggiornaViewport() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w !== vw || Math.abs(h - vh) > 150) {
    vw = w;
    vh = h;
  }
}
function misura() {
  ['cat-birre', 'cat-fritti', 'cat-hamburger', 'cat-dessert', 'cat-da-bere', 'cat-caffetteria', 'cat-cocktail', 'cat-giochi'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      geoMid.set(id, el.offsetTop + el.offsetHeight / 2);
      geoTop.set(id, el.offsetTop);
    }
  });
  // DUE ancore per sezione (inizio e fine): la camera si FISSA (o viaggia
  // lungo il suo tratto) per TUTTA la sezione, e si sposta solo tra
  // una categoria e l'altra.
  mpts = [];
  MROUTE.forEach(([id, stA, stB]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.offsetTop;
    const h = el.offsetHeight;
    const margine = Math.min(h * 0.5, vh * 0.28);
    mpts.push({ y: top + margine, st: stA });
    mpts.push({ y: top + h - margine, st: stB ?? stA });
  });
  // ancore strettamente crescenti (sezioni corte o adiacenti)
  for (let i = 1; i < mpts.length; i++) {
    if (mpts[i].y <= mpts[i - 1].y) mpts[i].y = mpts[i - 1].y + 1;
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', misura);
else misura();
window.addEventListener('resize', () => {
  aggiornaViewport();
  misura();
}, { passive: true });
window.addEventListener('load', misura);

function proximity(id) {
  const mid = geoMid.get(id);
  if (mid === undefined) return 0;
  const c = mid - scrollY;
  return Math.max(0, 1 - Math.abs(c - vh / 2) / (vh * 0.85));
}
// Riempimento PERSISTENTE: 0→1 mentre la sezione entra in scena, poi resta
// pieno per tutta la sezione e oltre; si svuota solo risalendo sopra.
// (Le spine non si svuotano mai a metà lista: una volta versata, è versata.)
function fillOnce(id) {
  const top = geoTop.get(id);
  if (top === undefined) return 0;
  return clamp01((scrollY + vh * 0.6 - top) / (vh * 0.75));
}
function menuT() {
  const mid = scrollY + vh / 2;
  if (!mpts.length) return 0;
  if (mid <= mpts[0].y) return (mpts[0].st / 9) * Math.max(0, mid / mpts[0].y);
  for (let i = 0; i < mpts.length - 1; i++) {
    if (mid <= mpts[i + 1].y) {
      const f = (mid - mpts[i].y) / (mpts[i + 1].y - mpts[i].y);
      return (mpts[i].st + (mpts[i + 1].st - mpts[i].st) * f) / 9;
    }
  }
  return mpts[mpts.length - 1].st / 9;
}
function drivePub() {
  if (!pub) return;
  pub.setProgress(menuT());
  pub.setSpina?.(fillOnce('cat-birre'));
  pub.setBurger?.(proximity('cat-hamburger'));
  pub.setZone?.('cucina', proximity('cat-hamburger'));
  pub.setZone?.('fritti', proximity('cat-fritti'));
  pub.setZone?.('dessert', proximity('cat-dessert'));
  pub.setZone?.('bar', fillOnce('cat-da-bere'));
  pub.setGiochi?.(proximity('cat-giochi'));
}

function driveFill(p) {
  const f = clamp01(p);
  if (scene3d) {
    scene3d.setFill(f);
  } else if (fallbackFill) {
    const H = 150;
    const topY = 210 - H * f;
    fallbackFill.setAttribute('y', String(topY));
    fallbackFill.setAttribute('height', String(H * f));
    if (fallbackFoam) {
      fallbackFoam.setAttribute('cy', String(topY));
      fallbackFoam.style.opacity = f > 0.02 ? '1' : '0';
    }
  }
}

// Sul menu il calice è un elemento d'ingresso nell'hero: all'arrivo viene
// VERSATO (0 → 0.82 con easing), poi resta pieno. Piccolo rito di benvenuto.
const FILL_MENU = 0.82;
function pourIn(durationMs = 1800) {
  if (reduced) {
    driveFill(FILL_MENU);
    return;
  }
  const t0 = performance.now();
  (function step(now) {
    const k = Math.min(1, (now - t0) / durationMs);
    const eased = 1 - Math.pow(1 - k, 3); // easeOutCubic: versata decisa, chiusura dolce
    driveFill(FILL_MENU * eased);
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

/* Split-text + reveal */
function splitText(el) {
  const lines = (el.textContent || '').split('\n');
  el.textContent = '';
  let idx = 0;
  lines.forEach((line) => {
    const block = document.createElement('span');
    block.style.display = 'block';
    const words = line.split(' ');
    words.forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'split-line';
      const inner = document.createElement('span');
      inner.className = 'split-inner';
      inner.style.transitionDelay = idx * 0.04 + 's';
      inner.textContent = word;
      outer.appendChild(inner);
      block.appendChild(outer);
      if (i < words.length - 1) block.appendChild(document.createTextNode(' '));
      idx++;
    });
    el.appendChild(block);
  });
}

function initReveals() {
  if (!reduced) document.querySelectorAll('[data-split]').forEach(splitText);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  document.querySelectorAll('[data-reveal], [data-split], [data-stagger]').forEach((el) => io.observe(el));
}

/* Tab categoria attive durante lo scroll */
function initTabs() {
  const tabs = [...document.querySelectorAll('.tab')];
  const byId = new Map(tabs.map((t) => [t.dataset.tab, t]));
  const bar = document.getElementById('tabs');
  const row = document.querySelector('.tabs-row');

  // Sfumature ai bordi della riga: visibili solo dal lato dove ci sono
  // altre categorie nascoste, così su mobile le pillole non si troncano
  // di netto contro il bordo dello schermo.
  function edges() {
    if (!bar || !row) return;
    bar.classList.toggle('at-start', row.scrollLeft < 8);
    bar.classList.toggle('at-end', row.scrollLeft > row.scrollWidth - row.clientWidth - 8);
  }
  row?.addEventListener('scroll', edges, { passive: true });
  window.addEventListener('resize', edges);
  edges();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id.replace('cat-', '');
          tabs.forEach((t) => t.classList.remove('is-active'));
          const t = byId.get(id);
          if (t) {
            t.classList.add('is-active');
            // Porta la pillola attiva al centro della riga (solo scroll
            // orizzontale della riga, mai della pagina).
            row?.scrollTo({
              left: t.offsetLeft - (row.clientWidth - t.offsetWidth) / 2,
              behavior: 'smooth',
            });
          }
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  document.querySelectorAll('section.cat').forEach((s) => io.observe(s));
}

/* Smooth scroll */
function initScroll() {
  if (reduced) return;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });

  // Posizione iniziale: se l'URL punta a una sezione (#cat-…, deep-link dalla
  // home) vacci tenendo conto della barra categorie sticky; altrimenti parti
  // dall'alto — così un refresh riporta sempre in cima alla carta.
  const initialHash = location.hash;
  if (initialHash && document.querySelector(initialHash)) {
    requestAnimationFrame(() => lenis.scrollTo(initialHash, { immediate: true, offset: -70 }));
  } else {
    lenis.scrollTo(0, { immediate: true });
  }

  // Progress "pinta": stessa firma della home, si riempie con lo scroll.
  // È anche un bottone: un click riporta in cima alla carta.
  const pp = document.createElement('button');
  pp.id = 'pinta-progress';
  pp.type = 'button';
  pp.setAttribute('aria-label', "Torna all'inizio");
  pp.title = "Torna all'inizio";
  pp.innerHTML = '<div class="pp-glass"><div class="pp-fill"></div><div class="pp-foam"></div></div>';
  document.body.appendChild(pp);
  pp.addEventListener('click', () => lenis.scrollTo(0, { duration: 1.7 }));
  const ppFill = pp.querySelector('.pp-fill');
  const ppFoam = pp.querySelector('.pp-foam');

  function raf(time) {
    lenis.raf(time);
    drivePub();
    const max = document.documentElement.scrollHeight - vh;
    const pct = Math.round((max > 0 ? window.scrollY / max : 0) * 100);
    ppFill.style.height = pct + '%';
    ppFoam.style.bottom = pct + '%';
    ppFoam.style.opacity = pct > 3 ? '0.95' : '0';
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id && id.length > 1) {
        const t = document.querySelector(id);
        if (t) {
          e.preventDefault();
          lenis.scrollTo(t, { offset: -70 });
        }
      }
    });
  });
}

async function boot() {
  setPreload(0.2);
  const tier = detectTier();
  initReveals();
  initTabs();
  initScroll();

  // Icone 3D per ogni voce del menu: UN renderer condiviso (icone3d.js).
  const icone = document.querySelectorAll('canvas.micona');
  if (icone.length && tier !== 'none') {
    import('../three/icone3d.js')
      .then(({ initIcone }) => initIcone(icone))
      .catch(() => icone.forEach((c) => c.style.setProperty('display', 'none')));
  } else {
    icone.forEach((c) => c.style.setProperty('display', 'none'));
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setPreload(0.5));
  else setPreload(0.5);

  if (tier === 'none') {
    canvas?.style.setProperty('display', 'none');
    fallback?.style.setProperty('display', 'block');
    driveFill(FILL_MENU);
    setPreload(0.9);
    requestAnimationFrame(hidePreloader);
    return;
  }

  fallback?.style.setProperty('display', 'none');
  try {
    setPreload(0.65);
    const { initPub } = await import('../three/pub3d.js');
    const scena = document.getElementById('scena');
    if (scena) {
      scena.style.position = 'fixed';
      scena.style.height = '100%';
    }
    pub = initPub(canvas, { quality: tier === 'high' ? 'high' : 'low' });
    drivePub();
    setPreload(0.95);
    requestAnimationFrame(hidePreloader);
  } catch (err) {
    console.warn('[Arkadia] 3D non disponibile su /menu, uso il fallback:', err);
    scene3d = null;
    canvas?.style.setProperty('display', 'none');
    fallback?.style.setProperty('display', 'block');
    pourIn();
    hidePreloader();
  }
}

window.addEventListener('load', () => setTimeout(hidePreloader, 1500));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
