#!/usr/bin/env node
// NIGHTLY: la run notturna completa e autonoma. Prepara le nuove demo (fino ai cancelli umani) E
// consegna i clienti che hanno già pagato (il pagamento È l'azione umana che sblocca la consegna).
// Applica anche le modifiche richieste. NON pubblica demo nuove e NON invia outreach da sola.
import { runScan } from './scan.mjs';
import { runFindContact } from './find-contact.mjs';
import { runGenerate } from './generate-site.mjs';
import { runVerify } from './verify.mjs';
import { runApplyChanges } from './apply-changes.mjs';
import { runOutreach } from './outreach.mjs';
import { runProvision } from './provision.mjs';
import { runEnforce } from './enforce.mjs';
import { runReport } from './report.mjs';
import { runCockpit } from './cockpit.mjs';
import { logger, isMock } from '../lib/util.mjs';

async function main() {
  const t0 = Date.now();
  logger.step(`\n══ NIGHTLY ${isMock() ? '(MOCK)' : '(LIVE)'} ══`);
  const s = {};
  s.scan = await runScan();                 // trova nuovi candidati
  s.contact = await runFindContact();       // email generiche
  s.generate = await runGenerate();         // genera le demo
  s.applyChanges = await runApplyChanges(); // applica le modifiche richieste
  s.verify = await runVerify();             // QA meccanica (nuove + modificate)
  s.outreach = await runOutreach();         // bozze pronte (non inviate)
  s.provision = await runProvision();       // CONSEGNA i clienti (sottodominio + dominio finale)
  s.enforce = await runEnforce();            // "per sempre": allinea sito ↔ canone
  runReport();
  runCockpit();

  logger.step('\n── RIEPILOGO NIGHTLY ──');
  logger.info(`Qualificati: ${s.scan.qualified} · Demo generate: ${s.generate.created} · QA ok: ${s.verify.passed}/${s.verify.verified}`);
  logger.info(`Modifiche: ${s.applyChanges.applied} · Bozze outreach: ${s.outreach.drafted} · Sottodominio: ${s.provision.subdomain} · Dominio finale: ${s.provision.final} · Sospesi: ${s.enforce.suspended} · Riattivati: ${s.enforce.reactivated}`);
  logger.ok(`Nightly completata in ${((Date.now() - t0) / 1000).toFixed(1)}s. Apri outbox/cockpit.html.`);
}

main().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
