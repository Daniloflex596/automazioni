// Nuovo progetto: "bastano un file e un nome" (piano §5).
// Accetta upload o genera il brano demo, crea il progetto e apre lo Studio.

import { el, toast } from '../ui.js';
import { createProject, saveAudio } from '../store.js';
import { generateDemoTrack, DEMO_FILE_NAME } from '../audio/demo.js';

const ACCEPTED = ['audio/'];
const MAX_SIZE_MB = 80;

export function renderNewProject({ navigate }) {
  let selectedFile = null;

  const fileInput = el('input', {
    type: 'file',
    accept: 'audio/*',
    style: 'display:none',
    onChange: (event) => pickFile(event.target.files[0]),
  });

  const filePillSlot = el('div', {});
  const nameInput = el('input', {
    type: 'text',
    placeholder: 'Es. “Notte fonda — v1”',
    maxlength: '60',
  });

  const createBtn = el('button', { class: 'btn btn-primary btn-lg', disabled: true, onClick: onCreate },
    'Crea il progetto →');

  const dropzone = el('div', {
      class: 'dropzone',
      onClick: () => fileInput.click(),
      onDragover: (event) => { event.preventDefault(); dropzone.classList.add('drag'); },
      onDragleave: () => dropzone.classList.remove('drag'),
      onDrop: (event) => {
        event.preventDefault();
        dropzone.classList.remove('drag');
        pickFile(event.dataTransfer.files[0]);
      },
    },
    el('div', { class: 'dz-icon' }, '🎧'),
    el('div', { html: '<strong>Trascina qui il tuo brano</strong> oppure clicca per sceglierlo' }),
    el('div', { class: 'small', style: 'margin-top:6px' }, `MP3, WAV, M4A, OGG · max ${MAX_SIZE_MB} MB`)
  );

  function pickFile(file) {
    if (!file) return;
    if (!ACCEPTED.some((prefix) => file.type.startsWith(prefix)) && !/\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name)) {
      toast('Questo file non sembra un audio. Prova con MP3, WAV, M4A o OGG.', 'error');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast(`Il file supera i ${MAX_SIZE_MB} MB. Prova con una versione più leggera.`, 'error');
      return;
    }
    selectedFile = file;
    filePillSlot.replaceChildren(
      el('div', { class: 'file-pill' },
        el('span', {}, '🎵'),
        el('span', { class: 'name' }, file.name),
        el('button', { class: 'btn btn-ghost btn-sm', onClick: () => { selectedFile = null; filePillSlot.replaceChildren(); refresh(); } }, '✕')
      )
    );
    if (!nameInput.value.trim()) {
      nameInput.value = file.name.replace(/\.[^.]+$/, '');
    }
    refresh();
  }

  function refresh() {
    createBtn.disabled = !selectedFile;
  }

  async function onCreate() {
    if (!selectedFile) return;
    createBtn.disabled = true;
    createBtn.textContent = 'Creo il progetto…';
    try {
      const project = createProject({
        name: nameInput.value.trim() || selectedFile.name.replace(/\.[^.]+$/, ''),
        fileName: selectedFile.name,
      });
      await saveAudio(project.id, selectedFile);
      navigate(`#/studio/${project.id}`);
    } catch (error) {
      console.error(error);
      toast('Non sono riuscito a salvare il brano. Riprova.', 'error');
      createBtn.disabled = false;
      createBtn.textContent = 'Crea il progetto →';
    }
  }

  const demoBtn = el('button', { class: 'btn', onClick: onDemo }, '✨ Prova subito con il brano demo');

  async function onDemo() {
    demoBtn.disabled = true;
    demoBtn.textContent = 'Genero il brano demo…';
    try {
      const blob = await generateDemoTrack();
      const project = createProject({ name: 'Brano demo', fileName: DEMO_FILE_NAME });
      await saveAudio(project.id, blob);
      navigate(`#/studio/${project.id}`);
    } catch (error) {
      console.error(error);
      toast('Non sono riuscito a generare il demo. Riprova.', 'error');
      demoBtn.disabled = false;
      demoBtn.textContent = '✨ Prova subito con il brano demo';
    }
  }

  return el('div', { class: 'narrow' },
    el('div', { class: 'eyebrow' }, 'Nuovo progetto'),
    el('h1', { class: 'page-title' }, 'Bastano un file e un nome'),
    el('p', { class: 'page-sub' }, 'Carica il tuo brano così com’è: anche una bounce grezza va benissimo.'),
    fileInput,
    dropzone,
    filePillSlot,
    el('div', { class: 'form-row' },
      el('label', {}, 'Nome del progetto'),
      nameInput
    ),
    el('div', { class: 'form-row' }, createBtn),
    el('div', { class: 'divider-or' }, 'oppure'),
    demoBtn
  );
}
