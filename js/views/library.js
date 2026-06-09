// Libreria: la continuità del lavoro (piano §5). Lista, riapertura, eliminazione.

import { el, toast, formatDate } from '../ui.js';
import { listProjects, deleteProject } from '../store.js';
import { getIdentity } from '../audio/identities.js';

const STEP_LABELS = {
  analysis: 'Analisi',
  identity: 'Scelta identità',
  customize: 'Personalizzazione',
  compare: 'Confronto',
  export: 'Export',
};

export function renderLibrary({ navigate }) {
  const root = el('div', {});

  function draw() {
    const projects = listProjects();
    root.replaceChildren(
      el('div', { class: 'studio-head' },
        el('div', {},
          el('div', { class: 'eyebrow' }, 'Libreria'),
          el('h1', { class: 'page-title' }, 'I tuoi progetti'),
          el('p', { class: 'page-sub' }, 'Il tuo lavoro resta qui, e ci puoi tornare quando vuoi.')
        ),
        el('a', { href: '#/new', class: 'btn btn-primary' }, '+ Nuovo progetto')
      ),
      projects.length === 0
        ? el('div', { class: 'empty-state' },
            el('div', { class: 'big' }, '🎚️'),
            el('p', {}, 'Ancora nessun progetto.'),
            el('p', { class: 'small', style: 'margin-top:6px' }, 'Carica il tuo primo brano e dagli un’identità sonora.'),
            el('div', { style: 'margin-top:20px' },
              el('a', { href: '#/new', class: 'btn btn-primary' }, 'Inizia ora'))
          )
        : el('div', { class: 'lib-grid' }, projects.map(card))
    );
  }

  function card(project) {
    const identity = getIdentity(project.identityId);
    return el('div', { class: 'card proj-card' },
      el('h3', {}, project.name),
      el('div', { class: 'proj-meta' }, `${project.fileName} · ${formatDate(project.updatedAt)}`),
      el('div', {},
        identity && el('span', { class: 'badge id', style: 'margin-right:8px' }, `${identity.emoji} ${identity.name}`),
        project.exported
          ? el('span', { class: 'badge done' }, '✓ Esportato')
          : el('span', { class: 'badge wip' }, `In corso · ${STEP_LABELS[project.step] || 'Analisi'}`)
      ),
      el('div', { class: 'proj-actions' },
        el('button', { class: 'btn btn-sm', onClick: () => navigate(`#/studio/${project.id}`) },
          project.exported ? 'Riapri' : 'Riprendi'),
        el('button', {
          class: 'btn btn-ghost btn-sm',
          onClick: async () => {
            if (!confirm(`Eliminare “${project.name}”? L’audio salvato verrà rimosso.`)) return;
            await deleteProject(project.id);
            toast('Progetto eliminato.');
            draw();
          },
        }, 'Elimina')
      )
    );
  }

  draw();
  return root;
}
