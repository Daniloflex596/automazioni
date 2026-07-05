// Theming-engine: da categoria+tono → design tokens (JSON, non codice).
// Palette curate a mano per "mood"; la scena 3D le riceve come props.
const MOODS = {
  street: {
    palette: { bg: '#0a0a0f', surface: '#15151f', primary: '#ff3d5a', accent: '#ffd23f', text: '#f5f5f7', muted: '#9a9aa8' },
    font_display: "'Anton', sans-serif", font_body: "'Inter', sans-serif", fx_intensity: 'high',
  },
  neon: {
    palette: { bg: '#05060d', surface: '#101426', primary: '#00e5ff', accent: '#ff2bd6', text: '#eefaff', muted: '#7d8bb0' },
    font_display: "'Bebas Neue', sans-serif", font_body: "'Inter', sans-serif", fx_intensity: 'high',
  },
  cozy: {
    palette: { bg: '#140f0a', surface: '#221913', primary: '#e08a3c', accent: '#f2c879', text: '#f7efe4', muted: '#b09a82' },
    font_display: "'Fraunces', serif", font_body: "'Inter', sans-serif", fx_intensity: 'medium',
  },
  elegant: {
    palette: { bg: '#0c0c0e', surface: '#17171b', primary: '#c9a24b', accent: '#e9d9a8', text: '#f4f2ee', muted: '#9c988e' },
    font_display: "'Cormorant Garamond', serif", font_body: "'Inter', sans-serif", fx_intensity: 'medium',
  },
  traditional: {
    palette: { bg: '#0e1110', surface: '#18201c', primary: '#3fae6a', accent: '#e2b13c', text: '#f2f5f1', muted: '#93a08f' },
    font_display: "'Playfair Display', serif", font_body: "'Inter', sans-serif", fx_intensity: 'medium',
  },
};

// Tono di default per template quando non specificato.
const TEMPLATE_DEFAULT_TONE = { pub: 'cozy', streetfood: 'street', ethnic: 'neon', barber: 'elegant' };

export function defaultToneFor(template) {
  return TEMPLATE_DEFAULT_TONE[template] || 'cozy';
}

export function deriveTheme(tone, override = {}) {
  const base = MOODS[tone] || MOODS.cozy;
  return {
    palette: { ...base.palette, ...(override.palette || {}) },
    font_display: override.font_display || base.font_display,
    font_body: override.font_body || base.font_body,
    fx_intensity: override.fx_intensity || base.fx_intensity,
  };
}

export const availableMoods = () => Object.keys(MOODS);
