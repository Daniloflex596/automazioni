#!/usr/bin/env node
// SCAN: scopre i candidati (discovery economica), applica i filtri hard, poi paga i details
// SOLO sulla shortlist, calcola lo score e aggiorna il registry.
import { config } from '../lib/config.mjs';
import { discover, details } from '../lib/places.mjs';
import { passesHardFilters, scoreCandidate, templateFor } from '../lib/score.mjs';
import { load, save, upsert, get } from '../lib/registry.mjs';
import { logger, isMock } from '../lib/util.mjs';

const QUALIFY_MIN_SCORE = 40;

export async function runScan() {
  const cfg = config();
  logger.step(`SCAN avviato ${isMock() ? '(MOCK)' : '(LIVE Google Places)'}`);
  const reg = load();

  const seen = new Set();
  const shortlist = [];
  let discovered = 0, rejected = 0;

  for (const zone of cfg.search.zones) {
    for (const query of cfg.search.queries) {
      let cands = [];
      try { cands = await discover(zone, query); } catch (e) { logger.error(e.message); continue; }
      for (const c of cands) {
        if (seen.has(c.place_id)) continue;
        seen.add(c.place_id);
        discovered++;
        const hard = passesHardFilters(c);
        if (!hard.pass) { rejected++; continue; }
        shortlist.push({ cand: c, matchedQuery: query, zone: zone.name });
      }
    }
  }

  logger.info(`Discovery: ${discovered} scoperti, ${rejected} scartati dai filtri hard, ${shortlist.length} in shortlist`);

  // Cap: non pagare details all'infinito in una singola run.
  const budget = shortlist.slice(0, cfg.limits.max_new_candidates_per_run);
  let qualified = 0;

  for (const item of budget) {
    // salta se già oltre 'qualificato' nel registry (idempotenza)
    const existing = get(reg, item.cand.place_id);
    if (existing && !['trovato', 'qualificato', 'scartato'].includes(existing.state)) continue;

    const d = await details(item.cand.place_id);
    if (!d) continue;
    const enriched = { ...item.cand, reviews: d.reviews || [] };
    const score = scoreCandidate(enriched, item.matchedQuery);
    const template = templateFor(item.matchedQuery);

    const state = score >= QUALIFY_MIN_SCORE ? 'qualificato' : 'trovato';
    if (state === 'qualificato') qualified++;

    upsert(reg, item.cand.place_id, {
      state,
      name: item.cand.name,
      zone: item.zone,
      matched_query: item.matchedQuery,
      template,
      score,
      rating: item.cand.rating,
      reviews_count: item.cand.reviews_count,
    });
  }

  save(reg);
  logger.ok(`SCAN completato: ${qualified} qualificati (score ≥ ${QUALIFY_MIN_SCORE}) su ${budget.length} valutati`);
  return { discovered, rejected, shortlisted: shortlist.length, qualified };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runScan().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
