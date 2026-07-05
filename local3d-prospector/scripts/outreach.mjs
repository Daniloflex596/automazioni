#!/usr/bin/env node
// OUTREACH: PREPARA le bozze (email conforme + messaggio WhatsApp), le mette in outbox/ e in coda.
// NON invia. L'invio passa dal cancello umano (approvazione mattutina). Il numero personale di
// Danilo entra in gioco solo dopo il pagamento.
import { join } from 'node:path';
import { config } from '../lib/config.mjs';
import { readJSON, writeJSON, paths, ensureDir, logger } from '../lib/util.mjs';
import { load, save, all, upsert } from '../lib/registry.mjs';
import { draftEmail, draftWhatsApp } from '../lib/outreach.mjs';
import { writeFileSync } from 'node:fs';

export async function runOutreach() {
  const cfg = config();
  const reg = load();
  // Bozze solo per demo verificate. Preferiamo le APPROVATE da Danilo; se non ce ne sono,
  // prepariamo comunque le bozze per le demo-pronta così sono pronte all'approvazione.
  const pool = all(reg).filter((b) => ['demo-pronta', 'approvata'].includes(b.state) && b.site_dir && !b.outreach_drafted);
  const todo = pool.slice(0, cfg.limits.max_outreach_drafts_per_run);
  if (!todo.length) { logger.info('OUTREACH: nessuna bozza da preparare'); return { drafted: 0 }; }

  ensureDir(paths.outbox);
  const queue = readJSON(join(paths.outbox, 'queue.json'), { emails: [], whatsapp: [] });
  let drafted = 0;

  for (const b of todo) {
    const biz = readJSON(join(paths.root, b.site_dir, 'business.json'));
    const demoUrl = b.demo_url || biz.cta.checkout_url;
    const wa = draftWhatsApp(biz, demoUrl);

    // Email SOLO se abbiamo un indirizzo generico conforme.
    let emailEntry = null;
    if (b.contact_email && b.contact_email_kind === 'generic') {
      const em = draftEmail(biz, demoUrl);
      emailEntry = { place_id: b.place_id, to: b.contact_email, subject: em.subject, body: em.body, status: 'DRAFT_PENDING_APPROVAL' };
      queue.emails.push(emailEntry);
    }
    const waEntry = { place_id: b.place_id, name: b.name, phone: biz.contacts.phone.value, wa_link: wa.link, text: wa.text, status: 'READY_MANUAL_SEND' };
    if (wa.link) queue.whatsapp.push(waEntry);

    // File leggibile per l'umano
    const md = [
      `# ${b.name}`,
      ``,
      `**Demo:** ${demoUrl}`,
      `**Score:** ${b.score}  ·  **Rating:** ${b.rating} (${b.reviews_count} rec.)  ·  **Zona:** ${b.zone}`,
      ``,
      `## Email ${emailEntry ? `→ ${b.contact_email}` : '(nessuna email generica: solo WhatsApp/telefono)'}`,
      emailEntry ? '```\n' + `Oggetto: ${emailEntry.subject}\n\n${emailEntry.body}` + '\n```' : '_—_',
      ``,
      `## WhatsApp (invio manuale) ${wa.link ? '' : '(numero non valido)'}`,
      wa.link ? `Link: ${wa.link}\n\n> ${wa.text}` : '_—_',
    ].join('\n');
    writeFileSync(join(paths.outbox, `${biz.meta.slug}.md`), md);

    upsert(reg, b.place_id, { outreach_drafted: true });
    drafted++;
  }

  writeJSON(join(paths.outbox, 'queue.json'), queue);
  save(reg);
  logger.ok(`OUTREACH: ${drafted} bozze pronte in outbox/ (email in coda, WhatsApp manuale) — in attesa cancello umano INVIA`);
  return { drafted };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runOutreach().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
