// Le identità sonore sono il cuore del prodotto: direzioni creative con nome e
// caso d'uso, non preset tecnici. Ogni identità definisce i valori base della
// catena di elaborazione; i controlli macro (Calore, Punch, Brillantezza,
// Spazio) la rifiniscono senza esporre parametri da fonico.
//
// ADATTIVITÀ DI BASE (primo mattone di Fase 2, anticipato nel prototipo):
// se viene passata l'analisi del brano, i dosaggi dell'identità si adattano a
// ciò che è stato misurato — bassi già presenti vengono spinti meno, brani già
// compressi vengono trattati con mano più leggera, il volume viene portato
// verso il riferimento dell'identità. Le regole sono semplici e dichiarate;
// l'analisi ricca (BPM, tonalità, diagnosi specifiche) resta da MVP.

export const IDENTITIES = [
  {
    id: 'club',
    emoji: '🔊',
    name: 'Club Ready',
    description: 'Bassi solidi, energia in avanti, volume da impianto. Per far muovere la sala.',
    useCase: 'Serate, DJ set, playlist energiche',
    targetRms: -9.5,
    base: { low: 3.5, mid: 0, high: 2.5, drive: 0.12, threshold: -24, ratio: 4, makeup: 1.22, wet: 0.06 },
  },
  {
    id: 'radio',
    emoji: '📻',
    name: 'Radio Pulito',
    description: 'Voce in primo piano, suono bilanciato e ordinato. La versione che si presenta bene ovunque.',
    useCase: 'Release ufficiali, streaming, demo per etichette',
    targetRms: -12,
    base: { low: 1.5, mid: 2, high: 1.8, drive: 0.06, threshold: -18, ratio: 3, makeup: 1.12, wet: 0.05 },
  },
  {
    id: 'lofi',
    emoji: '🌫️',
    name: 'Lo-Fi Caldo',
    description: 'Morbido, vissuto, avvolgente. Toglie lucidità e aggiunge carattere.',
    useCase: 'Chill, studio playlist, atmosfere notturne',
    targetRms: -14,
    base: { low: 4, mid: -1, high: -5.5, drive: 0.32, threshold: -20, ratio: 3, makeup: 1.1, wet: 0.18 },
  },
  {
    id: 'dark',
    emoji: '🌑',
    name: 'Trap Scura',
    description: 'Bassi profondi, alte controllate, pressione costante. Suono pesante e moderno.',
    useCase: 'Trap, drill, brani dal mood scuro',
    targetRms: -10.5,
    base: { low: 5, mid: -2, high: -2, drive: 0.18, threshold: -26, ratio: 4.5, makeup: 1.25, wet: 0.08 },
  },
  {
    id: 'natural',
    emoji: '🪵',
    name: 'Acustico Naturale',
    description: 'Tocco leggero: pulizia e aria, senza snaturare la dinamica originale.',
    useCase: 'Acustico, cantautorato, session live',
    targetRms: -16,
    base: { low: 1, mid: 0.5, high: 1.5, drive: 0.04, threshold: -12, ratio: 2, makeup: 1.05, wet: 0.12 },
  },
  {
    id: 'social',
    emoji: '⚡',
    name: 'Social Punch',
    description: 'Forte, brillante, immediato. Pensato per catturare nei primi tre secondi.',
    useCase: 'TikTok, Reels, Shorts, anteprime',
    targetRms: -9,
    base: { low: 2, mid: 1.5, high: 3, drive: 0.16, threshold: -28, ratio: 5, makeup: 1.32, wet: 0.04 },
  },
];

export function getIdentity(id) {
  return IDENTITIES.find((identity) => identity.id === id) || null;
}

// Traduce identità + macro (0-100, 50 = neutro) + analisi del brano nei
// parametri della catena. È l'unico punto in cui il linguaggio dell'artista
// diventa linguaggio tecnico.
export function computeParams(identity, macros, analysis = null) {
  const base = identity.base;
  const offset = (value) => (value - 50) / 50; // -1 .. +1
  const adapt = adaptiveOffsets(identity, analysis);

  const calore = offset(macros.calore);
  const punch = offset(macros.punch);
  const brillantezza = offset(macros.brillantezza);
  const spazio = offset(macros.spazio);

  return {
    low: base.low + calore * 4 + adapt.low,                       // dB, shelf 120 Hz
    mid: base.mid,                                                // dB, campana 2.5 kHz
    high: base.high + brillantezza * 5 + adapt.high,              // dB, shelf 7.5 kHz
    drive: Math.max(0, base.drive * (1 + calore * 0.8)),          // saturazione 0..~0.6
    threshold: Math.min(-4, base.threshold - punch * 8 + adapt.threshold), // dB
    ratio: Math.max(1.5, base.ratio + punch * 1.5 + adapt.ratio),
    makeup: Math.max(0.8, (base.makeup + punch * 0.12) * adapt.gainTrim),  // gain lineare
    wet: Math.min(0.5, Math.max(0, base.wet + spazio * 0.2)),     // riverbero
  };
}

// Correzioni calcolate dall'analisi del brano. Tutte clampate: l'adattività
// dosa l'identità, non la stravolge.
function adaptiveOffsets(identity, analysis) {
  if (!analysis || !analysis.bands) {
    return { low: 0, high: 0, threshold: 0, ratio: 0, gainTrim: 1, liftDb: 0 };
  }
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  // Bilanciamento tonale: 36% di bassi e 22% di alti come riferimento neutro.
  const low = clamp((36 - analysis.bands.low) * 0.12, -2.5, 2.5);
  const high = clamp((22 - analysis.bands.high) * 0.12, -2.5, 2.5);

  // Dinamica: brani già compressi (crest basso) → mano più leggera;
  // brani molto aperti → più controllo.
  const threshold = clamp((11 - analysis.crest) * 0.8, -4, 4);
  const ratio = clamp((analysis.crest - 11) * 0.15, -0.8, 0.8);

  // Volume: avvicina (al 60%, con prudenza) il livello misurato al
  // riferimento dell'identità.
  const liftDb = clamp((identity.targetRms - analysis.rmsDb) * 0.6, -6, 8);
  const gainTrim = Math.pow(10, liftDb / 20);

  return { low, high, threshold, ratio, gainTrim, liftDb };
}

// Spiega all'utente, in linguaggio da artista, come l'identità si è adattata
// al suo brano. La trasparenza è parte del valore: l'app "ha ascoltato".
export function adaptationNotes(identity, analysis) {
  if (!analysis || !analysis.bands) return [];
  const adapt = adaptiveOffsets(identity, analysis);
  const notes = [];

  if (adapt.low < -1) notes.push('I tuoi bassi sono già presenti: li dosiamo con più delicatezza.');
  else if (adapt.low > 1) notes.push('Il brano è leggero in basso: gli diamo più corpo.');

  if (adapt.high > 1) notes.push('C’è poca aria in alto: apriamo un po’ le frequenze alte.');
  else if (adapt.high < -1) notes.push('Il brano è già brillante: teniamo le alte sotto controllo.');

  if (adapt.threshold > 2) notes.push('Il brano è già compresso: comprimiamo con mano leggera.');
  else if (adapt.threshold < -2) notes.push('La dinamica è molto aperta: aggiungiamo controllo per stabilizzarla.');

  if (adapt.liftDb > 2) notes.push(`Portiamo il volume verso il riferimento di ${identity.name}.`);
  else if (adapt.liftDb < -2) notes.push('Il brano è già molto forte: non lo spingiamo oltre.');

  if (notes.length === 0) notes.push('Il tuo brano è già equilibrato: l’identità si applica nella sua forma piena.');
  return notes;
}
