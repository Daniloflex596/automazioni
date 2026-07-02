/**
 * ============================================================================
 *  ARKADIA — ORCHESTRATORE DELL'ESPERIENZA
 * ============================================================================
 *  - Feature-detection a 3 tier (high 3D / low 3D / no-3D fallback).
 *  - Lenis (smooth scroll) guidato da requestAnimationFrame.
 *  - Un unico "fill progress" (0→1) pilotato dallo scroll che riempie il
 *    calice (3D o fallback SVG) — la metafora: più scorri, più si riempie.
 *  - Split-text + reveal via IntersectionObserver + transizioni CSS.
 *
 *  NOTA (deviazione dal piano): niente GSAP/ScrollTrigger. Reveal e split
 *  sono gestiti con IntersectionObserver + CSS: più leggero (bundle ridotto),
 *  più robusto con Lenis e senza problemi di timing sopra la piega. Lo
 *  "scrubbing" scroll→3D è calcolato a mano, quindi ScrollTrigger non serve.
 * ============================================================================
 */
import Lenis from 'lenis';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------------
 * 1) Tier
 * ------------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------------
 * 2) Preloader
 * ------------------------------------------------------------------------- */
const preloader = document.getElementById('preloader');
const plFill = preloader?.querySelector('.pl-fill');
const plPct = document.getElementById('pl-pct');
function setPreload(p) {
  const v = Math.round(clamp01(p) * 100);
  if (plFill) plFill.style.height = v + '%';
  if (plPct) plPct.textContent = v + '%';
}
let preloaderHidden = false;
function hidePreloader() {
  if (preloaderHidden) return;
  preloaderHidden = true;
  setPreload(1);
  preloader?.classList.add('is-done');
  document.body.dataset.ready = 'true';
}

/* ---------------------------------------------------------------------------
 * 3) Riempimento del calice (target condiviso 3D / fallback)
 * ------------------------------------------------------------------------- */
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
function drivePour(p) {
  if (scene3d) scene3d.setPour(p);
}

/* ---------------------------------------------------------------------------
 * 4) Progresso dallo scroll
 * ------------------------------------------------------------------------- */
function updateProgress() {
  const brindisi = document.getElementById('brindisi');
  const spina = document.getElementById('spina');
  const vh = window.innerHeight;
  const y = window.scrollY;

  const fillEnd = Math.max(1, (brindisi?.offsetTop || vh * 4) - vh * 0.75);
  driveFill(y / fillEnd);

  if (spina) {
    const r = spina.getBoundingClientRect();
    const center = r.top + r.height / 2;
    const d = Math.abs(center - vh / 2) / (vh * 0.9);
    drivePour(clamp01(1 - d));
  }
}

/* ---------------------------------------------------------------------------
 * 5) Split-text + reveal (IntersectionObserver + CSS)
 * ------------------------------------------------------------------------- */
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
      // Lo spazio va TRA gli inline-block (nodo di testo normale), altrimenti
      // l'overflow:hidden lo taglierebbe e le parole si attaccherebbero.
      if (i < words.length - 1) block.appendChild(document.createTextNode(' '));
      idx++;
    });
    el.appendChild(block);
  });
}

function initReveals() {
  if (!reduced) {
    document.querySelectorAll('[data-split]').forEach(splitText);
  }
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

/* ---------------------------------------------------------------------------
 * 6) Smooth scroll (Lenis) + loop rAF
 * ------------------------------------------------------------------------- */
function initScroll() {
  if (reduced) {
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return;
  }
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  function raf(time) {
    lenis.raf(time);
    updateProgress();
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
}

/* ---------------------------------------------------------------------------
 * 7) Avvio
 * ------------------------------------------------------------------------- */
async function boot() {
  setPreload(0.15);
  const tier = detectTier();

  initReveals();
  initScroll();
  window.addEventListener('resize', updateProgress);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setPreload(0.5));
  } else {
    setPreload(0.5);
  }

  if (tier === 'none') {
    canvas?.style.setProperty('display', 'none');
    fallback?.style.setProperty('display', 'block');
    if (reduced) driveFill(1);
    setPreload(0.9);
    requestAnimationFrame(hidePreloader);
    return;
  }

  fallback?.style.setProperty('display', 'none');
  try {
    setPreload(0.65);
    const { initCalice } = await import('../three/calice3d.js');
    scene3d = initCalice(canvas, { quality: tier === 'high' ? 'high' : 'low' });
    setPreload(0.95);
    updateProgress();
    requestAnimationFrame(hidePreloader);
  } catch (err) {
    console.warn('[Arkadia] 3D non disponibile, uso il fallback:', err);
    scene3d = null;
    canvas?.style.setProperty('display', 'none');
    fallback?.style.setProperty('display', 'block');
    updateProgress();
    hidePreloader();
  }
}

// Sicurezza: non lasciare mai il preloader bloccato.
window.addEventListener('load', () => setTimeout(hidePreloader, 1500));

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
