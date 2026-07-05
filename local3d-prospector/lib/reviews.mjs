// Mining deterministico delle recensioni: temi ricorrenti, piatti amati, claim.
// Niente LLM in produzione qui: keyword + frequenze → riproducibile e verificabile.
// (Un LLM può in futuro proporre candidati, ma l'output resta 'derived_from_reviews' e tracciabile.)

// Dizionario di piatti/prodotti tipici per categoria di template.
const DISH_LEXICON = {
  pub: ['birra', 'birra artigianale', 'hamburger', 'burger', 'patatine', 'nachos', 'alette di pollo', 'panino', 'fritto', 'ipa'],
  streetfood: ['porchetta', 'panino', 'supplì', 'trapizzino', 'hamburger', 'braciola', 'salsiccia', 'fritti', 'arrosticini', 'bombette'],
  ethnic: ['ramen', 'sushi', 'nigiri', 'sashimi', 'gyoza', 'ravioli', 'noodles', 'anatra', 'tempura', 'poke'],
  barber: ['taglio', 'barba', 'rasatura', 'sfumatura', 'trattamento', 'shampoo'],
};

const NEG = /(non |mai |niente |scortese|maleducat|sporco|pessim|deluso|delusa|caro|costos)/i;

function countOccurrences(texts, term) {
  const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
  let n = 0;
  for (const t of texts) {
    if (NEG.test(t)) continue; // salta recensioni chiaramente negative per non "amare" un difetto
    if (re.test(t)) n++;
  }
  return n;
}

export function mineReviews(reviewTexts, template) {
  const texts = (reviewTexts || []).map((r) => (typeof r === 'string' ? r : r.text || '')).filter(Boolean);
  const lexicon = DISH_LEXICON[template] || DISH_LEXICON.pub;

  // Conta le occorrenze e scarta i termini "contenuti" in uno più specifico già presente
  // (es. se c'è 'birra artigianale', togli 'birra' per non duplicare).
  let hits = lexicon
    .map((name) => ({ name, count: countOccurrences(texts, name) }))
    .filter((d) => d.count >= 2)
    .sort((a, b) => b.count - a.count);
  hits = hits.filter((h) => !hits.some((o) => o !== h && o.name.includes(h.name) && o.name !== h.name));

  const loved = hits.slice(0, 5).map((d) => ({ name: capitalize(d.name), source: 'derived_from_reviews' }));
  const themes = hits.slice(0, 4).map((t) => ({ label: capitalize(t.name), evidence_count: t.count, source: 'derived_from_reviews' }));

  // Testimonianze: estratti brevi, positivi, anonimizzati.
  const testimonials = texts
    .filter((t) => t.length > 30 && t.length < 220 && !NEG.test(t))
    .slice(0, 3)
    .map((t, i) => ({ text: cleanQuote(t), author: `Cliente ${['G.', 'M.', 'A.'][i] || 'R.'}`, source: 'derived_from_reviews' }));

  return { loved, themes, testimonials };
}

// Claim/hero derivato: se c'è un tema forte lo usa, altrimenti generico onesto.
export function deriveClaim(themes, category) {
  if (themes && themes.length) {
    return `${themes[0].label}, come si deve`;
  }
  return `Un ${category} che la gente del posto conosce bene`;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function cleanQuote(s) {
  let q = s.replace(/\s+/g, ' ').trim();
  if (q.length > 200) q = q.slice(0, 197) + '…';
  return q;
}
