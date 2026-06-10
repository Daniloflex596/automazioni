// Studio: il flusso principale del prodotto in cinque passi.
// Analisi → Identità sonora → Personalizzazione → Confronto → Export.
// Ogni passo è ripercorribile: le scelte creative si cambiano senza perdere nulla.

import { el, toast, formatTime, syncRangeFill } from '../ui.js';
import { getProject, updateProject, loadAudio } from '../store.js';
import { AudioEngine } from '../audio/engine.js';
import { analyzeBuffer, computeWaveformPeaks } from '../audio/analysis.js';
import { IDENTITIES, getIdentity, computeParams, adaptationNotes, recommendIdentities } from '../audio/identities.js';
import { EXPORT_TARGETS, makeVersionBlob, SNIPPET, makeSnippetBlob } from '../audio/export.js';

const STEPS = [
  { id: 'analysis', label: 'Analisi' },
  { id: 'identity', label: 'Identità' },
  { id: 'customize', label: 'Personalizza' },
  { id: 'compare', label: 'Confronta' },
  { id: 'export', label: 'Esporta' },
];

const MACROS = [
  { id: 'calore', name: 'Calore', desc: 'Più corpo e rotondità in basso, suono più avvolgente.' },
  { id: 'punch', name: 'Punch', desc: 'Più presenza e impatto: il brano spinge di più.' },
  { id: 'brillantezza', name: 'Brillantezza', desc: 'Più aria e dettaglio sulle frequenze alte.' },
  { id: 'spazio', name: 'Spazio', desc: 'Più profondità e ambiente intorno al suono.' },
];

