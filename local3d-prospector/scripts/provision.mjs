#!/usr/bin/env node
// PROVISION: la CONSEGNA automatica, in DUE FASI, così il cliente ha un link funzionante SUBITO dopo
// il pagamento e il dominio vero (a costo reale) solo dopo la finestra di garanzia.
//
//   FASE A — appena paga (istantanea, gratis, zero rischio):
//     sito LIVE su un SOTTODOMINIO (nomelocale.siti-tuo.it) in ~minuti, senza banner di vendita.
//     Serve foto? No: parte in modalità 'provisional'. Il cliente ha già il suo link che funziona.
//
//   FASE B — dopo la garanzia (es. 7 giorni) E ricevute le foto, se NON ha chiesto rimborso:
//     registra il DOMINIO VERO intestato al cliente (auto-renew ON = "per sempre"), ricostruisce il
//     sito con le sue foto, sposta tutto sul dominio giusto. Ora è il sito completo e definitivo.
//
// Perché così: il dominio .it costa ~€12 non rimborsabili. Comprarlo prima della fine della garanzia
// significherebbe perderli a ogni rimborso. Il sottodominio dà gratificazione immediata a rischio zero.
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { config } from '../lib/config.mjs';
import { paths, readJSON, writeJSON, logger, isMock } from '../lib/util.mjs';
import { load, save, all, upsert } from '../lib/registry.mjs';
import { buildBusiness } from '../lib/build-business.mjs';
import { validateBusiness } from '../lib/validate.mjs';
import { injectSite, DIST } from '../lib/render.mjs';
import { details } from '../lib/places.mjs';
import { findAvailableDomain } from '../lib/domain.mjs';
import * as adapters from '../lib/providers.mjs';

const SUBBASE = process.env.LIVE_SUBDOMAIN_BASE || 'siti.local3d.example';

function getOnboarding(placeId) {
  const p = join(paths.mock, 'onboarding.json');
  if (existsSync(p)) { const m = readJSON(p); if (m[placeId]) return m[placeId]; }
  return null;
}
function daysSince(iso) { return iso ? (Date.now() - Date.parse(iso)) / 86400000 : 0; }
function queueHandoff(name, phone, url, message, placeId) {
  const q = readJSON(join(paths.outbox, 'consegne.json'), { items: [] });
  q.items.push({ place_id: placeId, name, phone, live_url: url, message, at: new Date().toISOString() });
  writeJSON(join(paths.outbox, 'consegne.json'), q);
}

// Costruisce e "deploya" il sito live in una cartella + host. provisional = senza foto.
async function buildAndDeploy(b, { host, dirSuffix, provisional, onboarding }) {
  const d = await details(b.place_id);
  const biz = buildBusiness(d, { matchedQuery: b.matched_query, template: b.template, score: b.score, build_mode: 'live', provisional, owner_id: 'danilo', onboarding: provisional ? null : onboarding });
  biz.cta.mode = 'live'; // niente banner di vendita sul sito venduto
  const { ok, errors } = validateBusiness(biz);
  if (!ok) return { ok: false, errors };
  const dir = join(paths.sites, b.slug + dirSuffix);
  injectSite(dir, biz);
  const dep = await adapters.deploySite(dir, b.slug, host);
  return { ok: true, dir: `sites/${b.slug}${dirSuffix}`, url: dep.url, photos: biz.gallery.length };
}

