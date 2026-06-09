// Persistenza locale del prototipo (Fase 1):
// - metadati dei progetti e profilo in localStorage
// - file audio in IndexedDB (troppo grandi per localStorage)
// Nell'MVP (Fase 2) questo modulo sarà sostituito da un backend con account.

const PROJECTS_KEY = 'asd.projects.v1';
const PROFILE_KEY = 'asd.profile.v1';
const DB_NAME = 'asd-audio';
const DB_STORE = 'tracks';

export const DEFAULT_MACROS = { calore: 50, punch: 50, brillantezza: 50, spazio: 50 };

// ---------- progetti (metadati) ----------

function readProjects() {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [];
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function listProjects() {
  return readProjects().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(id) {
  return readProjects().find((p) => p.id === id) || null;
}

export function createProject({ name, fileName }) {
  const now = Date.now();
  const project = {
    id: `p_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    fileName,
    createdAt: now,
    updatedAt: now,
    step: 'analysis',          // analysis | identity | customize | compare | export
    identityId: null,
    macros: { ...DEFAULT_MACROS },
    analysis: null,
    exported: false,
  };
  writeProjects([...readProjects(), project]);
  return project;
}

export function updateProject(id, patch) {
  const projects = readProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;
  projects[index] = { ...projects[index], ...patch, updatedAt: Date.now() };
  writeProjects(projects);
  return projects[index];
}

export async function deleteProject(id) {
  writeProjects(readProjects().filter((p) => p.id !== id));
  await deleteAudio(id).catch(() => {});
}

// ---------- profilo ----------

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || { name: '' };
  } catch {
    return { name: '' };
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ---------- audio (IndexedDB) ----------

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore(mode, run) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, mode);
        const request = run(tx.objectStore(DB_STORE));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
      })
  );
}

export function saveAudio(projectId, blob) {
  return withStore('readwrite', (store) => store.put(blob, projectId));
}

export function loadAudio(projectId) {
  return withStore('readonly', (store) => store.get(projectId));
}

export function deleteAudio(projectId) {
  return withStore('readwrite', (store) => store.delete(projectId));
}
