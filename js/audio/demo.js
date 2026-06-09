// Brano demo generato proceduralmente (trap strumentale, 140 BPM, La minore).
// Permette di provare l'intero flusso senza avere un file a portata di mano:
// è parte del blocco "demo e rifinitura" del piano (vedi docs/PIANO_PRODOTTO.md §7.5).

import { audioBufferToWav } from './wav.js';

const SAMPLE_RATE = 44100;
const BPM = 140;
const BARS = 8;

export const DEMO_FILE_NAME = 'demo-track.wav';

export async function generateDemoTrack() {
  const beat = 60 / BPM;
  const sixteenth = beat / 4;
  const barDuration = beat * 4;
  const duration = barDuration * BARS + 1.2; // coda per il release del pad

  const ctx = new OfflineAudioContext(2, Math.ceil(SAMPLE_RATE * duration), SAMPLE_RATE);
  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);

  const noise = makeNoiseBuffer(ctx);

  // Giro armonico di 2 battute per accordo: Am, F, C, G (frequenze in Hz)
  const chords = [
    [110.0, 130.81, 164.81], // Am
    [87.31, 110.0, 130.81],  // F
    [130.81, 164.81, 196.0], // C
    [98.0, 123.47, 146.83],  // G
  ];
  const bassNotes = [55.0, 43.65, 65.41, 49.0]; // A1, F1, C2, G1

  for (let bar = 0; bar < BARS; bar++) {
    const barStart = bar * barDuration;
    const chordIndex = Math.floor(bar / 2) % chords.length;

    pad(ctx, master, chords[chordIndex], barStart, barDuration);

    if (bar % 2 === 0) {
      bass808(ctx, master, bassNotes[chordIndex], barStart, beat * 1.6);
      bass808(ctx, master, bassNotes[chordIndex], barStart + sixteenth * 10, beat * 1.2);
    } else {
      bass808(ctx, master, bassNotes[chordIndex], barStart + sixteenth * 4, beat * 1.4);
    }

    kick(ctx, master, barStart);
    kick(ctx, master, barStart + sixteenth * 7);
    kick(ctx, master, barStart + sixteenth * 10);
    clap(ctx, master, noise, barStart + beat * 2);

    for (let step = 0; step < 16; step += 2) {
      hat(ctx, master, noise, barStart + step * sixteenth, 0.1);
    }
    if (bar % 2 === 1) {
      for (let step = 12; step < 16; step++) {
        hat(ctx, master, noise, barStart + step * sixteenth, 0.06);
      }
    }
  }

  const rendered = await ctx.startRendering();
  normalize(rendered, 0.85);
  return audioBufferToWav(rendered);
}

// ---------- strumenti ----------

function kick(ctx, out, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
  gain.gain.setValueAtTime(0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
  osc.connect(gain).connect(out);
  osc.start(time);
  osc.stop(time + 0.4);
}

function bass808(ctx, out, freq, time, length) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(freq * 1.5, time);
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.06);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.5, time + 0.02);
  gain.gain.setValueAtTime(0.5, time + length * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, time + length);
  osc.connect(gain).connect(out);
  osc.start(time);
  osc.stop(time + length + 0.05);
}

function hat(ctx, out, noise, time, level) {
  const source = ctx.createBufferSource();
  source.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 8000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(level, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  source.connect(filter).connect(gain).connect(out);
  source.start(time, 0.2, 0.06);
}

function clap(ctx, out, noise, time) {
  const source = ctx.createBufferSource();
  source.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  filter.Q.value = 1.2;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.45, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
  source.connect(filter).connect(gain).connect(out);
  source.start(time, 0.5, 0.22);
}

function pad(ctx, out, freqs, time, length) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1100;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.045, time + 0.4);
  gain.gain.setValueAtTime(0.045, time + length - 0.3);
  gain.gain.linearRampToValueAtTime(0.0001, time + length + 0.8);
  filter.connect(gain).connect(out);

  for (const freq of freqs) {
    for (const detune of [-6, 6]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + length + 1);
    }
  }
}

// ---------- utilità ----------

function makeNoiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function normalize(buffer, target) {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }
  if (peak < 1e-6) return;
  const scale = target / peak;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) data[i] *= scale;
  }
}
