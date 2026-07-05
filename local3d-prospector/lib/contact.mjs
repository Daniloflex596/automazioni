// Ricerca contatto email — SOLO indirizzi generici del locale (info@, prenotazioni@…).
// Mai nominativi: quelli, a freddo, sono fuori dal perimetro legale (art. 130 Codice Privacy).
// In mock legge dal dato di prova. In reale, l'hook di ricerca web/social va collegato qui
// (lasciato esplicito: preferiamo NON avere email che avere un'email non conforme).
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { paths, readJSON } from './util.mjs';

const GENERIC_LOCALPARTS = ['info', 'prenotazioni', 'prenota', 'ristorante', 'locale', 'contatti', 'booking', 'eventi'];

export function isGenericEmail(email) {
  if (!email || !email.includes('@')) return false;
  const local = email.split('@')[0].toLowerCase();
  // niente nome.cognome@, niente iniziale.cognome@
  if (/^[a-z]+\.[a-z]+$/.test(local)) return false;
  return GENERIC_LOCALPARTS.some((g) => local === g || local.startsWith(g));
}

export function classifyEmail(email) {
  return isGenericEmail(email) ? 'generic' : 'nominative';
}

// Ritorna { value, kind, source } | null
export async function findContactEmail(placeId, name) {
  // MOCK / dato noto
  const path = join(paths.mock, 'contacts.json');
  if (existsSync(path)) {
    const map = readJSON(path);
    const hit = map[placeId];
    if (hit && hit.email) {
      const kind = classifyEmail(hit.email);
      if (kind === 'generic') return { value: hit.email, kind, source: hit.source || 'manual' };
    }
  }
  // REALE: qui si aggancia la ricerca (sito social, PagineGialle). Se non trova un'email
  // GENERICA, ritorna null: il locale andrà solo in coda WhatsApp/telefono.
  return null;
}
