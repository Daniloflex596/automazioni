#!/usr/bin/env node
// PUBLISH: registra col Worker le demo APPROVATE da Danilo (cancello umano PUBBLICA già passato).
// Il deploy statico su Cloudflare Pages è un comando separato (vedi README): qui colleghiamo
// il token demo al backend per tracking e pagamento. Idempotente.
import { load, save, all, upsert } from '../lib/registry.mjs';
import { logger } from '../lib/util.mjs';

const WORKER_BASE = process.env.WORKER_BASE_URL;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export async function runPublish() {
  const reg = load();
  const todo = all(reg).filter((b) => b.state === 'approvata' && b.demo_token && !b.published_at);
  if (!todo.length) { logger.info('PUBLISH: nessuna demo approvata da registrare'); return { published: 0 }; }
  if (!WORKER_BASE || !ADMIN_TOKEN) {
    logger.warn('PUBLISH: WORKER_BASE_URL / ADMIN_TOKEN non impostati — salto la registrazione remota (locale ok)');
    return { published: 0, skipped: todo.length };
  }
  let published = 0;
  for (const b of todo) {
    const res = await fetch(`${WORKER_BASE}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${ADMIN_TOKEN}` },
      body: JSON.stringify({ token: b.demo_token, place_id: b.place_id, slug: b.slug, name: b.name, owner_id: 'danilo' }),
    }).catch((e) => ({ ok: false, _e: e.message }));
    if (res.ok) { upsert(reg, b.place_id, { published_at: new Date().toISOString() }); published++; logger.ok(`Registrata demo: ${b.name}`); }
    else logger.error(`Registrazione fallita: ${b.name}`, { status: res.status });
  }
  save(reg);
  logger.ok(`PUBLISH: ${published} demo registrate col backend`);
  return { published };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPublish().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
