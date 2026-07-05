import sample from './sample.js';

export function getBusiness() {
  const injected = typeof window !== 'undefined' ? window.__BUSINESS__ : null;
  return injected && injected.identity ? injected : sample;
}

// Applica i design tokens come CSS custom properties: un solo bundle, tema per cliente.
export function applyTheme(theme) {
  if (!theme || typeof document === 'undefined') return;
  const p = theme.palette || {};
  const r = document.documentElement.style;
  const set = (k, v) => v && r.setProperty(k, v);
  set('--bg', p.bg);
  set('--surface', p.surface);
  set('--primary', p.primary);
  set('--accent', p.accent);
  set('--text', p.text);
  set('--muted', p.muted);
  set('--font-display', theme.font_display);
  set('--font-body', theme.font_body);
}
