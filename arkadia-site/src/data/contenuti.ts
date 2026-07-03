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
  claim: 'Entri per una birra.\nResti tutta la serata.',
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
  email: 'crepapelleciampino@gmail.com', // confermata dal menu digitale
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
  slogan: 'Gusta la nostra selezione dalla più amara a quella più alcolica',
  intro:
    'La casa è franco-belga, il cuore è artigianale: birre alla spina e oltre diciotto etichette in bottiglia, più una rotazione di craft. Dal chiaro al forte, ce n’è una per ogni serata.',
  // Formati disponibili per le birre alla spina (stesso ordine dei prezzi sotto).
  formati: ['25cl', '33cl', '50cl', '100cl', 'Tower 2L', 'Tower 3L'],
  spina: [
    {
      nome: 'Bionda',
      stile: 'Chiara',
      nota: 'Fresca e dritta, la più facile da bere.',
      prezzi: ['4,50', '5,50', '7,00', '13,00', '27,00', '40,50'],
    },
    {
      nome: 'Rossa',
      stile: 'Ambrata',
      nota: 'Maltata, tostata, dal carattere pieno.',
      prezzi: ['5,30', '7,00', '8,00', '15,00', '28,00', '42,00'],
    },
    {
      nome: 'IPA',
      stile: 'India Pale Ale',
      nota: 'Luppolata e amara, per chi la vuole decisa.',
      prezzi: ['5,00', '6,50', '7,50', '14,00', '26,00', '39,00'],
    },
    {
      nome: 'Birra del Mese',
      stile: 'Rotazione',
      novita: true,
      nota: 'Cambia di continuo: chiedi qual è quella di stasera.',
      prezzi: ['—', '5,50', '4,50 / 7,00', '—', '—', '—'],
    },
  ],
};

// BIRRE IN BOTTIGLIA — la selezione completa (18 etichette). Tutte 33cl · €7,00
// salvo dove indicato. Ordine come sul menu.
export const birreBottiglia = [
  { nome: 'Baladin Nazionale', stile: 'Chiara', grad: '6.5°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Baladin IPPA', stile: 'I.P.A.', grad: '5.5°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Vetra Pale Ale', stile: 'Pale Ale', grad: '5.4°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Baladin ISAAC', stile: 'Blanche', grad: '5°', formato: '50cl', prezzo: '7,00' },
  { nome: 'Piraat Red Lambic', stile: 'Lambic', grad: '10.5°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Baladin LEON', stile: 'Dark Ale', grad: '9°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Sidro Mela', stile: 'Sidro', grad: '4.5°', formato: '50cl', prezzo: '6,50' },
  { nome: 'Baladin NORA', stile: 'Chiara', grad: '6.8°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Baladin SUPER Bitter', stile: 'Ambrata', grad: '8°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Baladin Rock & Roll', stile: 'Ale', grad: '7.5°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Sidro Fragola & Lime', stile: 'Sidro', grad: '5.2°', formato: '50cl', prezzo: '6,50' },
  { nome: 'Spitfire', stile: 'Strong Ale', grad: '9.0°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Baladin Wayan', stile: 'Saison', grad: '5.8°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Bitburger', stile: 'Pils', grad: '4.8°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Schneider Weisse Weiss', stile: 'I.P.A.', grad: '8.2°', formato: '33cl', prezzo: '7,00', novita: true },
  { nome: 'Schneider Weisse Aventinus', stile: 'Dark Weiss', grad: '8.5°', formato: '33cl', prezzo: '7,00' },
  { nome: 'Brewdog Punk', stile: 'I.P.A.', grad: '5.4°', formato: '33cl', prezzo: '7,00', novita: true },
  { nome: 'Chouffe Red', stile: 'Alla ciliegia', grad: '8°', formato: '33cl', prezzo: '7,00', novita: true },
];

