/**
 * ============================================================================
 *  ARKADIA PUB — CONTENUTI DEL SITO  (unico file da modificare)
 * ============================================================================
 *  Il ristoratore può aggiornare qui menu, prezzi, orari e contatti SENZA
 *  toccare il codice. Dopo ogni modifica basta ricostruire il sito
 *  (`npm run build`) o lasciare che Cloudflare Pages ricostruisca da Git.
 *
 *  Regole rapide:
 *   - I prezzi sono stringhe (es. "7,00") per mantenere il formato italiano.
 *   - Non rimuovere le virgole o le parentesi graffe: rompono la struttura.
 *   - I campi contrassegnati con  // ⚠️ DA CONFERMARE  vanno validati dal
 *     cliente prima della pubblicazione (indirizzo, P.IVA, tap-list reale…).
 * ============================================================================
 */

export const info = {
  nome: 'Arkadia',
  sottotitolo: 'Pub · Birreria · Ciampino',
  claim: 'Un rifugio dorato dal 2018',
  annoFondazione: 2018,
  // ⚠️ DA CONFERMARE: il delivery riporta anche "Via Palermo 4a".
  indirizzo: 'Via Madrid 10',
  citta: 'Ciampino',
  cap: '00043',
  provincia: 'RM',
  telefono: '06 7960634',
  telefonoHref: '+39067960634',
  cellulare: '379 159 7103',
  // Numero usato per il pulsante WhatsApp delle prenotazioni (formato internazionale, solo cifre).
  whatsapp: '393791597103',
  email: 'info@arkadiapub.it', // ⚠️ DA CONFERMARE
  partitaIva: '00000000000', // ⚠️ DA CONFERMARE
  geo: { lat: 41.7998, lng: 12.6015 }, // ⚠️ DA CONFERMARE (coordinate approssimative di Ciampino)
  rating: { valore: '4.6', recensioni: 172 },
  fasciaPrezzo: '€10–20',
  social: {
    instagram: 'https://www.instagram.com/arkadiapub/',
    facebook: 'https://www.facebook.com/arkadiaciampino/',
  },
  // Link al menu completo esistente (menu digitale del locale).
  menuCompletoUrl: 'https://www.leggimenu.it/menu/arkadiapub',
};

export const orari = [
  { giorni: 'Lunedì', valore: 'Chiuso', chiuso: true },
  { giorni: 'Martedì – Domenica', valore: '19:00 – 24:00', chiuso: false },
];

// Formato per Schema.org (openingHours). Ma–Do 19:00–24:00, Lunedì chiuso.
export const orariSchema = [
  'Tu-Su 19:00-24:00',
];

/**
 * IL RIFUGIO — Atto II. Blocchi di racconto rivelati durante lo scroll.
 */
export const storia = {
  occhiello: 'Il Rifugio',
  titolo: 'Dal 2018,\nun angolo di Arcadia a Ciampino',
  blocchi: [
    {
      anno: '2018',
      testo:
        'Arkadia nasce da un’idea semplice e ostinata: creare un posto dove ci si sente a casa, tra amici, davanti a una birra fatta come si deve.',
    },
    {
      anno: 'La radice',
      testo:
        'Dall’esperienza internazionale del titolare arriva l’amore per le grandi etichette franco-belghe: birre selezionate una per una, senza compromessi sulla qualità.',
    },
    {
      anno: 'Oggi',
      testo:
        'Accanto ai classici del Belgio, una rotazione di craft italiane, opzioni gluten-free e materie prime a km zero. Poche cose, fatte bene.',
    },
  ],
};

/**
 * LA SPINA — Atto III. La selezione birre (tap-list).
 * ⚠️ DA CONFERMARE con la tap-list reale del locale. I valori qui sotto sono
 * plausibili ma indicativi.
 */
