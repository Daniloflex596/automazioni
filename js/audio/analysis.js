// Analisi reale del brano: volume, dinamica, bilanciamento tonale, forma d'onda,
// più STIME di BPM e tonalità (B1). L'output tecnico viene tradotto in
// osservazioni in linguaggio da artista: l'analisi serve a far sentire
// all'utente che l'app "ha capito il suo brano".
//
// BPM e tonalità sono stime con livello di confidenza: se la confidenza è
// insufficiente, `reliable` è false e la UI mostra un fallback onesto invece
// di un numero sicuro ma sbagliato.

const FFT_SIZE = 2048;
const ANALYSIS_WINDOWS = 48;

export function analyzeBuffer(buffer) {
  const mono = mixToMono(buffer);
  const { peak, rms } = computeLevels(mono);
  const peakDb = toDb(peak);
  const rmsDb = toDb(rms);
  const crest = peakDb - rmsDb;
  const { bands, chroma } = computeSpectralFeatures(mono, buffer.sampleRate);
  const tempo = estimateTempo(mono, buffer.sampleRate);
  const key = estimateKey(chroma);

  return {
    duration: buffer.duration,
    sampleRate: buffer.sampleRate,
    channels: buffer.numberOfChannels,
    peakDb: round1(peakDb),
    rmsDb: round1(rmsDb),
    crest: round1(crest),
    bands, // { low, mid, high } percentuali che sommano a 100
    tempo, // { bpm, confidence, reliable } — stima, mai verità assoluta
    key,   // { name, confidence, reliable } — stima, mai verità assoluta
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

// Energia per banda (bassi <250 Hz, medi 250-4000 Hz, alti >4000 Hz) e profilo
// chroma (energia per classe di nota, per la stima della tonalità), calcolati
// nello stesso passaggio FFT su finestre distribuite lungo tutto il brano.
function computeSpectralFeatures(samples, sampleRate) {
  const energies = { low: 0, mid: 0, high: 0 };
  const chroma = new Float64Array(12);
  const usable = samples.length - FFT_SIZE;
  if (usable <= 0) return { bands: { low: 33, mid: 34, high: 33 }, chroma };

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

      // chroma sulla zona armonica utile; ampiezza (non energia) per non
      // far dominare i picchi più forti
      if (freq >= 55 && freq <= 2000) {
        const midi = 69 + 12 * Math.log2(freq / 440);
        const pitchClass = ((Math.round(midi) % 12) + 12) % 12;
        chroma[pitchClass] += Math.sqrt(magnitude);
      }
    }
  }

  const total = energies.low + energies.mid + energies.high || 1;
  return {
    bands: {
      low: Math.round((energies.low / total) * 100),
      mid: Math.round((energies.mid / total) * 100),
      high: Math.round((energies.high / total) * 100),
    },
    chroma,
  };
}

// ---------- stima del tempo (BPM) ----------
// Onset per FLUSSO SPETTRALE (quanta parte dello spettro "si accende" frame
// dopo frame): sente anche i transienti leggeri che marcano il beat (hi-hat),
// non solo cassa e bassi. Poi autocorrelazione sui ritardi 60-200 BPM con
// punteggio "a pettine". La confidenza è l'autocorrelazione normalizzata del
// miglior ritardo: bassa per materiale senza ritmo (es. toni continui), e in
// quel caso non ci esponiamo.

const TEMPO_HOP = 512;
const TEMPO_FFT = 1024;
const TEMPO_MAX_SECONDS = 90; // segmento centrale: basta e tiene i tempi bassi

