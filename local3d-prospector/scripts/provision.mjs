#!/usr/bin/env node
// PROVISION: la CONSEGNA automatica. Prende i clienti 'pagato' e li porta 'live' eseguendo, in ordine
// e in modo idempotente, tutti i passaggi che prima facevi a mano:
//   1) rebuild del sito in modalità LIVE con le foto del cliente (dall'onboarding)
//   2) scelta del dominio che rispecchia il nome del locale (+ disponibilità)
//   3) registrazione dominio al registrar, INTESTATO AL CLIENTE
//   4) DNS + hostname + SSL su Cloudflare
//   5) deploy del sito
//   6) stato 'live'
//   7) messaggio di consegna (handoff)
//
// Ogni passo si salva in registry.fulfillment: se lo rilanci, riprende da dove era.
// In mock gira tutto con valori finti. In reale, le chiamate API vivono negli adapter (stub sotto),
// che si attivano quando ci sono le chiavi. Nessuna password per-cliente: i segreti stanno UNA volta
// nel backend, il cliente non riceve credenziali (modello "tutto gestito").
import { join } from 'node:path';
import { existsSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { paths, ensureDir, readJSON, writeJSON, demoToken, logger, isMock } from '../lib/util.mjs';
import { load, save, all, upsert } from '../lib/registry.mjs';
import { buildBusiness } from '../lib/build-business.mjs';
import { validateBusiness } from '../lib/validate.mjs';
import { details } from '../lib/places.mjs';
import { findAvailableDomain } from '../lib/domain.mjs';
import * as adapters from '../lib/providers.mjs';

const DIST = join(paths.template, 'dist');

// Recupera i dati di onboarding del cliente (in reale: dal Worker /requests; in mock: file).
function getOnboarding(placeId) {
  const p = join(paths.mock, 'onboarding.json');
  if (existsSync(p)) { const m = readJSON(p); if (m[placeId]) return m[placeId]; }
  return null;
}

async function provisionOne(reg, b) {
  const f = b.fulfillment || { steps: {} };
  const done = (s) => f.steps[s] === 'done';
  const mark = (s) => { f.steps[s] = 'done'; };

  const onboarding = getOnboarding(b.place_id);
  if (!onboarding || !(onboarding.photos || []).length) {
    upsert(reg, b.place_id, { fulfillment: f, blocked_reason: 'attesa onboarding: servono le foto del cliente per il LIVE' });
    logger.warn(`${b.name}: in attesa dell'onboarding (foto mancanti) — salto`);
    return false;
  }

  // 1) REBUILD LIVE (con foto del cliente) — la compliance LIVE è imposta dal validatore
  if (!done('build_live')) {
    const d = await details(b.place_id);
    const biz = buildBusiness(d, { matchedQuery: b.matched_query, template: b.template, score: b.score, build_mode: 'live', owner_id: 'danilo', onboarding });
    biz.cta.mode = 'live';
    const { ok, errors } = validateBusiness(biz);
    if (!ok) { upsert(reg, b.place_id, { last_error: 'live build non valido: ' + errors.join('; ') }); logger.error(`${b.name}: build LIVE non valido`, { errors }); return false; }
    const dir = join(paths.sites, b.slug + '-live');
    ensureDir(dir); cpSync(DIST, dir, { recursive: true });
    let html = readFileSync(join(dir, 'index.html'), 'utf8').replace('/*__BUSINESS_JSON__*/ null', JSON.stringify(biz));
    writeFileSync(join(dir, 'index.html'), html);
    writeJSON(join(dir, 'business.json'), biz);
    f.live_dir = `sites/${b.slug}-live`;
    mark('build_live'); logger.info(`  ✓ build LIVE con ${biz.gallery.length} foto cliente`);
  }

  // 2) DOMINIO che rispecchia il nome
  if (!done('domain_pick')) {
    const r = await findAvailableDomain(b.name, { city: b.zone }, adapters.checkDomainAvailability);
    if (!r.domain) { upsert(reg, b.place_id, { last_error: 'nessun dominio disponibile', fulfillment: f }); logger.error(`${b.name}: nessun dominio libero tra ${r.candidates.join(', ')}`); return false; }
    f.domain = r.domain; f.domain_candidates = r.candidates;
    mark('domain_pick'); logger.info(`  ✓ dominio scelto: ${f.domain}`);
  }

  // 3) REGISTRAZIONE dominio intestata al CLIENTE
  if (!done('domain_register')) {
    const order = await adapters.registerDomain(f.domain, {
      registrant: { name: onboarding.referente, phone: onboarding.telefono, email: b.contact_email, address: b.address, country: 'IT' },
    });
    f.registrar_order = order.id;
    mark('domain_register'); logger.info(`  ✓ dominio registrato (ordine ${order.id})`);
  }

  // 4) DNS + hostname + SSL su Cloudflare
  if (!done('dns_ssl')) {
    const host = await adapters.attachCustomHostname(f.domain, b.slug);
    f.cf_hostname_id = host.id; f.live_url = `https://${f.domain}`;
    mark('dns_ssl'); logger.info(`  ✓ DNS + SSL configurati per ${f.domain}`);
  }

  // 5) DEPLOY del sito live
  if (!done('deploy')) {
    const dep = await adapters.deploySite(f.live_dir, b.slug, f.domain);
    f.deployment = dep.id;
    mark('deploy'); logger.info(`  ✓ deploy fatto: ${f.live_url}`);
  }

  // 6) LIVE
  upsert(reg, b.place_id, { state: 'live', fulfillment: f, live_url: f.live_url, domain: f.domain, blocked_reason: null, last_error: null, live_at: new Date().toISOString() });

  // 7) HANDOFF: messaggio di consegna in coda (mai automatico l'invio WhatsApp)
  const handoff = `Ciao ${onboarding.referente}! Il tuo sito è online: ${f.live_url} 🎉 Collegalo alla scheda Google e sei operativo. Per qualsiasi modifica scrivimi qui. — Danilo`;
  const q = readJSON(join(paths.outbox, 'consegne.json'), { items: [] });
  q.items.push({ place_id: b.place_id, name: b.name, phone: onboarding.telefono, live_url: f.live_url, message: handoff, at: new Date().toISOString() });
  writeJSON(join(paths.outbox, 'consegne.json'), q);
  logger.ok(`🎉 ${b.name} LIVE → ${f.live_url} (handoff in coda)`);
  return true;
}

export async function runProvision() {
  if (!existsSync(DIST)) throw new Error('Bundle template mancante: cd site-template && npm run build');
  const reg = load();
  const todo = all(reg).filter((b) => ['pagato', 'provisioning'].includes(b.state));
  if (!todo.length) { logger.info('PROVISION: nessun cliente da consegnare'); return { live: 0 }; }
  logger.step(`PROVISION ${isMock() ? '(MOCK)' : '(LIVE)'}: ${todo.length} clienti`);
  let live = 0;
  for (const b of todo) {
    upsert(reg, b.place_id, { state: 'provisioning' }); save(reg);
    logger.info(`— ${b.name}`);
    if (await provisionOne(reg, load().businesses[b.place_id] ? { ...b, ...load().businesses[b.place_id] } : b)) live++;
    save(reg);
  }
  logger.ok(`PROVISION: ${live} siti portati LIVE`);
  return { live };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runProvision().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
