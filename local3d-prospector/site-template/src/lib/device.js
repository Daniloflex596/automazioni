// Budget prestazioni: decide quanto 3D accendere. Un sito che scatta fa sembrare il locale rotto.
export function perfBudget() {
  if (typeof window === 'undefined') return { level: 'medium', mobile: false, webgl: true };
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const mobile = window.matchMedia('(max-width: 820px)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const webgl = hasWebGL();

  let level = 'high';
  if (!webgl || reduce) level = 'off';
  else if (mem <= 3 || cores <= 3) level = 'low';
  else if (mobile) level = 'medium';

  return { level, mobile, reduce, webgl };
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

// dprCap: limita il device pixel ratio per non uccidere le GPU mobili.
export function dprCap(level) {
  return level === 'high' ? [1, 2] : level === 'medium' ? [1, 1.5] : [1, 1];
}
