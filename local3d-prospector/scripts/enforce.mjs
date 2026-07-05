#!/usr/bin/env node
// ENFORCE: il "per sempre" del sito è legato al canone. Questo passo allinea lo stato del sito allo
// stato dell'abbonamento Stripe:
//   canone ATTIVO   → sito online, dominio in auto-renew (si rinnova da solo ogni anno)
//   canone FALLITO  → dopo il sollecito (dunning Stripe), sito SOSPESO e auto-renew OFF
//   RIPAGATO        → sito riattivato
//
// Lo stato abbonamento arriva dal webhook Stripe (tabella subscriptions nel Worker). In mock lo
// leggiamo da mock/subscriptions.json { "<place_id>": "active|past_due|canceled" }.
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { paths, readJSON, logger, isMock } from '../lib/util.mjs';
import { load, save, all, upsert } from '../lib/registry.mjs';
import * as adapters from '../lib/providers.mjs';

async function statusFor(b) {
  // MOCK / override locale
  const p = join(paths.mock, 'subscriptions.json');
  if (existsSync(p)) { const m = readJSON(p); if (m[b.place_id]) return m[b.place_id]; }
  // LIVE: interroga il Worker (fonte = webhook Stripe)
  if (!isMock() && process.env.WORKER_BASE_URL) {
    try { const r = await fetch(`${process.env.WORKER_BASE_URL}/status/${b.place_id}`); const d = await r.json(); return d.status || 'active'; } catch { /* ignore */ }
  }
  return b.subscription_status || 'active';
}

export async function runEnforce() {
  const reg = load();
  const sites = all(reg).filter((b) => ['live', 'attivo', 'sospeso'].includes(b.state));
  if (!sites.length) { logger.info('ENFORCE: nessun sito da controllare'); return { suspended: 0, reactivated: 0 }; }
  let suspended = 0, reactivated = 0;

  for (const b of sites) {
    const status = await statusFor(b);
    const dom = b.domain || b.fulfillment?.subdomain_url;
    const hostId = b.fulfillment?.cf_hostname_id;

    if ((status === 'past_due' || status === 'canceled') && b.state !== 'sospeso') {
      await adapters.suspendSite(dom, hostId);
      if (b.domain) await adapters.setAutoRenew(b.domain, false);
      upsert(reg, b.place_id, { state: 'sospeso', subscription_status: status, suspended_at: new Date().toISOString() });
      suspended++; logger.warn(`⏸  ${b.name}: canone ${status} → SOSPESO`);
    } else if (status === 'active' && b.state === 'sospeso') {
      await adapters.reactivateSite(dom, hostId);
      if (b.domain) await adapters.setAutoRenew(b.domain, true);
      upsert(reg, b.place_id, { state: 'attivo', subscription_status: 'active', reactivated_at: new Date().toISOString() });
      reactivated++; logger.ok(`▶  ${b.name}: canone ripreso → RIATTIVATO`);
    } else {
      upsert(reg, b.place_id, { subscription_status: status });
    }
  }
  save(reg);
  logger.ok(`ENFORCE: ${suspended} sospesi, ${reactivated} riattivati`);
  return { suspended, reactivated };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runEnforce().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