async function provisionOne(reg, b) {
  const cfg = config();
  const f = b.fulfillment || { steps: {} };
  const onboarding = getOnboarding(b.place_id);

  // ---------- FASE A: pagato → live su sottodominio (subito) ----------
  if (b.state === 'pagato' || (b.state === 'provisioning' && f.phase !== 'subdomain')) {
    const host = `${b.slug}.${SUBBASE}`;
    const r = await buildAndDeploy(b, { host, dirSuffix: '-live', provisional: true, onboarding });
    if (!r.ok) { upsert(reg, b.place_id, { last_error: 'provisional build: ' + r.errors.join('; ') }); logger.error(`${b.name}: build provisional fallito`, { errors: r.errors }); return false; }
    f.phase = 'subdomain'; f.subdomain_url = r.url; f.live_dir = r.dir;
    upsert(reg, b.place_id, { state: 'live', fulfillment: f, live_url: r.url, live_at: new Date().toISOString(), blocked_reason: null });
    queueHandoff(b.name, onboarding?.telefono, r.url, `Ciao! Pagamento ricevuto ✅ Il tuo sito è GIÀ online qui: ${r.url} — tra pochi giorni lo spostiamo sul tuo dominio definitivo. Mandami le foto del locale quando vuoi!`, b.place_id);
    logger.ok(`🚀 ${b.name} LIVE (sottodominio) → ${r.url}`);
    return true;
  }

  // ---------- FASE B: dominio vero dopo garanzia + foto ----------
  if (b.state === 'live' && f.phase === 'subdomain') {
    const guard = cfg.commercial.guarantee_days || 7;
    const passed = daysSince(b.paid_at) >= guard;
    const hasPhotos = (onboarding?.photos || []).length > 0;
    const refunded = b.subscription_status === 'canceled' || b.refunded;
    if (refunded) { logger.info(`${b.name}: rimborsato/annullato — niente dominio`); return false; }
    if (!passed) { logger.info(`${b.name}: garanzia non ancora scaduta (${Math.floor(daysSince(b.paid_at))}/${guard}g) — resto su sottodominio`); return false; }
    if (!hasPhotos) { upsert(reg, b.place_id, { blocked_reason: 'attesa foto per il dominio definitivo' }); logger.warn(`${b.name}: garanzia passata ma mancano le foto`); return false; }

    // 1) dominio che rispecchia il nome
    if (!f.domain) {
      const dom = await findAvailableDomain(b.name, { city: b.zone }, adapters.checkDomainAvailability);
      if (!dom.domain) { upsert(reg, b.place_id, { last_error: 'nessun dominio libero', fulfillment: f }); return false; }
      f.domain = dom.domain;
    }
    // 2) registra intestato al cliente, auto-renew ON ("per sempre")
    if (!f.registrar_order) {
      const order = await adapters.registerDomain(f.domain, { registrant: { name: onboarding.referente, phone: onboarding.telefono, email: b.contact_email, address: b.address, country: 'IT' }, autoRenew: true });
      f.registrar_order = order.id; f.auto_renew = order.auto_renew;
    }
    // 3) DNS + SSL
    if (!f.cf_hostname_id) { const h = await adapters.attachCustomHostname(f.domain, b.slug); f.cf_hostname_id = h.id; }
    // 4) rebuild con le FOTO + deploy sul dominio vero
    const r = await buildAndDeploy(b, { host: f.domain, dirSuffix: '-live', provisional: false, onboarding });
    if (!r.ok) { upsert(reg, b.place_id, { last_error: 'live finale: ' + r.errors.join('; '), fulfillment: f }); return false; }
    f.phase = 'final'; f.live_dir = r.dir;
    upsert(reg, b.place_id, { state: 'attivo', fulfillment: f, live_url: `https://${f.domain}`, domain: f.domain, subscription_status: b.subscription_status || 'active', finalized_at: new Date().toISOString(), blocked_reason: null });
    queueHandoff(b.name, onboarding.telefono, `https://${f.domain}`, `🎉 Il tuo sito definitivo è online sul tuo dominio: https://${f.domain} — con le tue foto. Collegalo alla scheda Google e sei operativo. Per modifiche scrivimi pure!`, b.place_id);
    logger.ok(`🏁 ${b.name} DEFINITIVO → https://${f.domain} (${r.photos} foto, auto-renew ON)`);
    return true;
  }

  return false;
}

export async function runProvision() {
  if (!existsSync(DIST)) throw new Error('Bundle template mancante: cd site-template && npm run build');
  const reg = load();
  const todo = all(reg).filter((b) => ['pagato', 'provisioning', 'live'].includes(b.state));
  if (!todo.length) { logger.info('PROVISION: nessun cliente da consegnare'); return { subdomain: 0, final: 0 }; }
  logger.step(`PROVISION ${isMock() ? '(MOCK)' : '(LIVE)'}: ${todo.length} clienti`);
  let sub = 0, fin = 0;
  for (const b of todo) {
    const before = b.fulfillment?.phase;
    const ok = await provisionOne(reg, all(load()).find((x) => x.place_id === b.place_id) || b);
    save(reg);
    if (ok) { const now = load().businesses[b.place_id]?.fulfillment?.phase; if (now === 'final') fin++; else if (now === 'subdomain' && before !== 'subdomain') sub++; }
  }
  logger.ok(`PROVISION: ${sub} messi live su sottodominio, ${fin} portati al dominio definitivo`);
  return { subdomain: sub, final: fin };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runProvision().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
