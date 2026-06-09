// Profilo minimo di Fase 1: nome locale e riepilogo attività.
// Account reali, piani e statistiche sono Fase 2+ (piano §5).

import { el, toast } from '../ui.js';
import { getProfile, saveProfile, listProjects } from '../store.js';

export function renderProfile() {
  const profile = getProfile();
  const projects = listProjects();
  const exported = projects.filter((p) => p.exported).length;
  const identitiesUsed = new Set(projects.map((p) => p.identityId).filter(Boolean)).size;

  const nameInput = el('input', { type: 'text', placeholder: 'Il tuo nome d’arte', value: profile.name || '', maxlength: '40' });

  return el('div', { class: 'narrow' },
    el('div', { class: 'eyebrow' }, 'Profilo'),
    el('h1', { class: 'page-title' }, profile.name ? `Ciao, ${profile.name}` : 'Il tuo spazio'),
    el('p', { class: 'page-sub' },
      'In questa versione il profilo vive solo nel tuo browser. Gli account arriveranno con la prossima fase.'),
    el('div', { class: 'profile-stats' },
      stat('Progetti', projects.length),
      stat('Brani esportati', exported),
      stat('Identità provate', identitiesUsed)
    ),
    el('div', { class: 'card', style: 'margin-top:22px' },
      el('div', { class: 'form-row', style: 'margin-top:0' },
        el('label', {}, 'Nome d’arte'),
        nameInput
      ),
      el('div', { class: 'form-row' },
        el('button', {
          class: 'btn btn-primary',
          onClick: () => {
            saveProfile({ ...profile, name: nameInput.value.trim() });
            toast('Profilo salvato.');
          },
        }, 'Salva')
      )
    )
  );
}

function stat(label, value) {
  return el('div', { class: 'card metric' },
    el('div', { class: 'label' }, label),
    el('div', { class: 'value' }, String(value))
  );
}
