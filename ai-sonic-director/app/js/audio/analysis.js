// Analisi reale del brano: volume, dinamica, bilanciamento tonale, forma d'onda.
// L'output tecnico viene tradotto in osservazioni in linguaggio da artista:
// l'analisi serve a far sentire all'utente che l'app "ha capito il suo brano".
//
// NOTA DI FASE: analisi di base (vedi docs/FONTE_DI_VERITA.md §5). Nell'MVP si
// aggiungeranno BPM, tonalità e diagnosi più specifiche.

const FFT_SIZE = 2048;
const ANALYSIS_WINDOWS = 48;

export function analyzeBuffer(buffer) {
  const mono = mixToMono(buffer);
  const { peak, rms } = computeLevels(mono);
  const peakDb = toDb(peak);
  const rmsDb = toDb(rms);
  const crest = peakDb - rmsDb;
  const bands = computeBands(mono, buffer.sampleRate);

  return {
    duration: buffer.duration,
    sampleRate: buffer.sampleRate,
    channels: buffer.numberOfChannels,
    peakDb: round1(peakDb),
    rmsDb: round1(rmsDb),
    crest: round1(crest),
    bands, // { low, mid, high } percentuali che sommano a 100
    insights: buildInsights({ rmsDb, crest, bands }),
  };
}

// Picchi min/max per disegnare la forma d'onda su canvas.
export function computeWaveformPeaks(buffer, bucketCount = 600) {
  const mono = mixToMono(buffer);
  const bucketSize = Math.max(1, Math.floor(mono.length / bucketCount));
  const peaks = [];
  for (let b = 0; b < bucketCount; b++) {
    const start = b * bucketSize;
    let min = 0;
    let max = 0;
    for (let i = start; i < Math.min(start + bucketSize, mono.length); i++) {
      if (mono[i] < min) min = mono[i];
      if (mono[i] > max) max = mono[i];
    }
    peaks.push([min, max]);
  }
  return peaks;
}

// ---------- interni ----------

function mixToMono(buffer) {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const mono = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) mono[i] = (left[i] + right[i]) / 2;
  return mono;
}

function computeLevels(samples) {
  let peak = 0;
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
    sumSquares += samples[i] * samples[i];
  }
  return { peak, rms: Math.sqrt(sumSquares / samples.length) };
}

function toDb(value) {
  return value <= 1e-8 ? -96 : 20 * Math.log10(value);
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

// Energia per banda (bassi <250 Hz, medi 250-4000 Hz, alti >4000 Hz) calcolata
// con FFT su finestre distribuite lungo tutto il brano.
function computeBands(samples, sampleRate) {
  const energies = { low: 0, mid: 0, high: 0 };
  const usable = samples.length - FFT_SIZE;
  if (usable <= 0) return { low: 33, mid: 34, high: 33 };

  const step = Math.max(1, Math.floor(usable / ANALYSIS_WINDOWS));
  const real = new Float32Array(FFT_SIZE);
  const imag = new Float32Array(FFT_SIZE);
  const binHz = sampleRate / FFT_SIZE;

  for (let start = 0; start + FFT_SIZE <= samples.length; start += step) {
    for (let i = 0; i < FFT_SIZE; i++) {
      // finestra di Hann per ridurre il leakage spettrale
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
      real[i] = samples[start + i] * hann;
      imag[i] = 0;
    }
    fft(real, imag);
    for (let bin = 1; bin < FFT_SIZE / 2; bin++) {
      const freq = bin * binHz;
      const magnitude = real[bin] * real[bin] + imag[bin] * imag[bin];
      if (freq < 250) energies.low += magnitude;
      else if (freq < 4000) energies.mid += magnitude;
      else energies.high += magnitude;
    }
  }

  const total = energies.low + energies.mid + energies.high || 1;
  return {
    low: Math.round((energies.low / total) * 100),
    mid: Math.round((energies.mid / total) * 100),
    high: Math.round((energies.high / total) * 100),
  };
}

// FFT radix-2 iterativa, in place.
function fft(real, imag) {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curReal = 1;
      let curImag = 0;
      for (let k = 0; k < len / 2; k++) {
        const evenR = real[i + k];
        const evenI = imag[i + k];
        const oddR = real[i + k + len / 2] * curReal - imag[i + k + len / 2] * curImag;
        const oddI = real[i + k + len / 2] * curImag + imag[i + k + len / 2] * curReal;
        real[i + k] = evenR + oddR;
        imag[i + k] = evenI + oddI;
        real[i + k + len / 2] = evenR - oddR;
        imag[i + k + len / 2] = evenI - oddI;
        const nextReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = nextReal;
      }
    }
  }
}

// Traduzione delle misure in osservazioni comprensibili per l'artista.
function buildInsights({ rmsDb, crest, bands }) {
  const insights = [];

  if (rmsDb < -22) {
    insights.push({
      icon: '🔈',
      title: 'Volume sotto gli standard',
      text: 'Il brano è più piano rispetto a quelli che senti nelle playlist. Le identità sonore lo porteranno a un livello competitivo.',
    });
  } else if (rmsDb > -11) {
    insights.push({
      icon: '🔥',
      title: 'Già molto spinto',
      text: 'Il volume medio è già alto: lavoreremo più sul carattere che sulla potenza, per non schiacciarlo.',
    });
  } else {
    insights.push({
      icon: '✅',
      title: 'Volume in zona sana',
      text: 'Il livello medio è in una buona zona di partenza: c’è spazio per dare carattere senza forzare.',
    });
  }

  if (crest > 15) {
    insights.push({
      icon: '🌊',
      title: 'Dinamica molto aperta',
      text: 'Ci sono grandi differenze tra i momenti piano e quelli forte. Un po’ di controllo renderà il brano più stabile all’ascolto.',
    });
  } else if (crest < 8) {
    insights.push({
      icon: '🧱',
      title: 'Dinamica già compressa',
      text: 'Il brano respira poco: meglio identità delicate, spingere ancora rischierebbe di affaticarlo.',
    });
  }

  if (bands.low > 45) {
    insights.push({
      icon: '🌑',
      title: 'Bassi dominanti',
      text: 'Le basse frequenze guidano il brano. Ottimo per mood scuri e da club; le identità più chiare le terranno in equilibrio.',
    });
  } else if (bands.low < 22) {
    insights.push({
      icon: '🪶',
      title: 'Bassi leggeri',
      text: 'Il brano è chiaro e leggero in basso. Le identità con più Calore gli daranno corpo.',
    });
  }

  if (bands.high < 12) {
    insights.push({
      icon: '🌫️',
      title: 'Poca aria in alto',
      text: 'Le frequenze alte sono timide: un tocco di Brillantezza aprirà il suono.',
    });
  } else if (bands.high > 32) {
    insights.push({
      icon: '✨',
      title: 'Molto brillante',
      text: 'Il brano ha tanta energia in alto: attenzione a non aggiungerne troppa con la Brillantezza.',
    });
  }

  return insights.slice(0, 4);
}
