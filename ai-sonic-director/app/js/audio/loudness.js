// Loudness "LUFS-like" e limiter look-ahead, senza dipendenze.
//
// La misura segue ITU-R BS.1770 in forma semplificata: K-weighting (shelf
// alto + high-pass, coefficienti del modello a qualunque sample rate),
// blocchi da 400 ms con sovrapposizione 75%, gating assoluto (−70) e
// relativo (−10 LU). È una STIMA onesta del loudness percepito, non una
// certificazione: i picchi sono sample-peak, non true-peak (manca
// l'oversampling — limite dichiarato).

// ---------- K-weighting ----------

// Stadio 1: shelf alto (~+4 dB sopra ~1.7 kHz) — coefficienti DeMan/BS.1770
function highShelf(fs) {
  const db = 3.999843853973347;
  const f0 = 1681.974450955533;
  const Q = 0.7071752369554196;
  const K = Math.tan((Math.PI * f0) / fs);
  const Vh = Math.pow(10, db / 20);
  const Vb = Math.pow(Vh, 0.4996667741545416);
  const a0 = 1 + K / Q + K * K;
  return {
    b0: (Vh + (Vb * K) / Q + K * K) / a0,
    b1: (2 * (K * K - Vh)) / a0,
    b2: (Vh - (Vb * K) / Q + K * K) / a0,
    a1: (2 * (K * K - 1)) / a0,
    a2: (1 - K / Q + K * K) / a0,
  };
}

// Stadio 2: high-pass (~38 Hz) — coefficienti DeMan/BS.1770
function highPass(fs) {
  const f0 = 38.13547087602444;
  const Q = 0.5003270373238773;
  const K = Math.tan((Math.PI * f0) / fs);
  const a0 = 1 + K / Q + K * K;
  return {
    b0: 1,
    b1: -2,
    b2: 1,
    a1: (2 * (K * K - 1)) / a0,
    a2: (1 - K / Q + K * K) / a0,
  };
}

function applyBiquad(input, output, c) {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i];
    const y0 = c.b0 * x0 + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    output[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
}

// ---------- loudness integrato ----------

// Accetta un AudioBuffer o un oggetto compatibile
// ({ numberOfChannels, length, sampleRate, getChannelData }).
// Restituisce il loudness integrato in "LUFS-like", o -Infinity sul silenzio.
export function measureLoudness(buffer) {
  const fs = buffer.sampleRate;
  const channels = Math.min(2, buffer.numberOfChannels) || 1;
  const length = buffer.length;
  if (length === 0) return -Infinity;

  const shelf = highShelf(fs);
  const pass = highPass(fs);

  // somma cumulata dei quadrati del segnale K-pesato, per blocchi veloci
  const cumulative = new Float64Array(length + 1);
  const tmp = new Float32Array(length);
  for (let ch = 0; ch < channels; ch++) {
    applyBiquad(buffer.getChannelData(ch), tmp, shelf);
    applyBiquad(tmp, tmp, pass);
    for (let i = 0; i < length; i++) cumulative[i + 1] += tmp[i] * tmp[i];
  }
  // cumulative ora è "per canale sommato"; trasformala in somma progressiva
  for (let i = 0; i < length; i++) cumulative[i + 1] += cumulative[i];

  const block = Math.min(length, Math.round(0.4 * fs));
  const hop = Math.max(1, Math.round(0.1 * fs));
  const powers = [];
  for (let start = 0; start + block <= length; start += hop) {
    powers.push((cumulative[start + block] - cumulative[start]) / block);
  }
  if (powers.length === 0) powers.push(cumulative[length] / length);

  const toLufs = (power) => -0.691 + 10 * Math.log10(power);

  // gating assoluto a −70
  const absGated = powers.filter((p) => p > 0 && toLufs(p) > -70);
  if (absGated.length === 0) return -Infinity;
  // gating relativo a −10 LU dalla media dei blocchi sopravvissuti
  const meanAbs = absGated.reduce((s, p) => s + p, 0) / absGated.length;
  const relThreshold = toLufs(meanAbs) - 10;
  const relGated = absGated.filter((p) => toLufs(p) > relThreshold);
  const pool = relGated.length > 0 ? relGated : absGated;
  const mean = pool.reduce((s, p) => s + p, 0) / pool.length;
  return toLufs(mean);
}

// ---------- limiter look-ahead ----------

// Limita i canali (in place) al tetto `ceiling` (lineare): riduzione di
// guadagno linkata tra i canali, anticipata da una finestra di look-ahead
// (~5 ms, minimo scorrevole) e rilasciata in ~80 ms. Clamp finale di
// sicurezza: nessun campione oltre il tetto.
export function limitChannels(channels, sampleRate, ceiling) {
  const n = channels[0].length;
  const look = Math.max(1, Math.round(sampleRate * 0.005));
  const releaseAlpha = 1 - Math.exp(-1 / (sampleRate * 0.08));

  // guadagno necessario campione per campione (sul picco tra i canali)
  const target = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let peak = 0;
    for (const data of channels) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
    target[i] = peak > ceiling ? ceiling / peak : 1;
  }

  // minimo scorrevole sulla finestra [i, i+look] (deque monotona, O(n)):
  // il guadagno scende PRIMA che il picco arrivi
  const minAhead = new Float32Array(n);
  const deque = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let j = 0; j < n + look; j++) {
    if (j < n) {
      while (tail > head && target[j] <= target[deque[tail - 1]]) tail--;
      deque[tail++] = j;
    }
    const i = j - look;
    if (i >= 0) {
      while (deque[head] < i) head++;
      minAhead[i] = target[deque[head]];
    }
  }

  // inviluppo: discesa immediata (già anticipata), risalita esponenziale
  let gain = 1;
  for (let i = 0; i < n; i++) {
    const t = minAhead[i];
    gain = t < gain ? t : gain + (t - gain) * releaseAlpha;
    for (const data of channels) {
      let v = data[i] * gain;
      if (v > ceiling) v = ceiling;
      else if (v < -ceiling) v = -ceiling;
      data[i] = v;
    }
  }
}
