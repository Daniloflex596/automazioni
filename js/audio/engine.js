// Motore audio del prototipo, basato su Web Audio API.
// Responsabilità: riproduzione con catena di elaborazione in tempo reale,
// confronto A/B istantaneo (originale vs lavorato), aggiornamento dei
// parametri durante l'ascolto, render offline per l'export WAV.
//
// La stessa catena viene costruita sia nel contesto live sia in quello
// offline: ciò che l'utente esporta è esattamente ciò che ha ascoltato.

const CROSSFADE = 0.04; // secondi, per l'A/B senza click

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffer = null;
    this.source = null;
    this.chain = null;
    this.dryGain = null;
    this.master = null;
    this.mode = 'processed'; // 'original' | 'processed'
    this.playing = false;
    this.startedAt = 0;   // ctx.currentTime alla partenza
    this.startOffset = 0; // posizione nel brano alla partenza
    this.params = null;
    this.onEnded = null;
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  async loadBlob(blob) {
    const ctx = this.ensureContext();
    const arrayBuffer = await blob.arrayBuffer();
    this.buffer = await ctx.decodeAudioData(arrayBuffer);
    return this.buffer;
  }

  get duration() {
    return this.buffer ? this.buffer.duration : 0;
  }

  getPosition() {
    if (!this.buffer) return 0;
    if (!this.playing) return this.startOffset;
    return Math.min(this.duration, this.startOffset + this.ctx.currentTime - this.startedAt);
  }

  isPlaying() {
    return this.playing;
  }

  setParams(params) {
    this.params = params;
    if (this.chain) applyParams(this.chain, params, this.ctx);
  }

  setMode(mode) {
    this.mode = mode;
    if (!this.ctx || !this.dryGain) return;
    const now = this.ctx.currentTime;
    const dryTarget = mode === 'original' ? 1 : 0;
    this.dryGain.gain.setTargetAtTime(dryTarget, now, CROSSFADE);
    this.chain.output.gain.setTargetAtTime(1 - dryTarget, now, CROSSFADE);
  }

  play(offset = null) {
    if (!this.buffer || !this.params) return;
    const ctx = this.ensureContext();
    this.stopSource();

    if (offset !== null) this.startOffset = offset;
    if (this.startOffset >= this.duration - 0.05) this.startOffset = 0;

    if (!this.master) {
      this.master = ctx.createGain();
      this.master.connect(ctx.destination);
    }
    if (this.dryGain) this.dryGain.disconnect();
    if (this.chain) this.chain.output.disconnect();

    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = this.mode === 'original' ? 1 : 0;
    this.dryGain.connect(this.master);

    this.chain = buildChain(ctx, this.params);
    this.chain.output.gain.value = this.mode === 'original' ? 0 : 1;
    this.chain.output.connect(this.master);

    this.source = ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.dryGain);
    this.source.connect(this.chain.input);

    const startedSource = this.source;
    this.source.onended = () => {
      if (this.source !== startedSource) return; // interrotto da seek/stop
      this.playing = false;
      this.startOffset = 0;
      if (this.onEnded) this.onEnded();
    };

    this.source.start(0, this.startOffset);
    this.startedAt = ctx.currentTime;
    this.playing = true;
  }

  pause() {
    if (!this.playing) return;
    this.startOffset = this.getPosition();
    this.stopSource();
    this.playing = false;
  }

  seek(position) {
    const wasPlaying = this.playing;
    this.startOffset = Math.max(0, Math.min(position, this.duration));
    if (wasPlaying) this.play();
    else this.playing = false;
  }

  stopSource() {
    if (this.source) {
      const source = this.source;
      this.source = null;
      try { source.onended = null; source.stop(); } catch { /* già fermo */ }
    }
  }

  dispose() {
    this.stopSource();
    this.playing = false;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.buffer = null;
    this.chain = null;
    this.master = null;
    this.dryGain = null;
  }

  // Render offline con la stessa catena dell'ascolto live → AudioBuffer.
  // Le versioni di export (loudness per destinazione, tetto anti-clipping,
  // codifica) sono responsabilità di audio/export.js.
  async renderBuffer(params) {
    if (!this.buffer) throw new Error('Nessun audio caricato');
    const offline = new OfflineAudioContext(
      Math.min(2, this.buffer.numberOfChannels) || 1,
      this.buffer.length,
      this.buffer.sampleRate
    );
    const chain = buildChain(offline, params);
    chain.output.connect(offline.destination);
    const source = offline.createBufferSource();
    source.buffer = this.buffer;
    source.connect(chain.input);
    source.start(0);
    return offline.startRendering();
  }
}

// ---------- catena di elaborazione ----------
// input → shelf bassi → campana medi → shelf alti → saturazione →
// compressore → (segnale diretto + riverbero) → gain di uscita

function buildChain(ctx, params) {
  const input = ctx.createGain();

  const low = ctx.createBiquadFilter();
  low.type = 'lowshelf';
  low.frequency.value = 120;

  const mid = ctx.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 2500;
  mid.Q.value = 0.8;

  const high = ctx.createBiquadFilter();
  high.type = 'highshelf';
  high.frequency.value = 7500;

  const shaper = ctx.createWaveShaper();
  shaper.oversample = '2x';

  const compressor = ctx.createDynamicsCompressor();
  compressor.knee.value = 8;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.18;

  const direct = ctx.createGain();
  const convolver = ctx.createConvolver();
  convolver.buffer = makeImpulseResponse(ctx);
  const wet = ctx.createGain();

  const output = ctx.createGain();

  input.connect(low);
  low.connect(mid);
  mid.connect(high);
  high.connect(shaper);
  shaper.connect(compressor);
  compressor.connect(direct);
  direct.connect(output);
  compressor.connect(convolver);
  convolver.connect(wet);
  wet.connect(output);

  const chain = { input, low, mid, high, shaper, compressor, direct, wet, output, lastDrive: null };
  applyParams(chain, params, ctx);
  return chain;
}

function applyParams(chain, params, ctx) {
  const now = ctx ? ctx.currentTime : 0;
  setParam(chain.low.gain, params.low, now);
  setParam(chain.mid.gain, params.mid, now);
  setParam(chain.high.gain, params.high, now);
  setParam(chain.compressor.threshold, params.threshold, now);
  setParam(chain.compressor.ratio, params.ratio, now);
  setParam(chain.direct.gain, params.makeup * (1 - params.wet * 0.5), now);
  setParam(chain.wet.gain, params.makeup * params.wet, now);
  if (chain.lastDrive !== params.drive) {
    chain.shaper.curve = makeSaturationCurve(params.drive);
    chain.lastDrive = params.drive;
  }
}

function setParam(audioParam, value, now) {
  if (audioParam.setTargetAtTime && now > 0) audioParam.setTargetAtTime(value, now, 0.02);
  else audioParam.value = value;
}

// Saturazione morbida: interpola tra lineare e tanh in base al drive.
function makeSaturationCurve(drive) {
  const amount = Math.max(0, Math.min(1, drive));
  const samples = 1024;
  const curve = new Float32Array(samples);
  const norm = Math.tanh(3);
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1;
    curve[i] = (1 - amount) * x + amount * (Math.tanh(3 * x) / norm);
  }
  return curve;
}

// Risposta impulsiva generata proceduralmente (rumore con decadimento
// esponenziale): un riverbero credibile senza file esterni.
function makeImpulseResponse(ctx, seconds = 1.6, decay = 2.8) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}