export const birre = {
  occhiello: 'La Spina',
  titolo: 'La selezione',
  intro:
    'La casa è franco-belga, il cuore è artigianale. Etichette scelte a mano, più una rotazione di craft italiane. Gluten-free su richiesta.',
  lista: [
    {
      nome: 'Ambrata di Fiandra',
      stile: 'Belgian Amber Ale',
      origine: 'Belgio',
      abv: '6.5',
      ibu: '22',
      prezzo: '7,00',
      nota: 'Caramello, frutta secca, finale asciutto. La nostra bandiera.',
      glutenFree: false,
    },
    {
      nome: 'Bionda di Abbazia',
      stile: 'Belgian Blond Ale',
      origine: 'Belgio',
      abv: '6.8',
      ibu: '18',
      prezzo: '7,00',
      nota: 'Miele, spezie leggere, beva pericolosamente facile.',
      glutenFree: false,
    },
    {
      nome: 'Craft del Mese',
      stile: 'Italian Pale Ale',
      origine: 'Italia',
      abv: '5.2',
      ibu: '40',
      prezzo: '6,00',
      nota: 'La rotazione italiana: chiedi cosa c’è alla spina stasera.',
      glutenFree: false,
    },
    {
      nome: 'Senza Glutine',
      stile: 'Gluten-Free Lager',
      origine: 'Italia',
      abv: '5.0',
      ibu: '20',
      prezzo: '6,50',
      nota: 'Tutto il gusto, zero glutine. Perché a casa ci sta chiunque.',
      glutenFree: true,
    },
  ],
};

/**
 * LA TAVOLA — Atto IV. Piatti signature.
 * ⚠️ DA CONFERMARE prezzi e descrizioni con la cucina.
 */
export const cibo = {
  occhiello: 'La Tavola',
  titolo: 'Dalla cucina',
  piatti: [
    {
      nome: 'L’Hamburger 200gr',
      categoria: 'Il signature',
      prezzo: '12,00',
      descrizione:
        'Duecento grammi di carne scelta, cottura giusta, pane che tiene. L’eroe della casa: semplice, generoso, senza fronzoli.',
    },
    {
      nome: 'Fritti & Sfizi',
      categoria: 'Da condividere',
      prezzo: '8,00',
      descrizione:
        'Croccanti, caldi, perfetti con una pinta in mano. Il modo giusto per iniziare la serata in compagnia.',
    },
    {
      nome: 'Il Dolce del Giorno',
      categoria: 'Il rituale',
      prezzo: '5,00',
      descrizione:
        'Un dessert diverso ogni giorno. Non chiederti quale: fidati e chiedi qual è quello di stasera.',
    },
  ],
};

/**
 * DENTRO ARKADIA — Atto V. Atmosfera e luogo.
 */
export const luogo = {
  occhiello: 'Dentro Arkadia',
  titolo: 'Il posto giusto per restare',
  descrizione:
    'Luci calde, tavoli veri, la spina che scorre. Arkadia è il tipo di posto dove entri per una birra e resti per la serata.',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Arkadia+Pub+Ciampino',
};

/**
 * IL BRINDISI — Atto VI. Prenotazione.
 */
export const prenotazione = {
  occhiello: 'Il Brindisi',
  titolo: 'Tieniti il tavolo',
  sottotitolo:
    'Scrivici su WhatsApp o chiamaci: rispondiamo noi, come si fa tra amici.',
};

export const meta = {
  titolo: 'Arkadia Pub · Birreria a Ciampino — Birra franco-belga & hamburger',
  descrizione:
    'Arkadia Pub a Ciampino: birre artigianali franco-belghe e italiane, hamburger da 200gr, opzioni gluten-free. Un rifugio dal 2018. Prenota il tuo tavolo.',
  ogImage: '/og-arkadia.jpg', // ⚠️ Sostituire con una foto reale del locale.
  keywords:
    'pub Ciampino, birreria Ciampino, birra artigianale, birra belga, hamburger Ciampino, Arkadia pub',
};
