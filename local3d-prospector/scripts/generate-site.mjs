#!/usr/bin/env node
// GENERATE: da locale qualificato → business.json validato → sito statico (copia del bundle
// buildato + iniezione dati). Un solo build del template, N siti: qui si inietta solo il JSON.
import { join } from 'node:path';
import { existsSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { config } from '../lib/config.mjs';
import { details } from '../lib/places.mjs';
import { buildBusiness } from '../lib/build-business.mjs';
import { validateBusiness } from '../lib/validate.mjs';
import { draftWhatsApp } from '../lib/outreach.mjs';
import { load, save, all, upsert } from '../lib/registry.mjs';
import { paths, ensureDir, writeJSON, demoToken, logger } from '../lib/util.mjs';

const DIST = join(paths.template, 'dist');
const WORKER_BASE = process.env.WORKER_BASE_URL || 'https://api.local3d.example';

function injectSite(slug, biz) {
  const outDir = join(paths.sites, slug);
  ensureDir(outDir);
  cpSync(DIST, outDir, { recursive: true });
  const htmlPath = join(outDir, 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  const json = JSON.stringify(biz);
  html = html.replace('/*__BUSINESS_JSON__*/ null', json);
  // titolo reale + noindex già presente nel template
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${biz.identity.name} — Anteprima</title>`);
  writeFileSync(htmlPath, html);
  writeJSON(join(outDir, 'business.json'), biz);
  return outDir;
}

export async function runGenerate() {
  if (!existsSync(DIST)) {
    throw new Error(`Bundle del template non trovato in ${DIST}. Esegui: cd site-template && npm ci && npm run build`);
  }
  const cfg = config();
  const reg = load();
  const todo = all(reg).filter((b) => b.state === 'qualificato' && !b.site_dir).slice(0, cfg.limits.max_sites_generated_per_run);
  logger.step(`GENERATE: ${todo.length} siti da creare`);

  let created = 0;
  for (const b of todo) {
    const d = await details(b.place_id);
    if (!d) { logger.warn(`details mancanti per ${b.name}`); continue; }

    const biz = buildBusiness(d, { matchedQuery: b.matched_query, template: b.template, score: b.score, build_mode: 'demo', owner_id: 'danilo' });

    // token demo non indovinabile + wiring commerciale
    const token = demoToken();
    biz.cta.track_url = `${WORKER_BASE}/track`;
    biz.cta.checkout_url = `${WORKER_BASE}/buy/${token}`;
    const wa = draftWhatsApp(biz, `${WORKER_BASE}/d/${token}`);
    biz.cta.wa_link = wa.link || '';

    const { ok, errors } = validateBusiness(biz);
    if (!ok) {
      logger.error(`VALIDAZIONE FALLITA per ${b.name}: blocco generazione`, { errors });
      upsert(reg, b.place_id, { last_error: errors.join('; ') });
      continue;
    }

    const dir = injectSite(biz.meta.slug, biz);
    upsert(reg, b.place_id, {
      slug: biz.meta.slug,
      site_dir: dir.replace(paths.root + '/', ''),
      demo_token: token,
      demo_url: `${WORKER_BASE}/d/${token}`,
      site_generated_at: new Date().toISOString(),
      wa_link: biz.cta.wa_link,
    });
    created++;
    logger.ok(`Sito generato: ${biz.identity.name} → sites/${biz.meta.slug}`);
  }
  save(reg);
  logger.ok(`GENERATE completato: ${created} siti`);
  return { created };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runGenerate().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
