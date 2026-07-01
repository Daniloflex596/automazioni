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

// Sul menu il calice è un elemento d'ingresso nell'hero (riempito e statico),
// non serve il riempimento legato allo scroll: la pagina è densa di contenuti.
const FILL_MENU = 0.82;

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
  document.querySelectorAll('[data-reveal], [data-split]').forEach((el) => io.observe(el));
}

/* Tab categoria attive durante lo scroll */
function initTabs() {
  const tabs = [...document.querySelectorAll('.tab')];
  const byId = new Map(tabs.map((t) => [t.dataset.tab, t]));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id.replace('cat-', '');
          tabs.forEach((t) => t.classList.remove('is-active'));
          byId.get(id)?.classList.add('is-active');
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
  function raf(time) {
    lenis.raf(time);
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
    const { initCalice } = await import('../three/calice3d.js');
    scene3d = initCalice(canvas, { quality: tier === 'high' ? 'high' : 'low' });
    driveFill(FILL_MENU);
    setPreload(0.95);
    requestAnimationFrame(hidePreloader);
  } catch (err) {
    console.warn('[Arkadia] 3D non disponibile su /menu, uso il fallback:', err);
    scene3d = null;
    canvas?.style.setProperty('display', 'none');
    fallback?.style.setProperty('display', 'block');
    driveFill(FILL_MENU);
    hidePreloader();
  }
}

window.addEventListener('load', () => setTimeout(hidePreloader, 1500));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
