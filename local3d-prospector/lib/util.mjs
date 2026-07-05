// Utility condivise: logging strutturato, slug, fs helpers, paths.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
export const ROOT = dirname(dirname(__filename)); // .../local3d-prospector

export const paths = {
  root: ROOT,
  config: join(ROOT, 'config'),
  data: join(ROOT, 'data'),
  sites: join(ROOT, 'sites'),
  outbox: join(ROOT, 'outbox'),
  mock: join(ROOT, 'mock'),
  template: join(ROOT, 'site-template'),
};

const LEVEL_COLORS = { info: 36, ok: 32, warn: 33, error: 31, step: 35 };
export function log(level, msg, extra) {
  const c = LEVEL_COLORS[level] || 37;
  const tag = level.toUpperCase().padEnd(5);
  const line = `\x1b[${c}m${tag}\x1b[0m ${msg}`;
  process.stdout.write(line + (extra ? ` ${JSON.stringify(extra)}` : '') + '\n');
}
export const logger = {
  info: (m, e) => log('info', m, e),
  ok: (m, e) => log('ok', m, e),
  warn: (m, e) => log('warn', m, e),
  error: (m, e) => log('error', m, e),
  step: (m, e) => log('step', m, e),
};

export function slugify(s) {
  return String(s)
    .toLowerCase()
    // strip combining diacritical marks after NFD normalization

    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

export function readJSON(path, fallback) {
  if (!existsSync(path)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`File non trovato: ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJSON(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
}

export function ensureDir(p) { mkdirSync(p, { recursive: true }); }

export function listDirs(p) {
  if (!existsSync(p)) return [];
  return readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
}

// Token non indovinabile per le URL demo (niente crypto pesante: sufficiente e senza dipendenze).
export function demoToken() {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 22; i++) out += a[Math.floor(Math.random() * a.length)];
  return out;
}

export const isMock = () => process.env.PROSPECTOR_MODE === 'mock' || !process.env.GOOGLE_PLACES_API_KEY;