export function renderStudio({ navigate, projectId }) {
  let project = getProject(projectId);
  const root = el('div', {});

  if (!project) {
    root.append(emptyError('Progetto non trovato.', navigate));
    return { node: root, cleanup() {} };
  }

  const engine = new AudioEngine();
  let peaks = null;
  let rafId = null;
  const frameCallbacks = new Set();
  let previewingId = null;

  root.append(loadingStage('Sto ascoltando il tuo brano…'));
  init();

  // Ogni fase dell'avvio ha il suo errore, con un messaggio che dice cosa
  // fare: accesso all'archivio, audio mancante, decodifica, imprevisto.
  async function init() {
    let blob = null;
    try {
      blob = await loadAudio(project.id);
    } catch (error) {
      console.error(error);
      root.replaceChildren(emptyError(
        'Non riesco ad accedere all’archivio audio del browser. Ricarica la pagina e riprova.',
        navigate
      ));
      return;
    }
    if (!blob) {
      root.replaceChildren(emptyError(
        'L’audio di questo progetto non è più disponibile in questo browser. Crea un nuovo progetto ricaricando il file.',
        navigate
      ));
      return;
    }

    let buffer = null;
    try {
      buffer = await engine.loadBlob(blob);
    } catch {
      // file non decodificabile: caso atteso (niente console.error)
      root.replaceChildren(emptyError(
        'Non sono riuscito a leggere questo file audio. Crea un nuovo progetto riesportando il brano in MP3 o WAV.',
        navigate
      ));
      return;
    }

    try {
      if (!project.analysis) {
        project = updateProject(project.id, { analysis: analyzeBuffer(buffer) });
      }
      peaks = computeWaveformPeaks(buffer);
      startFrameLoop();
      drawStep(project.step || 'analysis');
    } catch (error) {
      console.error(error);
      root.replaceChildren(emptyError(
        'Qualcosa è andato storto durante l’analisi del brano. Ricarica la pagina e riprova.',
        navigate
      ));
    }
  }

  // ---------- struttura comune ----------

  function drawStep(stepId) {
    engine.pause();
    previewingId = null;
    frameCallbacks.clear();

    // project.step registra lo step più avanzato raggiunto: tornare indietro
    // non fa perdere la possibilità di riavanzare dal punto raggiunto.
    if (STEPS.findIndex((s) => s.id === stepId) > stepIndex(project.step)) {
      project = updateProject(project.id, { step: stepId });
    }

    applyEngineParams();
    engine.setMode(stepId === 'analysis' ? 'original' : 'processed');

    const builders = {
      analysis: buildAnalysis,
      identity: buildIdentity,
      customize: buildCustomize,
      compare: buildCompare,
      export: buildExport,
    };

    root.replaceChildren(
      el('div', { class: 'studio-head' },
        el('div', {},
          el('div', { class: 'eyebrow' }, 'Studio'),
          el('h1', { class: 'page-title' }, project.name),
          el('p', { class: 'page-sub small' }, project.fileName)
        ),
        el('a', { href: '#/library', class: 'btn btn-ghost btn-sm' }, '← Libreria')
      ),
      stepper(stepId),
      builders[stepId](stepId)
    );
  }

  function stepIndex(stepId) {
    return Math.max(0, STEPS.findIndex((s) => s.id === stepId));
  }

  function stepper(currentId) {
    const reached = stepIndex(project.step);
    return el('div', { class: 'stepper' },
      STEPS.map((step, index) => {
        const cls = ['step'];
        if (step.id === currentId) cls.push('current');
        else if (index < stepIndex(currentId)) cls.push('done');
        const clickable = index <= reached && step.id !== currentId
          && !(step.id !== 'analysis' && step.id !== 'identity' && !project.identityId);
        return el('button', {
          class: cls.join(' '),
          disabled: !clickable,
          onClick: () => drawStep(step.id),
        }, `${index + 1} · ${step.label}`);
      })
    );
  }

  function applyEngineParams() {
    const identity = getIdentity(project.identityId) || IDENTITIES[0];
    engine.setParams(computeParams(identity, project.macros, project.analysis));
  }

  // ---------- player condiviso ----------

  function playerBar({ showAb = false } = {}) {
    const canvas = el('canvas', { class: 'waveform' });
    const playBtn = el('button', { class: 'play-btn', onClick: togglePlay }, '▶');
    const timeLabel = el('span', { class: 'time-label' }, `0:00 / ${formatTime(engine.duration)}`);

    let abWrap = null;
    if (showAb) {
      const btnA = el('button', { onClick: () => setMode('original') }, 'Originale');
      const btnB = el('button', { onClick: () => setMode('processed') }, 'Diretto');
      abWrap = el('div', { class: 'ab-toggle' }, btnA, btnB);
      function setMode(mode) {
        engine.setMode(mode);
        btnA.classList.toggle('active', mode === 'original');
        btnB.classList.toggle('active', mode === 'processed');
      }
      setMode(engine.mode);
    }

    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      engine.seek(((event.clientX - rect.left) / rect.width) * engine.duration);
    });

    function togglePlay() {
      if (engine.isPlaying()) engine.pause();
      else engine.play();
    }

    engine.onEnded = () => { playBtn.textContent = '▶'; };

    frameCallbacks.add(() => {
      drawWaveform(canvas, peaks, engine.getPosition() / (engine.duration || 1));
      playBtn.textContent = engine.isPlaying() ? '❚❚' : '▶';
      timeLabel.textContent = `${formatTime(engine.getPosition())} / ${formatTime(engine.duration)}`;
    });

    return el('div', {},
      el('div', { class: 'wave-wrap' }, canvas),
      el('div', { class: 'player-bar' }, playBtn, timeLabel, abWrap)
    );
  }

  function startFrameLoop() {
    const tick = () => {
      for (const callback of frameCallbacks) callback();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  // ---------- step 1: analisi ----------

  function buildAnalysis() {
    const a = project.analysis;
    return el('div', {},
      el('p', { class: 'page-sub', style: 'margin-bottom:18px' },
        'Abbiamo misurato volume, dinamica e bilanciamento tonale del tuo brano. Ecco cosa dicono — in parole semplici.'),
      playerBar(),
      el('div', { class: 'metric-grid' },
        metric('Durata', formatTime(a.duration), `${a.channels === 1 ? 'Mono' : 'Stereo'} · ${Math.round(a.sampleRate / 1000)} kHz`),
        metric('Volume medio', `${a.rmsDb} dB`, volumeHint(a.rmsDb)),
        metric('Dinamica', `${a.crest} dB`, dynamicsHint(a.crest))
      ),
      el('div', { class: 'card', style: 'margin-top:14px' },
        el('h4', {}, 'Bilanciamento tonale'),
        el('div', { class: 'tonal-bar' },
          el('div', { class: 'b-low', style: `width:${a.bands.low}%` }),
          el('div', { class: 'b-mid', style: `width:${a.bands.mid}%` }),
          el('div', { class: 'b-high', style: `width:${a.bands.high}%` })
        ),
        el('div', { class: 'tonal-legend' },
          el('span', {}, el('i', { style: 'background:#6366f1' }), `Bassi ${a.bands.low}%`),
          el('span', {}, el('i', { style: 'background:#a855f7' }), `Medi ${a.bands.mid}%`),
          el('span', {}, el('i', { style: 'background:#ec4899' }), `Alti ${a.bands.high}%`)
        ),
        el('p', { class: 'muted', style: 'font-size:0.78rem; margin-top:10px' },
          'Quota di energia misurata sull’intero brano: bassi sotto i 250 Hz, medi tra 250 e 4000 Hz, alti oltre i 4000 Hz.')
      ),
      el('div', { class: 'insights' },
        project.analysis.insights.map((insight) =>
          el('div', { class: 'insight' },
            el('span', { class: 'ico' }, insight.icon),
            el('div', {},
              el('h4', {}, insight.title),
              el('p', {}, insight.text))
          ))
      ),
      // trasparenza: cosa misuriamo davvero oggi, senza promesse implicite
      el('p', { class: 'muted small', style: 'margin-top:14px' },
        'Questa analisi misura volume medio, picchi, dinamica e bilanciamento tonale sull’intero brano. BPM e tonalità non vengono ancora misurati.'),
      el('div', { class: 'step-actions' },
        el('span', {}),
        el('button', { class: 'btn btn-primary btn-lg', onClick: () => drawStep('identity') },
          'Scegli l’identità sonora →')
      )
    );
  }

  function metric(label, value, hint) {
    return el('div', { class: 'card metric' },
      el('div', { class: 'label' }, label),
      el('div', { class: 'value' }, value),
      el('div', { class: 'hint' }, hint)
    );
  }

  function volumeHint(rmsDb) {
    if (rmsDb < -22) return 'Più piano degli standard streaming';
    if (rmsDb > -11) return 'Già molto spinto';
    return 'In una buona zona di partenza';
  }

  function dynamicsHint(crest) {
    if (crest > 15) return 'Molto aperta: grandi escursioni';
    if (crest < 8) return 'Molto compressa: respira poco';
    return 'Equilibrata';
  }

  // ---------- step 2: identità sonora ----------

  function buildIdentity() {
    // L'app consiglia una direzione in base all'analisi e ne propone alternative.
    // Se l'utente non ha ancora scelto, la consigliata viene preselezionata: è un
    // punto di partenza, non un verdetto — resta libero di cambiarla.
    const suggestion = recommendIdentities(project.analysis);
    if (suggestion && !project.identityId) {
      project = updateProject(project.id, { identityId: suggestion.recommendedId });
      applyEngineParams();
    }

    const grid = el('div', { class: 'identity-grid' });
    const continueBtn = el('button', {
      class: 'btn btn-primary btn-lg',
      disabled: !project.identityId,
      onClick: () => drawStep('customize'),
    }, 'Continua con questa →');

    function roleOf(identity) {
      if (!suggestion) return null;
      if (suggestion.recommendedId === identity.id) return 'reco';
      if (suggestion.alternativeIds.includes(identity.id)) return 'alt';
      return null;
    }

    function drawCards() {
      grid.replaceChildren(...IDENTITIES.map((identity) => {
        const selected = project.identityId === identity.id;
        const previewing = previewingId === identity.id;
        const role = roleOf(identity);
        return el('div', {
            class: `identity-card ${selected ? 'selected' : ''} ${role === 'reco' ? 'recommended' : ''}`,
            onClick: () => select(identity),
          },
          role === 'reco' && el('span', { class: 'reco-ribbon' }, '★ Consigliata per il tuo brano'),
          role === 'alt' && el('span', { class: 'reco-ribbon alt' }, 'Buona alternativa'),
          el('div', { class: 'id-emoji' }, identity.emoji),
          el('h3', {}, identity.name),
          el('p', { class: 'id-desc' }, identity.description),
          el('span', { class: 'id-use' }, identity.useCase),
          el('div', { class: 'id-actions' },
            el('button', {
              class: 'btn btn-sm',
              onClick: (event) => { event.stopPropagation(); togglePreview(identity); },
            }, previewing ? '■ Ferma' : '▶ Ascolta'),
            selected && el('span', { class: 'badge id', style: 'align-self:center' }, '✓ Scelta')
          )
        );
      }));
    }

    function select(identity) {
      project = updateProject(project.id, { identityId: identity.id });
      continueBtn.disabled = false;
      applyEngineParams();
      drawCards();
    }

    function togglePreview(identity) {
      if (previewingId === identity.id) {
        engine.pause();
        previewingId = null;
      } else {
        engine.setParams(computeParams(identity, project.macros, project.analysis));
        engine.setMode('processed');
        engine.play(engine.isPlaying() || engine.getPosition() > 0 ? engine.getPosition() : engine.duration * 0.25);
        previewingId = identity.id;
      }
      drawCards();
    }

    engine.onEnded = () => { previewingId = null; drawCards(); };
    drawCards();

    const recommended = suggestion ? getIdentity(suggestion.recommendedId) : null;

    return el('div', {},
      el('p', { class: 'page-sub', style: 'margin-bottom:4px' },
        'Che carattere vuoi dare al brano? Ogni identità si dosa su ciò che abbiamo sentito nell’analisi. Ascoltale sul tuo pezzo: si decide con le orecchie, non con i nomi.'),
      recommended && el('div', { class: 'card suggestion-banner' },
        el('span', { class: 'sb-emoji' }, recommended.emoji),
        el('div', {},
          el('h4', {}, `Per il tuo brano partiremmo da ${recommended.name}`),
          el('p', { class: 'muted small' }, suggestion.reason),
          el('p', { class: 'muted', style: 'font-size:0.8rem; margin-top:4px' },
            'È già pronta qui sotto: ascoltala, oppure scegli un’altra direzione quando vuoi.'))
      ),
      grid,
      el('div', { class: 'step-actions' },
        el('button', { class: 'btn', onClick: () => drawStep('analysis') }, '← Analisi'),
        continueBtn
      )
    );
  }

  // ---------- step 3: personalizzazione ----------

  function buildCustomize() {
    const identity = getIdentity(project.identityId);
    let persistTimer = null;

    function onMacroChange(macroId, value, valueLabel, input) {
      project.macros = { ...project.macros, [macroId]: value };
      valueLabel.textContent = String(value);
      syncRangeFill(input);
      applyEngineParams();
      clearTimeout(persistTimer);
      persistTimer = setTimeout(() => { project = updateProject(project.id, { macros: project.macros }); }, 250);
    }

    const sliders = MACROS.map((macro) => {
      const valueLabel = el('span', { class: 'macro-val' }, String(project.macros[macro.id]));
      const input = el('input', {
        type: 'range', min: '0', max: '100', value: String(project.macros[macro.id]),
        onInput: (event) => onMacroChange(macro.id, Number(event.target.value), valueLabel, event.target),
      });
      syncRangeFill(input);
      return el('div', { class: 'card macro' },
        el('div', { class: 'macro-head' }, el('h4', {}, macro.name), valueLabel),
        el('p', {}, macro.desc),
        input
      );
    });

    const notes = adaptationNotes(identity, project.analysis);

    return el('div', {},
      el('p', { class: 'page-sub', style: 'margin-bottom:18px' },
        `Stai lavorando su ${identity.emoji} ${identity.name}. Rifinisci mentre ascolti: niente tecnicismi, solo orecchie.`),
      playerBar({ showAb: true }),
      el('div', { class: 'card', style: 'margin-top:14px' },
        el('h4', {}, `🎯 ${identity.name}, adattata al tuo brano`),
        el('div', { class: 'insights', style: 'margin-top:10px' },
          notes.map((note) => el('div', { class: 'insight', style: 'padding:10px 14px' },
            el('span', { class: 'ico' }, '·'),
            el('p', { class: 'muted', style: 'font-size:0.88rem' }, note))))
      ),
      el('div', { class: 'macro-grid' }, sliders),
      el('div', { class: 'step-actions' },
        el('div', { style: 'display:flex; gap:10px' },
          el('button', { class: 'btn', onClick: () => drawStep('identity') }, '← Cambia identità'),
          el('button', {
            class: 'btn btn-ghost',
            onClick: () => {
              project = updateProject(project.id, { macros: { calore: 50, punch: 50, brillantezza: 50, spazio: 50 } });
              applyEngineParams();
              drawStep('customize');
            },
          }, 'Riporta ai valori base')
        ),
        el('button', { class: 'btn btn-primary btn-lg', onClick: () => drawStep('compare') }, 'Confronta →')
      )
    );
  }

  // ---------- step 4: confronto ----------

  function buildCompare() {
    const identity = getIdentity(project.identityId);
    const stateLabel = el('div', { class: 'big-state' });
    const btnA = el('button', { onClick: () => setMode('original') }, 'Originale');
    const btnB = el('button', { onClick: () => setMode('processed') }, `${identity.emoji} ${identity.name}`);

    function setMode(mode) {
      engine.setMode(mode);
      btnA.classList.toggle('active', mode === 'original');
      btnB.classList.toggle('active', mode === 'processed');
      stateLabel.textContent = mode === 'original' ? 'Stai ascoltando: originale' : `Stai ascoltando: ${identity.name}`;
    }
    setMode('processed');

    return el('div', {},
      el('div', { class: 'card compare-stage' },
        el('div', { class: 'big-label' }, 'La prova del valore'),
        stateLabel,
        el('p', { class: 'muted small', style: 'margin-top:10px' },
          'Premi play e passa da una versione all’altra mentre il brano suona. Il cambio è istantaneo.'),
        el('div', { class: 'compare-switch' }, btnA, btnB)
      ),
      el('div', { style: 'margin-top:18px' }, playerBar()),
      el('div', { class: 'step-actions' },
        el('button', { class: 'btn', onClick: () => drawStep('customize') }, '← Rifinisci ancora'),
        el('button', { class: 'btn btn-primary btn-lg', onClick: () => drawStep('export') }, 'Mi convince, esporta →')
      )
    );
  }

  // ---------- step 5: export ----------

  function buildExport() {
    const identity = getIdentity(project.identityId);
    const params = computeParams(identity, project.macros, project.analysis);
    const macroSummary = MACROS
      .map((macro) => `${macro.name} ${project.macros[macro.id]}`)
      .join(' · ');

    const doneSlot = el('div', {});
    // il render della catena si fa una volta sola, alla prima richiesta;
    // ogni versione applica poi solo il proprio livello di destinazione
    let renderedPromise = null;
    const getRendered = () => (renderedPromise ||= engine.renderBuffer(params));

    // peso stimato del WAV 16 bit: l'utente lo sa PRIMA di scaricare
    function wavSizeLabel(seconds) {
      const channels = Math.min(2, engine.buffer.numberOfChannels) || 1;
      const mb = (seconds * engine.buffer.sampleRate * 2 * channels) / 1048576;
      return mb < 1 ? 'meno di 1 MB' : `~${Math.round(mb)} MB`;
    }

    // consegna comune a versioni e snippet: download, stato "esportato", toast
    function deliverBlob(blob, versionName) {
      const url = URL.createObjectURL(blob);
      // nome file pulito e prevedibile: "Brano - Identità - Versione.wav"
      const safeName = `${project.name} - ${identity.name} - ${versionName}`
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
      const link = el('a', { href: url, download: `${safeName}.wav` });
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      markExported();
      toast(`Versione ${versionName} scaricata: la trovi nei download.`);
    }

    // il primo export elabora il brano (più lento); i successivi riusano
    // lo stesso render e sono rapidi — la label lo dice all'utente
    function waitLabel(fallback) {
      return renderedPromise ? fallback : 'Elaboro il brano… (solo la prima volta)';
    }

    async function downloadVersion(target, button) {
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = waitLabel('Preparo il file…');
      try {
        const rendered = await getRendered();
        const { blob } = makeVersionBlob(rendered, target);
        deliverBlob(blob, target.name);
      } catch (error) {
        console.error(error);
        toast('Export non riuscito. Riprova; se succede ancora, ricarica la pagina.', 'error');
      } finally {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }

    // lo snippet riusa lo stesso render della catena: è coerente con
    // l'identità e le rifiniture per costruzione
    async function downloadSnippet(button) {
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = waitLabel('Cerco il momento migliore…');
      try {
        const rendered = await getRendered();
        const { blob } = makeSnippetBlob(rendered);
        deliverBlob(blob, SNIPPET.name);
      } catch (error) {
        console.error(error);
        toast('Export non riuscito. Riprova; se succede ancora, ricarica la pagina.', 'error');
      } finally {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }

    function markExported() {
      if (project.exported) return;
      project = updateProject(project.id, { exported: true });
      doneSlot.replaceChildren(
        el('div', { class: 'export-done' },
          el('h3', {}, '🎉 Il tuo brano è pronto'),
          el('p', { class: 'muted small', style: 'margin-top:6px' },
            'Lo trovi nei download. Il progetto resta in libreria: puoi tornarci e provare un’altra direzione quando vuoi.'),
          el('div', { style: 'margin-top:16px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap' },
            el('a', { href: '#/library', class: 'btn btn-primary' }, 'Vai alla libreria'),
            el('a', { href: '#/new', class: 'btn' }, 'Nuovo brano'))
        )
      );
    }

    const versionRows = EXPORT_TARGETS.map((target) => {
      const button = el('button', { class: 'btn btn-sm' }, '⬇ Scarica');
      button.addEventListener('click', () => downloadVersion(target, button));
      return el('div', { class: 'export-version' },
        el('span', { class: 'ico' }, target.emoji),
        el('div', { class: 'ev-text' },
          el('h4', {}, target.name),
          el('p', {}, target.desc),
          el('p', { class: 'muted', style: 'font-size:0.78rem; margin-top:4px' },
            `WAV 16 bit · ${wavSizeLabel(engine.duration)} · brano intero`)),
        button
      );
    });

    const snippetBtn = el('button', { class: 'btn btn-sm' }, '✂️ Esporta snippet');
    snippetBtn.addEventListener('click', () => downloadSnippet(snippetBtn));
    const snippetSeconds = Math.min(SNIPPET.seconds, engine.duration);
    const snippetRow = el('div', { class: 'export-version' },
      el('span', { class: 'ico' }, SNIPPET.emoji),
      el('div', { class: 'ev-text' },
        el('h4', {}, SNIPPET.name),
        el('p', {}, SNIPPET.desc),
        el('p', { class: 'muted', style: 'font-size:0.78rem; margin-top:4px' },
          `WAV 16 bit · ${wavSizeLabel(snippetSeconds)} · circa ${Math.round(snippetSeconds)} secondi`)),
      snippetBtn
    );

    return el('div', {},
      el('p', { class: 'page-sub', style: 'margin-bottom:8px' },
        'Scegli la destinazione: ogni versione è tarata sul volume giusto per dove la pubblicherai.'),
      el('div', { class: 'export-summary' },
        summaryRow('Brano', project.name),
        summaryRow('File originale', project.fileName),
        summaryRow('Identità sonora', `${identity.emoji} ${identity.name}`),
        summaryRow('Rifiniture', macroSummary),
        summaryRow('Formato', 'WAV 16 bit, qualità piena — l’MP3 arriverà in una fase successiva')
      ),
      el('div', { class: 'card export-versions' },
        el('h4', {}, 'Le tue versioni'),
        versionRows,
        snippetRow
      ),
      el('div', { class: 'step-actions' },
        el('button', { class: 'btn', onClick: () => drawStep('compare') }, '← Riascolta il confronto'),
        el('span', {})
      ),
      doneSlot
    );
  }

  function summaryRow(label, value) {
    return el('div', { class: 'row' }, el('span', {}, label), el('span', {}, value));
  }

  return {
    node: root,
    cleanup() {
      if (rafId) cancelAnimationFrame(rafId);
      engine.dispose();
    },
  };
}

// ---------- helpers ----------

function drawWaveform(canvas, peaks, progress) {
  if (!peaks) return;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 600;
  const height = canvas.clientHeight || 110;
  if (canvas.width !== width * dpr) { canvas.width = width * dpr; canvas.height = height * dpr; }

  const ctx2d = canvas.getContext('2d');
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx2d.clearRect(0, 0, width, height);

  const mid = height / 2;
  const barWidth = width / peaks.length;
  const playedX = progress * width;

  for (let i = 0; i < peaks.length; i++) {
    const [min, max] = peaks[i];
    const x = i * barWidth;
    const y1 = mid + min * (mid - 4);
    const y2 = mid + max * (mid - 4);
    ctx2d.fillStyle = x <= playedX ? '#8b5cf6' : '#33334a';
    ctx2d.fillRect(x, Math.min(y1, y2), Math.max(1, barWidth - 0.5), Math.max(1.5, Math.abs(y2 - y1)));
  }

  ctx2d.fillStyle = '#ec4899';
  ctx2d.fillRect(playedX - 1, 0, 2, height);
}

function loadingStage(message) {
  return el('div', { class: 'loading-stage' },
    el('div', { class: 'analyzing-bars' },
      el('span', { style: 'height:20px' }), el('span', { style: 'height:34px' }),
      el('span', { style: 'height:14px' }), el('span', { style: 'height:40px' }),
      el('span', { style: 'height:24px' })),
    el('p', { class: 'muted' }, message)
  );
}

function emptyError(message, navigate) {
  return el('div', { class: 'empty-state' },
    el('div', { class: 'big' }, '🎚️'),
    el('p', {}, message),
    el('div', { style: 'margin-top:20px; display:flex; gap:10px; justify-content:center' },
      el('button', { class: 'btn btn-primary', onClick: () => navigate('#/new') }, 'Nuovo progetto'),
      el('button', { class: 'btn', onClick: () => navigate('#/library') }, 'Libreria'))
  );
}
