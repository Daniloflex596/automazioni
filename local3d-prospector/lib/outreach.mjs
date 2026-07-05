// Generazione bozze di outreach: email (conforme) + messaggio WhatsApp assistito.
// NON invia: mette in coda. L'invio passa dal cancello umano.
import { config } from './config.mjs';

// numero → link wa.me (assume prefisso IT se manca). Ritorna null se non valido.
export function waLink(phoneRaw, text) {
  if (!phoneRaw) return null;
  let n = phoneRaw.replace(/[^\d+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  else if (n.startsWith('00')) n = n.slice(2);
  else if (n.startsWith('0')) n = '39' + n; // numero italiano nazionale
  if (n.length < 8) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

// Email conforme: mittente identificato, tono "ho fatto una cosa per te", 1 solo link, opt-out.
export function draftEmail(biz, demoUrl) {
  const name = biz.identity.name;
  const theme = (biz.social_proof?.themes || [])[0];
  const hook = theme ? `Ho visto le vostre ottime recensioni (specie per ${theme.label.toLowerCase()})` : `Ho visto le vostre ottime recensioni`;
  const c = config().commercial;

  const subject = `Un'anteprima del sito di ${name}`;
  const body = [
    `Buongiorno,`,
    ``,
    `mi chiamo Danilo, creo siti web per locali della zona. ${hook}, e ho notato che ${name} non ha ancora un sito proprio — così ne ho preparata un'anteprima, gratis e senza impegno, per farvi vedere come potrebbe essere.`,
    ``,
    `La trovate qui: ${demoUrl}`,
    ``,
    `È un sito moderno, con animazioni, pensato per farsi trovare e prendere prenotazioni. Se vi piace possiamo attivarlo con un dominio vostro (${c.setup_price_eur}€ una tantum + ${c.monthly_price_eur}€/mese tutto incluso, soddisfatti o rimborsati entro ${c.guarantee_days} giorni). Se non vi interessa, nessun problema.`,
    ``,
    `Un saluto,`,
    `Danilo`,
    ``,
    `— Se non volete più ricevere messaggi, rispondete "STOP" e sarete rimossi subito.`,
  ].join('\n');

  return { subject, body };
}

export function draftWhatsApp(biz, demoUrl) {
  const name = biz.identity.name;
  const text = `Buongiorno! Sono Danilo, creo siti per locali della zona. Ho preparato un'anteprima gratuita del sito di ${name}, guardatela quando volete: ${demoUrl} — se vi piace ne parliamo, altrimenti nessun problema 🙂`;
  const link = waLink(biz.contacts?.phone?.value, text);
  return { text, link };
}
