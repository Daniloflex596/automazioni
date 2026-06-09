// Bootstrap e routing (hash-based, zero dipendenze).
// Ogni vista restituisce un nodo DOM oppure { node, cleanup }.

import { renderHome } from './views/home.js';
import { renderNewProject } from './views/newProject.js';
import { renderStudio } from './views/studio.js';
import { renderLibrary } from './views/library.js';
import { renderProfile } from './views/profile.js';

const appRoot = document.getElementById('app');
let currentCleanup = null;

const routes = [
  { pattern: /^#\/?$/, nav: 'home', view: () => renderHome({ navigate }) },
  { pattern: /^#\/new$/, nav: 'home', view: () => renderNewProject({ navigate }) },
  { pattern: /^#\/studio\/([^/]+)$/, nav: 'home', view: (match) => renderStudio({ navigate, projectId: match[1] }) },
  { pattern: /^#\/library$/, nav: 'library', view: () => renderLibrary({ navigate }) },
  { pattern: /^#\/profile$/, nav: 'profile', view: () => renderProfile({ navigate }) },
];

function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  const hash = location.hash || '#/';
  const route = routes.find((r) => r.pattern.test(hash)) || routes[0];
  const match = hash.match(route.pattern);

  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  const result = route.view(match);
  const node = result instanceof Node ? result : result.node;
  if (result && typeof result.cleanup === 'function') currentCleanup = result.cleanup;

  appRoot.replaceChildren(node);
  window.scrollTo(0, 0);

  for (const link of document.querySelectorAll('.topnav a')) {
    link.classList.toggle('active', link.dataset.nav === route.nav);
  }
}

window.addEventListener('hashchange', render);
render();