// Le 7 categorie reali del menu digitale, con gli slogan del locale.
// `pronta: true` = voci già inserite nella pagina /menu.
export const categorieMenu = [
  { id: 'birre', nome: 'Birre', slogan: 'Gusta la nostra selezione dalla più amara a quella più alcolica', pronta: true },
  { id: 'fritti', nome: 'Fritti & Sfizi', slogan: 'Gli antipasti non sono tutti uguali. Il nostro è MEGLIO!', pronta: true },
  { id: 'hamburger', nome: 'Hamburger', slogan: 'Innamorati dei nostri panini con hamburger da 200gr', pronta: true },
  { id: 'dessert', nome: 'Dessert', slogan: 'Ogni giorno un dessert diverso, perché alla dolcezza non c’è mai fine', pronta: true },
  { id: 'da-bere', nome: 'Da Bere', slogan: 'Distillati, vini e bibite per accompagnare la serata', pronta: true },
  { id: 'caffetteria', nome: 'Caffetteria', slogan: 'Per chiudere in bellezza la serata', pronta: true },
  { id: 'cocktail', nome: 'Cocktail', slogan: 'Miscelati e classici, dallo shaker al bicchiere', pronta: true },
  { id: 'giochi', nome: 'Sala Giochi', slogan: 'Giochi da tavolo, freccette, biliardino e serate che non vogliono finire', pronta: true },
];

/** FRITTI & SFIZI */
export const fritti = [
  { nome: 'Tagliere "Colesterolo"', prezzo: '16,00', desc: 'Gran trionfo di fritti', tag: ['surgelato'] },
  { nome: 'Patatine "Montparnasse"', prezzo: '5,80', desc: 'Patatine fritte con formaggio, cheddar e bacon croccante', tag: ['chef'] },
  { nome: 'Onion Rings', prezzo: '6,00', desc: 'Anelli di cipolla', tag: ['surgelato', 'veg'] },
  { nome: 'Nuggets di Pollo', prezzo: '6,00', desc: '', tag: ['surgelato'] },
  { nome: 'Palline di Melanzana', prezzo: '6,00', desc: 'Pasta lievitata con melanzane a pezzi', tag: [] },
  { nome: 'Patatine Cacio e Pepe', prezzo: '5,80', desc: '', tag: ['surgelato'] },
  { nome: 'Patate Stick', prezzo: '4,80', desc: '', tag: ['surgelato', 'veg'] },
];

/** HAMBURGER — tutti serviti con patatine */
export const hamburger = [
  { nome: 'Brexit', prezzo: '10,00', desc: 'Hamburger, insalata, bacon, cheddar, anelli di cipolla e salsa barbeque', badge: 'il più scelto' },
  { nome: 'Hellfire Club', prezzo: '10,00', desc: 'Hamburger, insalata, stracciatella e bomba calabra', tag: ['piccante'] },
  { nome: 'Cocò', prezzo: '10,00', desc: 'Cotoletta di pollo, pomodori secchi, stracciatella e insalata', tag: [] },
  { nome: 'Cheeseburger', prezzo: '10,00', desc: 'Hamburger, bacon, tomino e cheddar', tag: [] },
  { nome: 'Insalatona Arkadia', prezzo: '10,00', desc: 'Olive, nachos, cotoletta di pollo, insalata, bacon, salsa yogurt e pomodori secchi', tag: [] },
  { nome: 'Peppa Pig', prezzo: '9,00', desc: 'Salsiccia di Genzano con salsa a scelta', tag: [] },
  { nome: 'Bimbo Burger', prezzo: '6,00', desc: 'Hamburger semplice, per i più piccoli', tag: [] },
];

/** DESSERT */
export const dessert = [
  { nome: 'Crêpe alla Nutella', prezzo: '6,00', desc: '', tag: [] },
  { nome: 'Pannacotta', prezzo: '6,00', desc: 'Chiedi il tuo topping', tag: [] },
  { nome: 'Dolce del Giorno', prezzo: '', desc: 'Ne prepariamo uno diverso ogni sera: chiedi qual è quello di oggi.', tag: [] },
];

/** DA BERE — distillati (bicchiere/shot) e vini (calice/bottiglia) */
export const daBere = {
  distillati: [
    { nome: 'Whisky', prezzo: '7,50', shot: '3,50' },
    { nome: 'Rum', prezzo: '6,00', shot: '3,50' },
    { nome: 'Grappe / Gin', prezzo: '5,50', shot: '3,00' },
    { nome: 'Amari', prezzo: '4,50', shot: '2,00' },
  ],
  vini: [
    { nome: 'Vino Bianco', calice: '4,00', bottiglia: '10,00' },
    { nome: 'Vino Rosso', calice: '5,00', bottiglia: '12,00' },
  ],
};

