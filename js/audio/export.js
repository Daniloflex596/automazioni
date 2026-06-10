// Versioni di export per destinazione: la promessa "pronta all'uso" resa
// concreta. Ogni piattaforma ha il suo standard di volume; l'utente non deve
// saperlo — sceglie DOVE pubblicherà, non un numero di LUFS.
//
// Il livello è una stima LUFS-like (K-weighting + gating, vedi loudness.js).
// Streaming e Social raggiungono il target con un limiter look-ahead sul
// tetto dei picchi: il volume di destinazione arriva davvero, senza clipping.
// Il Master resta trasparente: nessun limiter, solo protezione sui picchi.
// MP3 e altri formati compressi restano Fase 2 (serve una libreria di codifica).

import { audioBufferToWav } from './wav.js';
import { measureLoudness, limitChannels } from './loudness.js';

export const EXPORT_TARGETS = [
  {
    id: 'master',
    emoji: '🎧',
    name: 'Master',
    desc: 'Esattamente ciò che hai ascoltato, a piena qualità. La versione da archiviare.',
    targetLufs: null,
    ceilingDb: -0.15,
  },
  {
    id: 'streaming',
    emoji: '🟢',
    name: 'Streaming',
    desc: 'Volume allineato agli standard di Spotify, Apple Music e YouTube: non verrà abbassato dalle piattaforme.',
    targetLufs: -14,
    ceilingDb: -1,
  },
  {
    id: 'social',
    emoji: '📱',
    name: 'Social',
    desc: 'Più spinto, per TikTok, Reels e Shorts: si fa sentire anche dallo speaker del telefono.',
    targetLufs: -10,
    ceilingDb: -1,
  },
];

// Limite di sicurezza sul guadagno verso il target (+20 dB): evita di
// "sparare" materiale quasi silenzioso fino al rumore.
const MAX_GAIN = 10;

// Crea la versione per il target: copia il render, applica il guadagno verso
// il loudness di destinazione (stima LUFS-like), passa dal limiter per
// rispettare il tetto sui picchi e codifica WAV.
export function makeVersionBlob(buffer, target) {
  const { peak } = measureLevels(buffer);
  const ceiling = Math.pow(10, target.ceilingDb / 20);

  let gain = 1;
  if (target.targetLufs === null) {
    // Master: trasparente — riduce solo se i picchi superano il tetto
    gain = peak > ceiling ? ceiling / peak : 1;
  } else {
    const lufs = measureLoudness(buffer);
    if (Number.isFinite(lufs)) {
      gain = Math.min(MAX_GAIN, Math.pow(10, (target.targetLufs - lufs) / 20));
    }
  }

  const channels = [];
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const source = buffer.getChannelData(ch);
    const copy = new Float32Array(source.length);
    for (let i = 0; i < source.length; i++) copy[i] = source[i] * gain;
    channels.push(copy);
  }

  // il limiter lavora solo sulle versioni con un target di destinazione:
  // tiene il volume raggiunto E i picchi sotto il tetto
  if (target.targetLufs !== null) {
    limitChannels(channels, buffer.sampleRate, ceiling);
  }

  const scaled = {
    numberOfChannels: buffer.numberOfChannels,
    length: buffer.length,
    sampleRate: buffer.sampleRate,
    getChannelData: (ch) => channels[ch],
  };

  return { blob: audioBufferToWav(scaled), gainDb: 20 * Math.log10(gain || 1e-6) };
}

// SNIPPET SOCIAL (release package): un estratto breve del brano, tagliato sul
// segmento più energico, pensato per TikTok/Reels/Shorts. È coerente con
// l'identità scelta per costruzione: si ricava dallo stesso render della
// catena di elaborazione, poi viene portato al volume Social. Niente stem,
// niente analisi del cantato: l'"hook" è il punto di massima energia, una
// approssimazione onesta e dichiarata (come il resto del prototipo).
export const SNIPPET = {
  emoji: '✂️',
  name: 'Snippet social',
  seconds: 20, // dentro il range 15-30 richiesto dal prodotto
  desc: 'Il momento più forte del brano, circa 20 secondi, al volume giusto per TikTok, Reels e Shorts.',
};

// Crea lo snippet dal render: trova la finestra più energica, la ritaglia con
// dissolvenze anti-click e la porta al volume Social. Se il brano è più corto
// dello snippet, l'estratto è il brano intero.
export function makeSnippetBlob(buffer, seconds = SNIPPET.seconds) {
  const frames = Math.min(buffer.length, Math.round(seconds * buffer.sampleRate));
  const start = findLoudestWindowStart(buffer, frames);
  const fade = Math.min(Math.round(0.5 * buffer.sampleRate), Math.floor(frames / 8));

  const channels = [];
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const source = buffer.getChannelData(ch);
    const copy = new Float32Array(frames);
    for (let i = 0; i < frames; i++) copy[i] = source[start + i];
    for (let i = 0; i < fade; i++) {
      const ramp = i / fade;
      copy[i] *= ramp;
      copy[frames - 1 - i] *= ramp;
    }
    channels.push(copy);
  }

  const sliced = {
    numberOfChannels: buffer.numberOfChannels,
    length: frames,
    sampleRate: buffer.sampleRate,
    getChannelData: (ch) => channels[ch],
  };

  const social = EXPORT_TARGETS.find((target) => target.id === 'social');
  const { blob } = makeVersionBlob(sliced, social);
  return { blob, startSeconds: start / buffer.sampleRate, seconds: frames / buffer.sampleRate };
}

// Finestra di massima energia: somma dei quadrati su blocchi da ~0,25 s del
// mix mono, poi scorrimento della finestra sulla somma cumulata dei blocchi.
function findLoudestWindowStart(buffer, windowFrames) {
  if (windowFrames >= buffer.length) return 0;
  const chans = [];
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) chans.push(buffer.getChannelData(ch));

  const block = Math.max(1, Math.round(buffer.sampleRate * 0.25));
  const blockCount = Math.ceil(buffer.length / block);
  const energies = new Float64Array(blockCount);
  for (let i = 0; i < buffer.length; i++) {
    let mono = 0;
    for (const data of chans) mono += data[i];
    mono /= chans.length;
    energies[(i / block) | 0] += mono * mono;
  }

  const blocksPerWindow = Math.max(1, Math.round(windowFrames / block));
  let sum = 0;
  for (let b = 0; b < Math.min(blocksPerWindow, blockCount); b++) sum += energies[b];
  let best = sum;
  let bestBlock = 0;
  for (let b = 1; b + blocksPerWindow <= blockCount; b++) {
    sum += energies[b + blocksPerWindow - 1] - energies[b - 1];
    if (sum > best) { best = sum; bestBlock = b; }
  }
  return Math.min(bestBlock * block, buffer.length - windowFrames);
}

export function measureLevels(buffer) {
  const chans = [];
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) chans.push(buffer.getChannelData(ch));
  let peak = 0;
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    let mono = 0;
    for (const data of chans) {
      const sample = data[i];
      mono += sample;
      const abs = Math.abs(sample);
      if (abs > peak) peak = abs;
    }
    mono /= chans.length;
    sumSquares += mono * mono;
  }
  const rms = Math.sqrt(sumSquares / buffer.length);
  return { peak, rmsDb: rms <= 1e-8 ? -96 : 20 * Math.log10(rms) };
}
