// Scoring: filtri hard (esclusione) + punteggio soft (ordinamento) da config.
import { config } from './config.mjs';

// Ritorna { pass:boolean, reason?:string } — i filtri hard.
export function passesHardFilters(cand) {
  const f = config().filters;
  if (f.exclude_if_has_website && cand.website) return { pass: false, reason: 'ha già un sito' };
  if ((cand.rating || 0) < f.min_rating) return { pass: false, reason: `rating ${cand.rating} < ${f.min_rating}` };
  if ((cand.reviews_count || 0) < f.min_reviews) return { pass: false, reason: `recensioni ${cand.reviews_count} < ${f.min_reviews}` };
  const name = (cand.name || '').toLowerCase();
  if (f.blacklist_name_keywords.some((k) => name.includes(k))) return { pass: false, reason: 'nome in blacklist' };
  if ((cand.types || []).some((t) => f.blacklist_types.includes(t))) return { pass: false, reason: 'tipo in blacklist' };
  return { pass: true };
}

// Punteggio 0-100 (clamp). matchedQuery = la query che l'ha trovato (per il peso categoria).
export function scoreCandidate(cand, matchedQuery) {
  const s = config().scoring;
  let pts = 0;

  const catW = s.category_weights[matchedQuery] ?? s.category_weights._default;
  pts += catW; // max ~10

  // recensioni: prende il bucket più alto raggiunto
  let reviewPts = 0;
  for (const b of s.reviews_buckets) if ((cand.reviews_count || 0) >= b.min) reviewPts = b.points;
  pts += reviewPts; // max ~35

  pts += s.price_level_points[String(cand.price_level ?? 2)] ?? 0; // max ~12

  // keyword calde nelle recensioni
  const texts = (cand.reviews || []).map((r) => (r.text?.text || r.text || '')).join(' ').toLowerCase();
  let hot = 0;
  for (const term of s.hot_keywords.terms) if (texts.includes(term)) hot += s.hot_keywords.points_each;
  pts += Math.min(hot, s.hot_keywords.max_points); // max ~15

  // rating bonus lineare oltre la soglia (max ~8)
  pts += Math.round(((cand.rating || 4) - 4) / 1 * 8);

  const total = Math.max(0, Math.min(100, Math.round(pts)));
  return total;
}

export function templateFor(matchedQuery) {
  const map = config().scoring.category_to_template;
  return map[matchedQuery] || map._default;
}
