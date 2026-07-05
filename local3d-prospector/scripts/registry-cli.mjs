#!/usr/bin/env node
// CLI del registry: i comandi con cui Danilo apre i cancelli umani e ispeziona lo stato.
//   list [state]            elenca (opzionale filtro per stato)
//   show <place_id>         dettaglio
//   approve <place_id>      demo-pronta → approvata (CANCELLO 1: pubblica)
//   reject <place_id>       → scartato
//   sent <place_id>         approvata/demo-pronta → contattato (CANCELLO 2: inviato)
//   paid <place_id>         → pagato
//   stats                   funnel
import { load, save, all, get, upsert, STATES } from '../lib/registry.mjs';
import { logger } from '../lib/util.mjs';

const [cmd, arg] = process.argv.slice(2);
const reg = load();

function requireBiz(id) {
  const b = get(reg, id);
  if (!b) { logger.error(`place_id non trovato: ${id}`); process.exit(1); }
  return b;
}

switch (cmd) {
  case 'list': {
    const rows = all(reg).filter((b) => !arg || b.state === arg).sort((a, b) => (b.score || 0) - (a.score || 0));
    for (const b of rows) console.log(`${(b.state || '').padEnd(12)} ${String(b.score ?? '').padStart(3)}  ${b.place_id.padEnd(22)} ${b.name || ''}`);
    console.log(`\n${rows.length} risultati`);
    break;
  }
  case 'show': {
    console.log(JSON.stringify(requireBiz(arg), null, 2));
    break;
  }
  case 'approve': {
    requireBiz(arg); upsert(reg, arg, { state: 'approvata' }); save(reg);
    logger.ok(`Approvata: ${arg} → pubblicabile e pronta all'invio`);
    break;
  }
  case 'reject': {
    requireBiz(arg); upsert(reg, arg, { state: 'scartato' }); save(reg);
    logger.ok(`Scartata: ${arg}`);
    break;
  }
  case 'sent': {
    requireBiz(arg); upsert(reg, arg, { state: 'contattato', contacted_at: new Date().toISOString() }); save(reg);
    logger.ok(`Segnato come contattato: ${arg}`);
    break;
  }
  case 'paid': {
    requireBiz(arg); upsert(reg, arg, { state: 'pagato', paid_at: new Date().toISOString() }); save(reg);
    logger.ok(`Pagato: ${arg}`);
    break;
  }
  case 'stats': {
    for (const s of STATES) { const n = all(reg).filter((b) => b.state === s).length; if (n) console.log(`${s.padEnd(12)} ${n}`); }
    break;
  }
  default:
    console.log('Comandi: list [state] | show <id> | approve <id> | reject <id> | sent <id> | paid <id> | stats');
}
