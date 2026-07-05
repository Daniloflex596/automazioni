// Interpreta la richiesta di modifica del cliente in linguaggio naturale → un set CHIUSO di operazioni.
// MAI generazione di codice libero: solo parametri whitelistati (tono/palette, ordine sezioni, flag).
// Ciò che non rientra va in coda umana. (Domani un LLM può proporre queste ops, ma l'output resta
// vincolato a questo schema: sicuro e riproducibile.)
import { deriveTheme } from './theme.mjs';

const TONE_WORDS = [
  { re: /elegant|raffinat|chic|lusso|premium/i, tone: 'elegant' },
  { re: /modern|neon|futurist|tech/i, tone: 'neon' },
  { re: /cald|accoglient|intim|cozy|rustic/i, tone: 'cozy' },
  { re: /street|urban|grezz|industrial/i, tone: 'street' },
  { re: /tradizional|classic|sobri/i, tone: 'traditional' },
];

// Ritorna { ops:[...], unhandled:[...] }
export function parseChangeRequest(text) {
  const t = String(text || '');
  const ops = [];
  const unhandled = [];

  // 1) TONO / COLORI
  const tone = TONE_WORDS.find((w) => w.re.test(t));
  if (tone) ops.push({ type: 'set_tone', value: tone.tone });
  else if (/color|colore|palette|tinta|scur|chiar|vivac/i.test(t)) ops.push({ type: 'cycle_palette' });

  // 2) ORDINE SEZIONI: dare risalto a qualcosa
  if (/recension|opinion|stelle/i.test(t)) ops.push({ type: 'promote_section', value: 'reviews' });
  if (/foto|gallery|immagin/i.test(t)) ops.push({ type: 'promote_section', value: 'gallery' });
  if (/menu|piatt|prodott/i.test(t)) ops.push({ type: 'promote_section', value: 'loved' });

  // 3) FLAG che richiedono dati (non applicabili in automatico: vanno segnalati)
  if (/orari?|apertur|chiusur/i.test(t)) ops.push({ type: 'flag', value: 'update_hours' });
  if (/telefon|numero|cellul/i.test(t)) ops.push({ type: 'flag', value: 'update_phone' });
  if (/nome|si chiama|intestazion/i.test(t)) ops.push({ type: 'flag', value: 'update_name' });

  if (!ops.length) unhandled.push(t.slice(0, 160));
  return { ops, unhandled };
}

// Applica le ops al business.json (copia). Ritorna { biz, applied:[...], flags:[...] }.
export function applyOps(bizIn, ops) {
  const biz = JSON.parse(JSON.stringify(bizIn));
  const applied = [];
  const flags = [];
  const palettes = ['cozy', 'elegant', 'neon', 'street', 'traditional'];

  for (const op of ops) {
    if (op.type === 'set_tone') {
      biz.identity.tone = op.value;
      biz.theme = deriveTheme(op.value);
      applied.push(`tono → ${op.value}`);
    } else if (op.type === 'cycle_palette') {
      const cur = biz.identity.tone || 'cozy';
      const next = palettes[(palettes.indexOf(cur) + 1) % palettes.length];
      biz.identity.tone = next;
      biz.theme = deriveTheme(next);
      applied.push(`palette → ${next}`);
    } else if (op.type === 'promote_section') {
      const order = biz.sections_order.filter((s) => s !== op.value);
      const idx = Math.min(1, order.length); // subito dopo l'hero
      if (bizIn.sections_order.includes(op.value)) { order.splice(idx, 0, op.value); biz.sections_order = order; applied.push(`sezione "${op.value}" in evidenza`); }
      else flags.push(`sezione "${op.value}" non presente (serve contenuto)`);
    } else if (op.type === 'flag') {
      flags.push(op.value);
    }
  }
  return { biz, applied, flags };
}
