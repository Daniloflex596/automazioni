#!/usr/bin/env node
// APPLY-CHANGES: la "1 modifica gratis" del funnel. Legge le richieste dal form "vorrei cambiare
// qualcosa", le traduce in operazioni VINCOLATE (tono/palette/ordine sezioni), rigenera il sito,
// lo ri-verifica con la stessa QA, e prepara il nuovo link. Ciò che non è mappabile va in coda umana.
//
// Richieste: in reale dal Worker (GET /admin/requests); in mock da mock/modify-requests.json.
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { paths, readJSON, writeJSON, logger } from '../lib/util.mjs';
import { load, save, all, upsert } from '../lib/registry.mjs';
import { parseChangeRequest, applyOps } from '../lib/changes.mjs';
import { validateBusiness } from '../lib/validate.mjs';
import { injectSite } from '../lib/render.mjs';

function loadRequests() {
  const p = join(paths.mock, 'modify-requests.json');
  if (existsSync(p)) return readJSON(p);
  return [];
}

export async function runApplyChanges() {
  const reg = load();
  const requests = loadRequests().filter((r) => r.status !== 'done');
  if (!requests.length) { logger.info('APPLY-CHANGES: nessuna richiesta di modifica'); return { applied: 0, queued: 0 }; }
  logger.step(`APPLY-CHANGES: ${requests.length} richieste`);

  const humanQueue = readJSON(join(paths.outbox, 'modifiche-da-fare-a-mano.json'), { items: [] });
  let applied = 0, queued = 0;

  for (const req of requests) {
    const biz0 = findBiz(reg, req.place_id);
    if (!biz0) { logger.warn(`place_id sconosciuto: ${req.place_id}`); continue; }
    const site = biz0.site_dir && join(paths.root, biz0.site_dir);
    if (!site || !existsSync(join(site, 'business.json'))) { logger.warn(`sito non trovato per ${biz0.name}`); continue; }

    const biz = readJSON(join(site, 'business.json'));
    const { ops, unhandled } = parseChangeRequest(req.message);
    const { biz: newBiz, applied: applArr, flags } = safeApply(biz, ops);

    if (applArr.length) {
      injectSite(site, newBiz);
      upsert(reg, req.place_id, { last_change: { text: req.message, applied: applArr, flags, at: new Date().toISOString() }, needs_reverify: true });
      applied++;
      logger.ok(`✓ ${biz0.name}: ${applArr.join(', ')}${flags.length ? ' · flag: ' + flags.join(', ') : ''}`);
    }
    if (unhandled.length || flags.length) {
      humanQueue.items.push({ place_id: req.place_id, name: biz0.name, request: req.message, unhandled, flags, at: new Date().toISOString() });
      queued++;
    }
    req.status = 'done';
  }

  writeJSON(join(paths.outbox, 'modifiche-da-fare-a-mano.json'), humanQueue);
  save(reg);
  logger.ok(`APPLY-CHANGES: ${applied} applicate in automatico, ${queued} in coda umana. Rilancia 'verify' per riconfermare la QA.`);
  return { applied, queued };
}

function safeApply(biz, ops) {
  const res = applyOps(biz, ops);
  const { ok, errors } = validateBusiness(res.biz);
  if (!ok) { return { biz, applied: [], flags: ['modifica scartata: build non valido (' + errors.join('; ') + ')'] }; }
  return res;
}

function findBiz(reg, placeId) { return all(reg).find((b) => b.place_id === placeId); }

if (import.meta.url === `file://${process.argv[1]}`) {
  runApplyChanges().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
