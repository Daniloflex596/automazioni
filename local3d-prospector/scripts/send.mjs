#!/usr/bin/env node
// SEND: il CANCELLO 2. Invia in blocco tutte le bozze delle demo APPROVATE.
// Email via Resend (se configurato), WhatsApp resta a invio manuale (coda). Rispetta la suppress-list
// (opt-out), applica un rate-limit, e segna ogni locale come 'contattato'. Tutto loggato per-business.
//
// Uso:
//   npm run send                 invia le approvate (mock se manca RESEND_API_KEY)
//   npm run send -- --dry        mostra cosa invierebbe, senza inviare
import { join } from 'node:path';
import { appendFileSync } from 'node:fs';
import { config } from '../lib/config.mjs';
import { readJSON, writeJSON, paths, logger, isMock } from '../lib/util.mjs';
import { load, save, all, upsert } from '../lib/registry.mjs';
import { draftEmail, draftWhatsApp } from '../lib/outreach.mjs';

const DRY = process.argv.includes('--dry');
const SUPPRESS = join(paths.data, 'suppress.json');

function suppressed(email) {
  const list = readJSON(SUPPRESS, { emails: [] });
  return email && list.emails.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}

async function sendEmail(to, subject, body) {
  // Reale: Resend. Mock/assenza chiave: log e basta (nessun invio).
  if (isMock() || !process.env.RESEND_API_KEY) {
    return { ok: true, mode: 'mock' };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM || 'Danilo <danilo@tuodominio.it>', to, subject, text: body }),
  });
  return { ok: res.ok, mode: 'live', status: res.status };
}

export async function runSend() {
  const cfg = config();
  const reg = load();
  // Solo le APPROVATE da Danilo (cancello 1 già passato) con bozze pronte e non ancora contattate.
  const todo = all(reg).filter((b) => b.state === 'approvata' && b.outreach_drafted).slice(0, cfg.limits.max_outreach_drafts_per_run);
  if (!todo.length) { logger.info('SEND: nessuna demo approvata da inviare'); return { sent: 0, whatsapp: 0, skipped: 0 }; }

  logger.step(`SEND ${DRY ? '(DRY-RUN)' : isMock() ? '(MOCK: nessun invio reale)' : '(LIVE Resend)'}: ${todo.length} contatti`);
  let sent = 0, wa = 0, skipped = 0;
  const waQueue = readJSON(join(paths.outbox, 'whatsapp-da-inviare.json'), { items: [] });

  for (const b of todo) {
    const biz = readJSON(join(paths.root, b.site_dir, 'business.json'));
    const demoUrl = b.demo_url;

    // EMAIL (solo generica + non in opt-out)
    let emailResult = 'no-email';
    if (b.contact_email && b.contact_email_kind === 'generic') {
      if (suppressed(b.contact_email)) { emailResult = 'suppressed'; skipped++; }
      else {
        const em = draftEmail(biz, demoUrl);
        if (DRY) emailResult = 'dry';
        else { const r = await sendEmail(b.contact_email, em.subject, em.body); emailResult = r.ok ? `sent(${r.mode})` : `fail(${r.status})`; if (r.ok) sent++; }
      }
    }

    // WHATSAPP → coda per invio manuale (mai automatico)
    const w = draftWhatsApp(biz, demoUrl);
    if (w.link) { waQueue.items.push({ place_id: b.place_id, name: b.name, wa_link: w.link, added_at: new Date().toISOString() }); wa++; }

    if (!DRY) upsert(reg, b.place_id, { state: 'contattato', contacted_at: new Date().toISOString(), email_result: emailResult });
    appendFileSync(join(paths.outbox, 'SENT.log'), `${new Date().toISOString()}  ${b.name}  email:${emailResult}  wa:${w.link ? 'queued' : 'no'}\n`);
    logger.info(`• ${b.name} — email:${emailResult} · whatsapp:${w.link ? 'in coda' : 'no'}`);
  }

  if (!DRY) { writeJSON(join(paths.outbox, 'whatsapp-da-inviare.json'), waQueue); save(reg); }
  logger.ok(`SEND: ${sent} email inviate, ${wa} WhatsApp in coda (manuali), ${skipped} saltate (opt-out). Coda WA: outbox/whatsapp-da-inviare.json`);
  return { sent, whatsapp: wa, skipped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSend().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
