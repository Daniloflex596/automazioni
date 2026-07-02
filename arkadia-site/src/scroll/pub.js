/**
 * ============================================================================
 *  ARKADIA — HOME · orchestratore "dentro il pub"
 * ============================================================================
 *  Su dispositivi capaci: entra nel pub 3D (pub3d.js) e lo scroll fa percorrere
 *  la camera lungo il locale (on-rails), stazione per stazione, mentre i
 *  contenuti delle sezioni compaiono in overlay.
 *  Su dispositivi deboli / no-WebGL / reduced-motion / save-data: fallback
 *  all'esperienza scrollytelling col calice (experience.js).
 * ============================================================================
 */
import Lenis from 'lenis';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

const canvas = document.getElementById('scena-canvas');
const fallback = document.getElementById('scena-fallback');

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
      inner.style.transitionDelay = idx * 0.045 + 's';
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
  document.querySelectorAll('[data-reveal], [data-split]').forEach((el) => io.observe(el));
}

async function boot() {
  setPreload(0.15);
  const tier = detectTier();

  // Fallback: nessun pub 3D → l'esperienza col calice (gestisce anche il SVG).
  if (tier === 'none') {
    await import('./experience.js');
    return;
  }

  initReveals();
  fallback?.style.setProperty('display', 'none');
  document.body.classList.add('pub-mode');

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  let pub = null;

  // Prossimità di una sezione al centro del viewport (0 lontana → 1 centrata):
  // pilota le micro-scene 3D (burger, mescita, brindisi) dalla narrazione DOM.
  const sects = {
    tavola: document.getElementById('tavola'),
    spina: document.getElementById('spina'),
    brindisi: document.getElementById('brindisi'),
    giochi: document.getElementById('giochi'),
  };
  function proximity(el) {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const center = r.top + r.height / 2;
    const d = Math.abs(center - window.innerHeight / 2) / (window.innerHeight * 0.85);
    return Math.max(0, 1 - d);
  }

  // Progress "pinta" (indicatore scroll a bordo destro), iniettato via JS.
  const pp = document.createElement('div');
  pp.id = 'pinta-progress';
  pp.setAttribute('aria-hidden', 'true');
  pp.innerHTML = '<div class="pp-glass"><div class="pp-fill"></div><div class="pp-foam"></div></div>';
  document.body.appendChild(pp);
  const ppFill = pp.querySelector('.pp-fill');
  const ppFoam = pp.querySelector('.pp-foam');

  // Sincronizzazione narrativa camera↔sezioni: ogni sezione DOM ha la sua
  // stazione sul percorso (0..5). Il progresso è interpolato tra i CENTRI
  // delle sezioni, così la camera è sempre nel punto giusto della scena
  // quando quella sezione è al centro dello schermo.
  // 7 stazioni sul percorso (0..6): ogni sezione DOM ha la sua inquadratura.
  const LAST_ST = 6;
  const ROUTE = [
    ['soglia', 0], ['rifugio', 1], ['spina', 2], ['tavola', 3],
    ['luogo', 4], ['giochi', 5], ['brindisi', 6],
  ].map(([id, st]) => ({ el: document.getElementById(id), st }));

  function narrativeT() {
    const mid = window.scrollY + window.innerHeight / 2;
    const pts = ROUTE.filter((r) => r.el).map((r) => ({
      y: r.el.offsetTop + r.el.offsetHeight / 2,
      st: r.st,
    }));
    if (!pts.length) return 0;
    if (mid <= pts[0].y) return (pts[0].st / LAST_ST) * Math.max(0, mid / pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      if (mid <= pts[i + 1].y) {
        const f = (mid - pts[i].y) / (pts[i + 1].y - pts[i].y);
        return (pts[i].st + (pts[i + 1].st - pts[i].st) * f) / LAST_ST;
      }
    }
    return 1;
  }

  function raf(time) {
    lenis.raf(time);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const t = max > 0 ? window.scrollY / max : 0;
    if (pub) {
      pub.setProgress(narrativeT());
      // Hook diagnostico (solo con ?debug nell'URL, nessun costo altrimenti)
      if (location.search.includes('debug')) {
        window.__arkadia = { narrT: narrativeT(), ...pub.getT?.() };
      }
      pub.setBurger?.(proximity(sects.tavola));
      pub.setSpina?.(proximity(sects.spina));
      pub.setBrindisi?.(proximity(sects.brindisi));
      pub.setGiochi?.(proximity(sects.giochi));
    }
    // La pinta di progresso si riempie con lo scroll.
    const pct = Math.round(t * 100);
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
          lenis.scrollTo(t, { offset: 0 });
        }
      }
    });
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setPreload(0.5));
  else setPreload(0.5);

  try {
    setPreload(0.65);
    const { initPub } = await import('../three/pub3d.js');
    pub = initPub(canvas, { quality: tier === 'high' ? 'high' : 'low' });
    setPreload(0.95);
    // Blocca lo scroll durante la cinematica d'ingresso, poi lo sblocca.
    lenis.stop();
    const waitIntro = () => {
      if (pub.introRunning()) requestAnimationFrame(waitIntro);
      else lenis.start();
    };
    requestAnimationFrame(hidePreloader);
    requestAnimationFrame(waitIntro);
  } catch (err) {
    console.warn('[Arkadia] Pub 3D non disponibile, fallback al calice:', err);
    document.body.classList.remove('pub-mode');
    await import('./experience.js');
    hidePreloader();
  }
}

window.addEventListener('load', () => setTimeout(hidePreloader, 2000));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
