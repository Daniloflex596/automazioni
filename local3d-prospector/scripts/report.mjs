#!/usr/bin/env node
// REPORT: il riepilogo mattutino. Cosa è pronto da APPROVARE (demo + screenshot), cosa da INVIARE,
// e il funnel completo. È il cruscotto da cui Danilo governa i due cancelli umani.
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { paths, logger } from '../lib/util.mjs';
import { load, all, STATES } from '../lib/registry.mjs';

export function buildReport() {
  const reg = load();
  const businesses = all(reg);
  const byState = {};
  for (const s of STATES) byState[s] = businesses.filter((b) => b.state === s);

  const readyToPublish = byState['demo-pronta'] || [];
  const readyToSend = businesses.filter((b) => b.outreach_drafted && ['demo-pronta', 'approvata'].includes(b.state));

  const lines = [];
  lines.push(`# Report Prospector — ${new Date().toLocaleDateString('it-IT')}`);
  lines.push('');
  lines.push('## Funnel');
  lines.push('');
  lines.push('| Stato | # |');
  lines.push('|---|---|');
  for (const s of STATES) if (byState[s].length) lines.push(`| ${s} | ${byState[s].length} |`);
  lines.push('');

  lines.push('## 🟢 CANCELLO 1 — Demo da APPROVARE (guarda gli screenshot, poi approva/scarta)');
  lines.push('');
  if (!readyToPublish.length) lines.push('_Niente in attesa._');
  for (const b of readyToPublish) {
    lines.push(`### ${b.name}  ·  score ${b.score}  ·  ${b.rating}★ (${b.reviews_count})`);
    lines.push(`- Zona: ${b.zone} · Template: ${b.template}`);
    lines.push(`- Demo: ${b.demo_url}`);
    lines.push(`- Screenshot: \`${b.site_dir}/shots/desktop-hero.png\`, \`mobile-hero.png\`, \`desktop-cta.png\``);
    if (b.qa?.warnings?.length) lines.push(`- ⚠️ ${b.qa.warnings.join('; ')}`);
    lines.push(`- Approva:  \`npm run registry -- approve ${b.place_id}\``);
    lines.push(`- Scarta:   \`npm run registry -- reject ${b.place_id}\``);
    lines.push('');
  }

  lines.push('## 📨 CANCELLO 2 — Contatti pronti da INVIARE');
  lines.push('');
  if (!readyToSend.length) lines.push('_Niente in coda._');
  for (const b of readyToSend) {
    lines.push(`- **${b.name}** — ${b.contact_email ? `email: ${b.contact_email}` : 'solo WhatsApp/telefono'} · bozza in \`outbox/${b.slug}.md\``);
    lines.push(`  - Segna inviato: \`npm run registry -- sent ${b.place_id}\``);
  }
  lines.push('');

  lines.push('## Note');
  lines.push('- La macchina PREPARA. Nessuna demo va online e nessun messaggio parte senza la tua approvazione.');
  lines.push('- Email solo verso indirizzi generici; WhatsApp sempre a invio manuale.');

  return lines.join('\n');
}

export function runReport() {
  const md = buildReport();
  const out = join(paths.outbox, 'REPORT.md');
  writeFileSync(out, md + '\n');
  logger.ok(`REPORT scritto in outbox/REPORT.md`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runReport();
}
