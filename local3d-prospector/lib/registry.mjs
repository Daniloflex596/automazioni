// Registry: fonte di verità sullo stato di ogni locale. È anche il mini-CRM.
// File JSON unico, chiave = place_id. Macchina a stati snella (non 22 stati).
import { join } from 'node:path';
import { paths, readJSON, writeJSON } from './util.mjs';

const FILE = join(paths.data, 'registry.json');

// Ordine degli stati = avanzamento nel funnel.
export const STATES = [
  'trovato',        // scoperto dalla discovery
  'qualificato',    // ha passato i filtri hard + score sopra soglia
  'demo-pronta',    // sito generato e QA meccanico superato — in attesa del cancello umano PUBBLICA
  'approvata',      // Danilo ha approvato la demo → pubblicabile
  'contattato',     // outreach inviato (dopo cancello umano INVIA)
  'interessato',    // ha aperto la demo / ha usato il form modifiche
  'pagato',         // ha acquistato
  'live',           // sito definitivo online
  'attivo',         // canone in corso
  'sospeso',        // canone non pagato
  'freddo',         // nessuna risposta dopo follow-up
  'scartato',       // non target / opt-out
];

export function load() {
  return readJSON(FILE, { version: 1, updated_at: null, businesses: {} });
}

export function save(reg) {
  reg.updated_at = new Date().toISOString();
  writeJSON(FILE, reg);
  return reg;
}

export function get(reg, placeId) {
  return reg.businesses[placeId] || null;
}

export function upsert(reg, placeId, patch) {
  const prev = reg.businesses[placeId] || { place_id: placeId, state: 'trovato', history: [], created_at: new Date().toISOString() };
  const next = { ...prev, ...patch, place_id: placeId };
  if (patch.state && patch.state !== prev.state) {
    next.history = [...(prev.history || []), { state: patch.state, at: new Date().toISOString() }];
  }
  next.updated_at = new Date().toISOString();
  reg.businesses[placeId] = next;
  return next;
}

export function all(reg) {
  return Object.values(reg.businesses);
}

export function inState(reg, ...states) {
  return all(reg).filter((b) => states.includes(b.state));
}

// Transizione con guardia: rifiuta salti illegali (es. da 'trovato' a 'pagato').
export function canTransition(from, to) {
  const terminal = { scartato: true, freddo: true };
  if (to === 'scartato' || to === 'sospeso' || to === 'freddo') return true; // sempre ammessi
  if (terminal[from]) return false;
  return STATES.indexOf(to) >= STATES.indexOf(from);
}