function estimateTempo(samples, sampleRate) {
  const hop = TEMPO_HOP;
  const envRate = sampleRate / hop;
  const minLag = Math.max(1, Math.floor((60 / 200) * envRate));
  const maxLag = Math.ceil((60 / 60) * envRate);

  // segmento centrale del brano, al massimo TEMPO_MAX_SECONDS
  const maxSamples = Math.min(samples.length, Math.floor(TEMPO_MAX_SECONDS * sampleRate));
  const segStart = Math.floor((samples.length - maxSamples) / 2);
  const frames = Math.floor((maxSamples - TEMPO_FFT) / hop);
  if (frames < maxLag * 3) return { bpm: null, confidence: 0, reliable: false };

  // flusso spettrale: somma degli aumenti di ampiezza per bin tra frame consecutivi
  const real = new Float32Array(TEMPO_FFT);
  const imag = new Float32Array(TEMPO_FFT);
  const prevMag = new Float32Array(TEMPO_FFT / 2);
  const onset = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    const start = segStart + f * hop;
    for (let i = 0; i < TEMPO_FFT; i++) {
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (TEMPO_FFT - 1)));
      real[i] = samples[start + i] * hann;
      imag[i] = 0;
    }
    fft(real, imag);
    let flux = 0;
    for (let bin = 1; bin < TEMPO_FFT / 2; bin++) {
      const mag = Math.sqrt(real[bin] * real[bin] + imag[bin] * imag[bin]);
      if (f > 0) flux += Math.max(0, mag - prevMag[bin]);
      prevMag[bin] = mag;
    }
    onset[f] = flux;
  }

  let mean = 0;
  for (let f = 0; f < frames; f++) mean += onset[f];
  mean /= frames;
  let r0 = 0;
  for (let f = 0; f < frames; f++) {
    onset[f] -= mean;
    r0 += onset[f] * onset[f];
  }
  if (r0 <= 1e-12) return { bpm: null, confidence: 0, reliable: false };

  // autocorrelazione calcolata anche oltre maxLag: serve al punteggio "a
  // pettine" (fino a 4 volte il ritardo, cioè la battuta intera)
  const corrMax = Math.min(frames - 1, maxLag * 4);
  const corr = new Float32Array(corrMax + 1);
  for (let lag = Math.floor(minLag / 2); lag <= corrMax; lag++) {
    let sum = 0;
    for (let f = lag; f < frames; f++) sum += onset[f] * onset[f - lag];
    corr[lag] = sum / r0;
  }

  // Punteggio "a pettine": un vero beat ha periodicità anche a metà ritardo
  // (le suddivisioni: hi-hat, ottavi), al doppio e soprattutto a 4 volte
  // (la battuta intera, dove il pattern si ripete). Una periodicità spuria
  // (es. 1,5 battiti) non ha questo supporto e perde il confronto.
  let bestLag = minLag;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const half = Math.round(lag / 2);
    let score = corr[lag];
    if (half >= 2) score += 0.5 * corr[half];
    if (lag * 2 <= corrMax) score += 0.4 * corr[lag * 2];
    if (lag * 4 <= corrMax) score += 0.5 * corr[lag * 4];
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  const confidence = Math.max(0, corr[bestLag]);

  // correzione di ottava verso il range musicale comune (70-180 BPM),
  // solo se il ritardo corrispondente è ben supportato dai dati
  let lag = bestLag;
  let bpm = (60 * envRate) / lag;
  if (bpm > 180 && lag * 2 <= maxLag && corr[lag * 2] >= confidence * 0.6) {
    lag *= 2;
    bpm /= 2;
  } else if (bpm < 70) {
    const half = Math.round(lag / 2);
    if (half >= minLag && corr[half] >= confidence * 0.6) {
      lag = half;
      bpm = (60 * envRate) / lag;
    }
  }

  const reliable = confidence >= 0.15 && bpm >= 55 && bpm <= 210;
  return {
    bpm: reliable ? Math.round(bpm) : null,
    confidence: Math.round(confidence * 100) / 100,
    reliable,
  };
}

// ---------- stima della tonalità ----------
// Profilo chroma confrontato (correlazione di Pearson) con i profili di
// Krumhansl-Schmuckler nelle 24 tonalità. La confidenza è il margine tra la
// migliore e la seconda: se è troppo piccolo (tonalità ambigua), fallback.

const NOTE_NAMES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17, 3.32];

