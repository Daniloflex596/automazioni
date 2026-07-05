// Suggeritore di dominio: dal nome del locale a domini candidati che "rispecchiano il nome".
// La disponibilità reale si verifica via API del registrar (findAvailableDomain); in mock il primo
// candidato è considerato libero. Il dominio verrà intestato al CLIENTE (dati dall'onboarding).
import { slugify } from './util.mjs';

// parole da togliere per un dominio pulito
const STOP = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'da', 'di', 'del', 'della', 'dei',
  'ristorante', 'pizzeria', 'pub', 'bar', 'trattoria', 'osteria', 'braceria', 'birreria', 'the', 'e']);

function words(name) {
  return slugify(name).split('-').filter((w) => w && !STOP.has(w));
}

// Ritorna una lista ordinata di domini candidati (senza verificare la disponibilità).
export function suggestDomains(name, { city, tld = 'it' } = {}) {
  const w = words(name);
  const full = w.join('');                 // ilrederporchetta
  const dashed = w.join('-');              // il-re-porchetta (leggibile)
  const cityClean = city ? slugify(city).replace(/-/g, '') : '';
  const out = [];
  const push = (label) => { const d = `${label}.${tld}`; if (label && label.length >= 3 && !out.includes(d)) out.push(d); };

  push(full);                              // preferito: nome attaccato
  push(dashed);                            // variante leggibile con trattini
  if (cityClean) push(`${full}${cityClean}`);   // + città se il primo è occupato
  if (cityClean) push(`${full}-${cityClean}`);
  if (w.length > 1) push(w.slice(0, 2).join(''));   // versione corta (prime 2 parole)
  push(`${full}official`);
  // fallback su .com se .it non decolla
  out.push(`${full}.com`);
  return out;
}

// Verifica disponibilità e sceglie il primo libero. In mock: il primo candidato.
// In reale: interroga l'API del registrar (Gandi/OVH/Aruba) tramite l'adapter passato.
export async function findAvailableDomain(name, opts = {}, checkAvailability) {
  const candidates = suggestDomains(name, opts);
  if (!checkAvailability) return { domain: candidates[0], candidates, checked: false };
  for (const d of candidates) {
    try {
      if (await checkAvailability(d)) return { domain: d, candidates, checked: true };
    } catch { /* prova il prossimo */ }
  }
  return { domain: null, candidates, checked: true };
}
