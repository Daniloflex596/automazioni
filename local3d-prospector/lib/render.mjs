// Helper condiviso: inietta un business.json in una copia del bundle buildato → sito statico.
// Un solo build del template, N siti: qui cambia solo il JSON iniettato.
import { join } from 'node:path';
import { existsSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { paths, ensureDir, writeJSON } from './util.mjs';

export const DIST = join(paths.template, 'dist');

export function injectSite(outDir, biz) {
  if (!existsSync(DIST)) throw new Error(`Bundle template mancante in ${DIST} (cd site-template && npm run build)`);
  ensureDir(outDir);
  cpSync(DIST, outDir, { recursive: true });
  const htmlPath = join(outDir, 'index.html');
  let html = readFileSync(htmlPath, 'utf8')
    .replace('/*__BUSINESS_JSON__*/ null', JSON.stringify(biz))
    .replace(/<title>[^<]*<\/title>/, `<title>${biz.identity.name} — ${biz.cta?.mode === 'demo' ? 'Anteprima' : ''}</title>`);
  writeFileSync(htmlPath, html);
  writeJSON(join(outDir, 'business.json'), biz);
  return outDir;
}