function estimateKey(chroma) {
  let total = 0;
  for (const value of chroma) total += value;
  if (total <= 1e-9) return { name: null, confidence: 0, reliable: false };

  const candidates = [];
  for (const [profile, mode] of [[MAJOR_PROFILE, 'maggiore'], [MINOR_PROFILE, 'minore']]) {
    for (let root = 0; root < 12; root++) {
      let score = 0;
      // correlazione di Pearson tra chroma e profilo ruotato sulla radice
      score = pearson(chroma, profile, root);
      candidates.push({ root, mode, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const margin = best.score - candidates[1].score;

  const reliable = best.score >= 0.5 && margin >= 0.025;
  return {
    name: reliable ? `${NOTE_NAMES[best.root]} ${best.mode}` : null,
    confidence: Math.round(Math.max(0, best.score) * 100) / 100,
    reliable,
  };
}

function pearson(chroma, profile, rotation) {
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < 12; i++) {
    meanA += chroma[i];
    meanB += profile[i];
  }
  meanA /= 12;
  meanB /= 12;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < 12; i++) {
    const a = chroma[(i + rotation) % 12] - meanA;
    const b = profile[i] - meanB;
    cov += a * b;
    varA += a * a;
    varB += b * b;
  }
  const denom = Math.sqrt(varA * varB);
  return denom <= 1e-12 ? 0 : cov / denom;
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
// Ogni osservazione cita i valori realmente misurati SU QUESTO brano: la
// credibilità nasce dalla specificità, non dall'enfasi. Niente promesse
// oltre il misurato.
function buildInsights({ rmsDb, crest, bands }) {
  const insights = [];
  const vol = Math.round(rmsDb);
  const dyn = Math.round(crest);

  if (rmsDb < -22) {
    insights.push({
      icon: '🔈',
      title: 'Volume sotto gli standard',
      text: `Il volume medio misurato è ${vol} dB: più piano dei circa −14 dB tipici dei brani in playlist. Le identità sonore lo porteranno a un livello competitivo senza schiacciarlo.`,
    });
  } else if (rmsDb > -11) {
    insights.push({
      icon: '🔊',
      title: 'Volume già alto',
      text: `Il volume medio misurato è ${vol} dB, sopra la zona tipica dello streaming: lavoreremo più sul carattere che sulla potenza, per non schiacciare il brano.`,
    });
  } else {
    insights.push({
      icon: '✅',
      title: 'Volume in zona sana',
      text: `Il volume medio misurato è ${vol} dB: una buona base di partenza, con spazio per dare carattere senza forzare.`,
    });
  }

  if (crest > 15) {
    insights.push({
      icon: '🌊',
      title: 'Dinamica molto aperta',
      text: `Tra i momenti piano e quelli forte ci sono ${dyn} dB di escursione: tanta. Un po’ di controllo renderà il brano più stabile all’ascolto.`,
    });
  } else if (crest < 8) {
    insights.push({
      icon: '🧱',
      title: 'Dinamica già compressa',
      text: `L’escursione tra piano e forte è di soli ${dyn} dB: il brano respira poco. Meglio identità delicate; spingere ancora lo affaticherebbe.`,
    });
  }

  if (bands.low > 45) {
    insights.push({
      icon: '🌑',
      title: 'Bassi dominanti',
      text: `Il ${bands.low}% dell’energia del brano sta nelle basse frequenze: lo guidano loro. Ottimo per mood scuri e da club; le identità più chiare le terranno in equilibrio.`,
    });
  } else if (bands.low < 22) {
    insights.push({
      icon: '🪶',
      title: 'Bassi leggeri',
      text: `Solo il ${bands.low}% dell’energia è nelle basse frequenze: il brano è chiaro e leggero in basso. Le identità con più Calore gli daranno corpo.`,
    });
  }

  if (bands.high < 12) {
    insights.push({
      icon: '🌫️',
      title: 'Poca aria in alto',
      text: `Le frequenze alte pesano solo il ${bands.high}% dell’energia: il suono è chiuso in alto. Un tocco di Brillantezza lo aprirà.`,
    });
  } else if (bands.high > 32) {
    insights.push({
      icon: '✨',
      title: 'Molto brillante',
      text: `Le frequenze alte pesano il ${bands.high}% dell’energia: il brano è già molto aperto. Attenzione a non aggiungere troppa Brillantezza.`,
    });
  }

  return insights.slice(0, 4);
}
