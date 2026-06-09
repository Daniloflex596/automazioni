// Le identità sonore sono il cuore del prodotto: direzioni creative con nome e
// caso d'uso, non preset tecnici. Ogni identità definisce i valori base della
// catena di elaborazione; i controlli macro (Calore, Punch, Brillantezza,
// Spazio) la rifiniscono senza esporre parametri da fonico.
//
// NOTA DI FASE (vedi docs/FONTE_DI_VERITA.md §5): nel prototipo le catene non
// sono adattive — applicano gli stessi valori a ogni brano. Nell'MVP i valori
// base andranno modulati dall'analisi del singolo brano.

export const IDENTITIES = [
  {
    id: 'club',
    emoji: '🔊',
    name: 'Club Ready',
    description: 'Bassi solidi, energia in avanti, volume da impianto. Per far muovere la sala.',
    useCase: 'Serate, DJ set, playlist energiche',
    base: { low: 3.5, mid: 0, high: 2.5, drive: 0.12, threshold: -24, ratio: 4, makeup: 1.22, wet: 0.06 },
  },
  {
    id: 'radio',
    emoji: '📻',
    name: 'Radio Pulito',
    description: 'Voce in primo piano, suono bilanciato e ordinato. La versione che si presenta bene ovunque.',
    useCase: 'Release ufficiali, streaming, demo per etichette',
    base: { low: 1.5, mid: 2, high: 1.8, drive: 0.06, threshold: -18, ratio: 3, makeup: 1.12, wet: 0.05 },
  },
  {
    id: 'lofi',
    emoji: '🌫️',
    name: 'Lo-Fi Caldo',
    description: 'Morbido, vissuto, avvolgente. Toglie lucidità e aggiunge carattere.',
    useCase: 'Chill, studio playlist, atmosfere notturne',
    base: { low: 4, mid: -1, high: -5.5, drive: 0.32, threshold: -20, ratio: 3, makeup: 1.1, wet: 0.18 },
  },
  {
    id: 'dark',
    emoji: '🌑',
    name: 'Trap Scura',
    description: 'Bassi profondi, alte controllate, pressione costante. Suono pesante e moderno.',
    useCase: 'Trap, drill, brani dal mood scuro',
    base: { low: 5, mid: -2, high: -2, drive: 0.18, threshold: -26, ratio: 4.5, makeup: 1.25, wet: 0.08 },
  },
  {
    id: 'natural',
    emoji: '🪵',
    name: 'Acustico Naturale',
    description: 'Tocco leggero: pulizia e aria, senza snaturare la dinamica originale.',
    useCase: 'Acustico, cantautorato, session live',
    base: { low: 1, mid: 0.5, high: 1.5, drive: 0.04, threshold: -12, ratio: 2, makeup: 1.05, wet: 0.12 },
  },
  {
    id: 'social',
    emoji: '⚡',
    name: 'Social Punch',
    description: 'Forte, brillante, immediato. Pensato per catturare nei primi tre secondi.',
    useCase: 'TikTok, Reels, Shorts, anteprime',
    base: { low: 2, mid: 1.5, high: 3, drive: 0.16, threshold: -28, ratio: 5, makeup: 1.32, wet: 0.04 },
  },
];

export function getIdentity(id) {
  return IDENTITIES.find((identity) => identity.id === id) || null;
}

// Traduce identità + macro (0-100, 50 = neutro) nei parametri della catena.
// È l'unico punto in cui il linguaggio dell'artista diventa linguaggio tecnico.
export function computeParams(identity, macros) {
  const base = identity.base;
  const offset = (value) => (value - 50) / 50; // -1 .. +1

  const calore = offset(macros.calore);
  const punch = offset(macros.punch);
  const brillantezza = offset(macros.brillantezza);
  const spazio = offset(macros.spazio);

  return {
    low: base.low + calore * 4,                                   // dB, shelf 120 Hz
    mid: base.mid,                                                // dB, campana 2.5 kHz
    high: base.high + brillantezza * 5,                           // dB, shelf 7.5 kHz
    drive: Math.max(0, base.drive * (1 + calore * 0.8)),          // saturazione 0..~0.6
    threshold: Math.min(-4, base.threshold - punch * 8),          // dB
    ratio: Math.max(1.5, base.ratio + punch * 1.5),
    makeup: Math.max(0.8, base.makeup + punch * 0.12),            // gain lineare
    wet: Math.min(0.5, Math.max(0, base.wet + spazio * 0.2)),     // riverbero
  };
}