/** CAFFETTERIA */
export const caffetteria = [
  { nome: 'Caffè Invernale', prezzo: '5,00', desc: 'Una bevanda che ti scalda il cuore: caffè, whisky e sciroppo d’acero' },
  { nome: 'Tè / Camomilla / Infusi', prezzo: '3,00', desc: '' },
  { nome: 'Caffè', prezzo: '1,20', desc: '' },
];

/** COCKTAIL — tutti a 6,00 */
export const cocktail = [
  { nome: 'Spritz', desc: 'Scegli il tuo Spritz' },
  { nome: 'Negroni', desc: 'Campari, Vermouth, Gin' },
  { nome: 'Negroni Sbagliato', desc: 'Prosecco, Bitter, Vermouth' },
  { nome: 'Americano', desc: 'Bitter, Vermouth, soda' },
  { nome: 'Boulevardier', desc: 'Bourbon, Vermouth, Bitter' },
  { nome: 'Mojito', desc: 'Rum, menta, limone, Angostura' },
  { nome: 'Cuba Libre', desc: 'Rum, limone, Coca Cola' },
  { nome: 'Piña Colada', desc: 'Rum al cocco, succo d’ananas, limone' },
  { nome: 'Gin Tonic', desc: 'Gin, acqua tonica' },
  { nome: 'Gin Lemon', desc: 'Gin, lemon soda' },
  { nome: 'Vodka Tonic', desc: 'Vodka, acqua tonica' },
  { nome: 'Vodka Lemon', desc: 'Vodka, lemon soda' },
  { nome: 'Caipiroska Fragola', desc: 'Vodka, limone, top alle fragole' },
  { nome: 'Sex on the Beach', desc: 'Vodka, pesca, arancia, mirtilli' },
  { nome: 'Long Island', desc: 'Tequila, gin, vodka, rum, Coca Cola' },
  { nome: 'Alexander', desc: 'Gin, vodka, rum, tequila, Blue Curaçao' },
  { nome: 'Japanese Ice Tea', desc: 'Vodka, rum, gin, Midori, sweet&sour, limone' },
  { nome: 'Samu', desc: 'Aperol, limoncello, Fuoco dell’Etna' },
];

export const prezzoCocktail = '6,00';

/**
 * LA SALA GIOCHI — non solo cibo e birra: ad Arkadia si gioca.
 */
export const giochi = {
  occhiello: 'La Sala Giochi',
  titolo: 'Qui non si viene solo per bere',
  intro:
    'Tra una pinta e un panino, la serata continua: sfida i tuoi amici e falla durare quanto vuoi.',
  lista: [
    {
      nome: 'Giochi da tavolo',
      desc: 'Una selezione sempre pronta al bancone: scegli la scatola e occupate il tavolo.',
      icona: 'dado',
    },
    {
      nome: 'Freccette',
      desc: 'Il bersaglio è appeso e ti aspetta. Occhio al triplo 20.',
      icona: 'freccette',
    },
    {
      nome: 'Nintendo Switch',
      desc: 'Console a disposizione per tornei improvvisati tra amici.',
      icona: 'console',
    },
    {
      nome: 'Carte da gioco',
      desc: 'Napoletane, romagnole, francesi: qualunque sia la tua partita, il mazzo ce l’abbiamo.',
      icona: 'carte',
    },
    {
      nome: 'Biliardino',
      desc: 'Rosso contro blu, niente scuse: chi perde offre il giro.',
      icona: 'biliardino',
    },
  ],
};

/**
 * LA SCAFFALATA — i giochi da tavolo disponibili al bancone.
 * ⚠️ LISTA IN ARRIVO dal titolare: aggiungere qui ogni scatola con
 * { nome, desc?, giocatori?, durata? }. Finché è vuota, /menu mostra
 * una nota "chiedi al bancone".
 */
export const giochiTavolo: { nome: string; desc?: string; giocatori?: string; durata?: string }[] = [];

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
    'Luci calde, tavoli veri, la spina che scorre. Arkadia è il posto che ti trattiene: un\'altra partita, un\'altra chiacchiera, un\'altra birra.',
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
