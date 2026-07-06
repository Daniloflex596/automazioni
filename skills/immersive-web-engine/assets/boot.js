/**
 * ============================================================================
 *  boot.js — Sequenza di avvio: capability gate, import dinamico, pre-warm,
 *            fallback a cascata. Modulo NEUTRO e portabile.
 * ============================================================================
 *  Sono gli accorgimenti che rendono il PRIMISSIMO momento — quello che
 *  l'utente vede per primo — senza scatti e senza sprechi:
 *   - il motore pesante (three + scena) si scarica SOLO se il device se lo
 *     merita, tramite import() dinamico DENTRO loadEngine;
 *   - la GPU viene pre-riscaldata sotto il preloader, così il primo scroll è
 *     liscio;
 *   - qualunque errore degrada in silenzio al fallback leggero;
 *   - una guardia globale evita di inizializzare due volte scroll/reveal.
 *
 *  Export:
 *   - setupScrollRestoration() → al refresh riparti in cima
 *   - createPreloader(el)      → barra di avanzamento minimale
 *   - bootImmersive({...})      → l'orchestratore a cascata (la funzione chiave)
 *  (il pre-riscaldo GPU `prewarm` vive in render-loop.js, unica sede.)
 * ============================================================================
 */

/**
 * setupScrollRestoration(): al refresh riparti SEMPRE dall'alto (mai dalla
 * posizione di prima); il deep-link #sezione resta onorato solo alla PRIMA
 * navigazione, non ai reload. Ritorna { isReload } così l'orchestratore può
 * decidere se saltare al #hash.
 * Chiamala il prima possibile; mettine anche una copia INLINE nell'<head> per
 * battere il timing del browser:
 *   <script>if('scrollRestoration'in history)history.scrollRestoration='manual'</script>
 */
export function setupScrollRestoration() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const navEntry =
    performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  const isReload = navEntry ? navEntry.type === 'reload' : false;
  if (isReload || !location.hash) window.scrollTo(0, 0);
  return { isReload };
}

/**
 * createPreloader(el): preloader minimale a percentuale.
 * `el` è il contenitore; al suo interno un elemento [data-fill] (che cresce in
 * altezza) e uno [data-pct] (testo %). done() lo nasconde e marca body pronto.
 */
export function createPreloader(el) {
  const fill = el?.querySelector('[data-fill]');
  const pct = el?.querySelector('[data-pct]');
  let hidden = false;
  function setProgress(p) {
    const v = Math.round(Math.max(0, Math.min(1, p)) * 100);
    if (fill) fill.style.height = v + '%';
    if (pct) pct.textContent = v + '%';
  }
  function done() {
    if (hidden) return;
    hidden = true;
    setProgress(1);
    el?.classList.add('is-done');
    document.body.dataset.ready = 'true';
  }
  return { setProgress, done };
}

// NB: il PRE-RISCALDO GPU (prewarm) vive in render-loop.js, unica sede canonica:
// prewarm(renderer, scene, camera, applyCamera) — stessa convenzione di applyCamera
// del rig. bootImmersive qui sotto lo invoca tramite engine?.prewarm?.() sull'handle
// del motore, così non c'è una seconda definizione con firma diversa.

/**
 * bootImmersive({ canvas, tier, loadEngine, loadFallback, onProgress })
 * ---------------------------------------------------------------------------
 * Orchestrazione a CASCATA. È la funzione che collega capability → motore →
 * fallback, con pre-warm e degrado d'errore.
 *
 * Parametri:
 *  - canvas:       l'elemento <canvas> su cui girerà il motore.
 *  - tier:         'none' | 'low' | 'high' (da detectTier() in capability.js).
 *  - loadEngine:   async (canvas, tier) => engineHandle.
 *                  DEVE fare al suo interno l'import() DINAMICO del motore, così
 *                  three e la scena si scaricano SOLO ora, cioè solo su un device
 *                  che se li può permettere. Es:
 *                    const loadEngine = async (canvas, tier) => {
 *                      const { initWorld } = await import('./engine/world.js');
 *                      return initWorld(canvas, { tier });
 *                    };
 *                  L'handle può esporre prewarm()/dispose() (opzionali).
 *  - loadFallback: async () => fallbackHandle. Carica l'esperienza leggera
 *                  (2D/SVG/statica). DEVE rispettare la guardia __ENGINE_BOOTED__
 *                  (vedi sotto) per non creare un SECONDO scroll/reveal.
 *  - onProgress:   (0..1) => void. Callback per il preloader (facoltativa).
 *
 * Ritorna: { mode: 'engine' | 'fallback', handle, error? }.
 */
export async function bootImmersive({ canvas, tier, loadEngine, loadFallback, onProgress }) {
  const report = (p) => { try { onProgress?.(p); } catch { /* preloader non critico */ } };
  report(0.15);

  // TIER 'none': non toccare nemmeno il motore. Fallback leggero e stop —
  // qui NON alziamo la guardia, perché è il fallback stesso a possedere scroll.
  if (tier === 'none') {
    report(0.5);
    const handle = await loadFallback();
    report(1);
    return { mode: 'fallback', handle };
  }

  // GUARDIA ANTI DOPPIO-BOOT. Segnala che l'orchestratore principale (questo)
  // possiede già scroll + reveal/split-text. Serve al caso limite in cui il
  // motore fallisce DOPO che lo scroll è stato allestito: il fallback che
  // importiamo sotto NON deve creare un secondo motore di scroll né ri-splittare
  // i titoli — altrimenti jank + testo doppio. Il modulo di fallback controlla
  // `window.__ENGINE_BOOTED__` e, se true, salta il proprio setup di scroll/reveal.
  window.__ENGINE_BOOTED__ = true;

  try {
    report(0.35);
    // import() dinamico dentro loadEngine → il chunk pesante parte SOLO adesso.
    const engine = await loadEngine(canvas, tier);
    report(0.7);

    // PRE-WARM: compila shader e carica texture PRIMA di scoprire la scena.
    // Se l'handle espone prewarm() lo usiamo; altrimenti si presume che il
    // motore l'abbia già fatto internamente al momento dell'init.
    await engine?.prewarm?.();
    report(0.95);

    // Nascondi il preloader solo a scena pronta E pre-riscaldata: un rAF di
    // margine evita che il 100% appaia un frame prima del primo disegno reale.
    requestAnimationFrame(() => report(1));
    return { mode: 'engine', handle: engine };
  } catch (err) {
    // DEGRADO: qualunque errore del motore → fallback leggero, esperienza salva.
    // La guardia resta alzata: se lo scroll era già stato allestito prima di
    // bootImmersive, il fallback lo rispetta e non lo duplica.
    console.warn('[immersive] motore non disponibile, passo al fallback:', err);
    const handle = await loadFallback();
    report(1);
    return { mode: 'fallback', handle, error: err };
  }
}
