// Store minimale del progresso di scroll (0..1). Disaccoppia lo scroll HTML dalla scena R3F:
// la camera 3D "attraversa" il locale mentre il contenuto HTML scorre sopra. Robusto e leggero.
import { useEffect, useRef } from 'react';

const state = { progress: 0, listeners: new Set() };

function compute() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  state.progress = Math.min(1, Math.max(0, p));
  state.listeners.forEach((fn) => fn(state.progress));
}

let attached = false;
export function attachScroll() {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  window.addEventListener('scroll', compute, { passive: true });
  window.addEventListener('resize', compute);
  compute();
}

export function getProgress() { return state.progress; }

// Hook per componenti R3F: ref sempre aggiornato senza re-render di React.
export function useScrollRef() {
  const ref = useRef(0);
  useEffect(() => {
    const fn = (p) => { ref.current = p; };
    state.listeners.add(fn);
    attachScroll();
    return () => state.listeners.delete(fn);
  }, []);
  return ref;
}
