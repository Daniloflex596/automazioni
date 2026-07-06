/**
 * ============================================================================
 *  canvas-textures.js — Texture ZERO-ASSET generate su <canvas> 2D
 * ============================================================================
 *  Modulo NEUTRO: nessun testo/tema fisso, tutto parametrico.
 *
 *  PERCHÉ texture procedurali invece di asset scaricati
 *  ---------------------------------------------------------------------------
 *  Environment map, insegne, targhe, etichette, gradienti, grana: tutto
 *  disegnato a runtime su un <canvas> 2D → CanvasTexture. Vantaggi concreti:
 *   - ZERO richieste di rete e ZERO peso nel bundle (niente .jpg/.png/.hdr da
 *     scaricare, ottimizzare, versionare, servire);
 *   - RIPRODUCIBILITÀ totale: l'ambiente si rigenera IDENTICO ad ogni build e
 *     ad ogni resume, perché il "caso" è deterministico (vedi pseudo() sotto);
 *   - nessun asset da gestire nel deploy.
 *  Il prezzo è uno stile "illustrato/stilizzato" invece che fotografico — di
 *  solito un vantaggio di coerenza artistica, non un limite. Per una IBL
 *  morbida basta davvero un gradiente 16×64 passato alla PMREM.
 *
 *  Import di three a livello di modulo, come il motore: così le firme restano
 *  pulite (makeEnvTexture(renderer), non makeEnvTexture(THREE, renderer)).
 * ============================================================================
 */
import * as THREE from 'three';

/**
 * pseudo(i): rumore DETERMINISTICO fract(sin(i · 12.9898) · 43758.5453).
 * ---------------------------------------------------------------------------
 * USA QUESTO al posto di Math.random per OGNI layout "casuale" (posizioni,
 * sparpagliamenti, rotazioni, semi, jitter di colore):
 *  - è riproducibile identico ad ogni build (niente "salta ogni volta");
 *  - è stabile al resume/re-run del codice (fondamentale in ambienti che
 *    rieseguono lo script: con Math.random il layout cambierebbe e i resume si
 *    romperebbero — in alcuni harness Math.random è addirittura BLOCCATO).
 * i = indice numerico; ritorna un valore in [0, 1).
 */
export function pseudo(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * makeEnvTexture(renderer): environment map dell'intera scena da un gradiente.
 * ---------------------------------------------------------------------------
 * Un canvas 16×64 con un gradiente verticale → CanvasTexture in mapping
 * equirettangolare → la PMREM lo trasforma in una IBL morbida che dà riflessi e
 * luce d'ambiente coerenti a TUTTI i materiali standard/physical.
 * Assegna il risultato a `scene.environment`. Ricordati di chiamare
 * `.dispose()` sulla texture quando smonti la scena.
 *
 * `stops` = le tre color-stop del gradiente (in alto / a metà / in basso):
 * cambiale per intonare l'ambiente al TUO tema. Default: caldo scuro neutro.
 */
export function makeEnvTexture(renderer, stops = ['#2a2a30', '#4a4a52', '#0e0e12']) {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, stops[0]);
  grad.addColorStop(0.5, stops[1]);
  grad.addColorStop(1, stops[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 64);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromEquirectangular(tex);

  // La texture-sorgente e il generatore servivano solo a produrre la env map:
  // liberali subito, tieni solo rt.texture (la mappa pre-filtrata da usare).
  tex.dispose();
  pmrem.dispose();
  return rt.texture;
}

/**
 * makeGradientTexture(stops, opts): gradiente lineare generico come
 * CanvasTexture. Comodo per scrim, fondali, cieli, sfumature dietro il testo.
 * `stops` = array di [posizione 0..1, colore].
 */
export function makeGradientTexture(stops, { w = 16, h = 256, horizontal = false } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const grad = horizontal
    ? ctx.createLinearGradient(0, 0, w, 0)
    : ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach(([at, color]) => grad.addColorStop(at, color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  return new THREE.CanvasTexture(c);
}

/**
 * makeLabelTexture(text, opts): cartello/etichetta GENERICO su canvas 2D.
 * ---------------------------------------------------------------------------
 * Testo su un velo, con bordo e alone. Usalo per insegne, targhe, numeri,
 * prezzi, nomi di stazione — qualunque testo che deve vivere DENTRO la scena 3D
 * (mappato su un piano). Completamente NEUTRO: passi tu testo e colori, così si
 * adatta alla nicchia del cliente senza portarsi dietro alcun tema.
 *
 * opts:
 *  - w, h   → dimensioni del canvas (px). Tienile potenze/multipli comodi.
 *  - bg     → colore di fondo del cartello (es. 'rgba(14,10,7,0.72)').
 *  - fg     → colore del testo (foreground / "inchiostro").
 *  - accent → colore del bordo e dell'alone (glow) attorno al testo.
 *  - font   → font CSS completo (peso/dimensione/famiglia).
 * Ritorna una CanvasTexture (mappala su un MeshBasicMaterial per un cartello
 * autoilluminato, o su uno Standard se vuoi che risenta della luce di scena).
 */
export function makeLabelTexture(text, {
  w = 512,
  h = 216,
  bg = 'rgba(18,18,22,0.72)',
  fg = '#f2f2f5',
  accent = '#8ab4ff',
  font = '700 92px Georgia, serif',
} = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Velo di fondo + cornice sottile nel colore d'accento.
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  // Testo centrato, con un alone morbido nel colore d'accento per staccarlo
  // dal fondo scuro della scena.
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = accent;
  ctx.shadowBlur = 22;
  ctx.fillStyle = fg;
  ctx.fillText(String(text), w / 2, h / 2);

  return new THREE.CanvasTexture(c);
}
