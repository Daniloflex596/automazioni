// Versioni di export per destinazione: la promessa "pronta all'uso" resa
// concreta. Ogni piattaforma ha il suo standard di volume; l'utente non deve
// saperlo — sceglie DOVE pubblicherà, non un numero di LUFS.
//
// Il livello è misurato in RMS (approssimazione del loudness adeguata al
// prototipo); il guadagno verso il target è sempre limitato dal tetto sui
// picchi: nessuna versione esportata può distorcere per clipping.
// MP3 e altri formati compressi restano Fase 2 (serve una libreria di codifica).

import { audioBufferToWav } from './wav.js';

export const EXPORT_TARGETS = [
  {
    id: 'master',
    emoji: '🎧',
    name: 'Master',
    desc: 'Esattamente ciò che hai ascoltato, a piena qualità. La versione da archiviare.',
    targetRms: null,
    ceilingDb: -0.15,
  },
  {
    id: 'streaming',
    emoji: '🟢',
    name: 'Streaming',
    desc: 'Volume allineato agli standard di Spotify, Apple Music e YouTube: non verrà abbassato dalle piattaforme.',
    targetRms: -14,
    ceilingDb: -1,
  },
  {
    id: 'social',
    emoji: '📱',
    name: 'Social',
    desc: 'Più spinto, per TikTok, Reels e Shorts: si fa sentire anche dallo speaker del telefono.',
    targetRms: -10,
    ceilingDb: -1,
  },
];

// Crea la versione per il target: copia il render, applica il guadagno verso
// il loudness di destinazione (limitato dal tetto sui picchi) e codifica WAV.
export function makeVersionBlob(buffer, target) {
  const { peak, rmsDb } = measureLevels(buffer);
  const ceiling = Math.pow(10, target.ceilingDb / 20);

  let gain = target.targetRms === null ? 1 : Math.pow(10, (target.targetRms - rmsDb) / 20);
  const maxGain = peak > 1e-6 ? ceiling / peak : 1;
  gain = Math.min(gain, maxGain);

  const channels = [];
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const source = buffer.getChannelData(ch);
    const copy = new Float32Array(source.length);
    for (let i = 0; i < source.length; i++) copy[i] = source[i] * gain;
    channels.push(copy);
  }

  const scaled = {
    numberOfChannels: buffer.numberOfChannels,
    length: buffer.length,
    sampleRate: buffer.sampleRate,
    getChannelData: (ch) => channels[ch],
  };

  return { blob: audioBufferToWav(scaled), gainDb: 20 * Math.log10(gain || 1e-6) };
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
