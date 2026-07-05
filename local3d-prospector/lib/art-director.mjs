// DIRETTORE ARTISTICO: dà a ogni locale una direzione visiva UNICA — niente palette/animazioni
// standard. Deterministico per attività (stesso locale → stessa direzione, riproducibile) ma diverso
// da locale a locale. Definisce: palette generata, coppia tipografica, motivo d'animazione di nicchia,
// stile camera, e il BRIEF per l'asset cinematografico (video/immagine AI) da usare nella rifinitura.

function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function hslHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return Math.round(255 * c).toString(16).padStart(2, '0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Coppie tipografiche premium (self-hosted in futuro; per ora fallback di sistema coerenti).
const TYPE_PAIRS = [
  { display: "'Fraunces', 'Playfair Display', serif", body: "'Inter', sans-serif" },
  { display: "'Anton', 'Archivo Black', sans-serif", body: "'Inter', sans-serif" },
  { display: "'Cormorant Garamond', 'Times New Roman', serif", body: "'Inter', sans-serif" },
  { display: "'Bebas Neue', 'Oswald', sans-serif", body: "'Inter', sans-serif" },
  { display: "'Space Grotesk', 'Helvetica Neue', sans-serif", body: "'Inter', sans-serif" },
];

// Firma per nicchia: motivo d'animazione + brief per il video/immagine cinematografica.
// Il `cinematic.prompt` è il testo che passeremo a Higgsfield nella fase di rifinitura (post-acconto).
const NICHE = {
  pub:        { motif: 'ingresso-nel-locale', camera: 'dolly-forward', hueBase: 32,  cinematic: 'cinematic slow push-in through a warm dim craft-beer pub interior, glowing taps, bokeh, film grain' },
  streetfood: { motif: 'griglia-e-braci',     camera: 'orbit-counter', hueBase: 12,  cinematic: 'cinematic close-up of sizzling street food on a hot griddle, embers, steam, shallow depth of field, appetizing' },
  ethnic:     { motif: 'lanterne-e-vapore',   camera: 'drift-through', hueBase: 320, cinematic: 'cinematic dolly through a moody ramen bar, paper lanterns, rising steam over bowls, neon reflections' },
  barber:     { motif: 'strumenti-fluttuanti', camera: 'reveal-chair', hueBase: 42,  cinematic: 'cinematic reveal of an elegant barbershop, rotating pole, warm mirror bulbs, slow motion' },
  realestate: { motif: 'drone-sopra-immobile', camera: 'aerial-parallax', hueBase: 210, cinematic: 'cinematic aerial drone shot over a luxury villa with infinity pool at golden hour, smooth flyover' },
  electronics:{ motif: 'esploso-componenti',   camera: 'exploded-view', hueBase: 200, cinematic: 'cinematic exploded view of a device disassembling into floating components, dark studio, rim light' },
  _default:   { motif: 'ingresso-nel-locale', camera: 'dolly-forward', hueBase: 260, cinematic: 'cinematic atmospheric hero for a premium local business, moody lighting, film grain' },
};

function nicheFor(template, category) {
  const c = (category || '').toLowerCase();
  // nicchie speciali riconosciute dalla categoria hanno la precedenza (brief cinematografico dedicato)
  if (/immobil|agenzia|casa|villa|appartament/.test(c)) return 'realestate';
  if (/elettron|tech|informatic|telefon|orolog|gioiell/.test(c)) return 'electronics';
  if (NICHE[template]) return template;
  return '_default';
}

export function deriveArtDirection(business) {
  const name = business?.identity?.name || business?.meta?.slug || 'x';
  const template = business?.meta?.template || 'pub';
  const category = business?.meta?.category || '';
  const seed = hash(name + '|' + category);
  const niche = nicheFor(template, category);
  const sig = NICHE[niche];

  // Palette generata attorno all'accento di nicchia, con variazione per attività (±40°).
  const hue = (sig.hueBase + ((seed % 80) - 40) + 360) % 360;
  const accentHue = (hue + (40 + (seed % 60))) % 360;   // colore complementare/analogo variabile
  const palette = {
    bg:      hslHex(hue, 30, 5 + (seed % 3)),
    surface: hslHex(hue, 26, 11 + (seed % 4)),
    primary: hslHex(hue, 70 + (seed % 15), 55),
    accent:  hslHex(accentHue, 78, 62),
    text:    hslHex(hue, 18, 96),
    muted:   hslHex(hue, 14, 62),
  };

  const type = TYPE_PAIRS[seed % TYPE_PAIRS.length];

  return {
    niche,
    palette,
    font_display: type.display,
    font_body: type.body,
    fx_intensity: 'high',
    motif: sig.motif,
    camera: sig.camera,
    cinematic: { prompt: sig.cinematic, aspect: '16:9', use_from: 'atelier' }, // generato solo dopo l'acconto (crediti)
  };
}

// Converte la direzione nel blocco `theme` che il sito consuma.
export function themeFromArtDirection(ad) {
  return { palette: ad.palette, font_display: ad.font_display, font_body: ad.font_body, fx_intensity: ad.fx_intensity };
}
