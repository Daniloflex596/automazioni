#!/usr/bin/env node
// PIPELINE: l'orchestratore della run notturna. Prepara tutto fino ai cancelli umani.
// scan → find-contact → generate → verify → outreach(bozze) → report.
// NON pubblica e NON invia: quello lo fa Danilo dal report/CLI.
import { runScan } from './scan.mjs';
import { runFindContact } from './find-contact.mjs';
import { runGenerate } from './generate-site.mjs';
import { runVerify } from './verify.mjs';
import { runOutreach } from './outreach.mjs';
import { runReport } from './report.mjs';
import { logger, isMock } from '../lib/util.mjs';

async function main() {
  const t0 = Date.now();
  logger.step(`\n══ PIPELINE PROSPECTOR ${isMock() ? '(MOCK)' : '(LIVE)'} ══`);
  const summary = {};
  summary.scan = await runScan();
  summary.contact = await runFindContact();
  summary.generate = await runGenerate();
  summary.verify = await runVerify();
  summary.outreach = await runOutreach();
  runReport();

  logger.step('\n── RIEPILOGO RUN ──');
  logger.info(`Scoperti: ${summary.scan.discovered} · Qualificati: ${summary.scan.qualified}`);
  logger.info(`Siti generati: ${summary.generate.created} · QA superati: ${summary.verify.passed}/${summary.verify.verified}`);
  logger.info(`Bozze outreach: ${summary.outreach.drafted}`);
  logger.ok(`Pipeline completata in ${((Date.now() - t0) / 1000).toFixed(1)}s. Apri outbox/REPORT.md per i cancelli umani.`);
}

main().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
