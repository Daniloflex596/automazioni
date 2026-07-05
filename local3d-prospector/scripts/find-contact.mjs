#!/usr/bin/env node
// FIND-CONTACT: per i locali qualificati cerca un'email GENERICA. Se non c'è, resta solo il canale
// telefono/WhatsApp assistito (il numero arriva sempre da Places).
import { load, save, all, upsert } from '../lib/registry.mjs';
import { findContactEmail } from '../lib/contact.mjs';
import { logger } from '../lib/util.mjs';

export async function runFindContact() {
  const reg = load();
  let withEmail = 0, phoneOnly = 0;
  for (const b of all(reg)) {
    if (!['qualificato', 'demo-pronta', 'approvata'].includes(b.state)) continue;
    if (b.contact_checked) continue;
    const email = await findContactEmail(b.place_id, b.name);
    upsert(reg, b.place_id, {
      contact_checked: true,
      contact_email: email ? email.value : null,
      contact_email_kind: email ? email.kind : null,
    });
    if (email) withEmail++; else phoneOnly++;
  }
  save(reg);
  logger.ok(`FIND-CONTACT: ${withEmail} con email generica, ${phoneOnly} solo telefono/WhatsApp`);
  return { withEmail, phoneOnly };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFindContact().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
