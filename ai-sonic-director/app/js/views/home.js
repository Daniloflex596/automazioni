// Home: una sola promessa, una sola azione principale (vedi piano §5).

import { el } from '../ui.js';
import { listProjects } from '../store.js';

export function renderHome() {
  const hasProjects = listProjects().length > 0;

  return el('div', {},
    el('section', { class: 'hero' },
      el('h1', { html: 'Porta qui il tuo brano.<br>Al resto <span class="grad">pensiamo insieme</span>.' }),
      el('p', {},
        'AI Sonic Director trasforma una canzone grezza in una versione pulita e pronta all’uso. ',
        'Scegli che carattere darle, ascolta il prima e il dopo, esporta. Senza tecnicismi.'
      ),
      el('div', { class: 'hero-cta' },
        el('a', { href: '#/new', class: 'btn btn-primary btn-lg' }, '🎵 Inizia con un brano'),
        hasProjects && el('a', { href: '#/library', class: 'btn btn-lg' }, 'Riprendi dalla libreria')
      )
    ),
    el('section', { class: 'steps-strip' },
      stepCard('1', 'Carica', 'Un file audio, anche grezzo. O prova subito col brano demo.'),
      stepCard('2', 'Scegli l’identità', 'Club, radio, lo-fi, social: decidi tu il carattere, con le orecchie.'),
      stepCard('3', 'Senti la differenza', 'Prima e dopo a confronto con un tasto, mentre il brano suona.'),
      stepCard('4', 'Esporta', 'Scarica la versione finale, pronta per release, demo o social.')
    )
  );
}

function stepCard(num, title, text) {
  return el('div', { class: 'card' },
    el('div', { class: 'num' }, num),
    el('h3', {}, title),
    el('p', {}, text)
  );
}
