// Suite end-to-end del prototipo (Playwright + Chromium headless).
//
// Esecuzione:   node tests/e2e.mjs
// Se Playwright non è nel progetto, indicare il modulo:
//   PLAYWRIGHT_MODULE=/percorso/a/playwright/index.mjs node tests/e2e.mjs
//
// La suite avvia da sola un server statico sull'app: nessuna dipendenza
// oltre a Playwright stesso.

import http from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const APP_DIR = fileURLToPath(new URL('../app/', import.meta.url));
const PORT = 8763;
const BASE = `http://localhost:${PORT}`;

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

// ---------- server statico minimale ----------

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.wav': 'audio/wav',
};

const server = http.createServer(async (req, res) => {
  try {
    // su Windows normalize('/') produce '\', quindi vanno spogliati entrambi i separatori
    const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^[/\\]+/, '') || 'index.html';
    const file = await readFile(join(APP_DIR, path === '' ? 'index.html' : path));
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(file);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((resolve) => server.listen(PORT, resolve));

// ---------- fixture: un piccolo WAV vero e un file corrotto ----------

const fixtureDir = await mkdtemp(join(tmpdir(), 'asd-e2e-'));

function makeWavFixture(seconds = 2, freq = 220) {
  const sr = 22050;
  const frames = sr * seconds;
  const data = Buffer.alloc(44 + frames * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + frames * 2, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22); data.writeUInt32LE(sr, 24); data.writeUInt32LE(sr * 2, 28);
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(frames * 2, 40);
  for (let i = 0; i < frames; i++) {
    const sample = 0.4 * Math.sin((2 * Math.PI * freq * i) / sr) + 0.2 * Math.sin((2 * Math.PI * 80 * i) / sr);
    data.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  return data;
}

const goodWav = join(fixtureDir, 'mio-pezzo.wav');
await writeFile(goodWav, makeWavFixture());
const badWav = join(fixtureDir, 'corrotto.wav');
await writeFile(badWav, Buffer.from('questo non è un file audio, è testo travestito'));
// "vocale WhatsApp": estensione .opus (MIME spesso vuoto/generico) con dentro
// audio reale — il primo controllo deve farlo passare, la decodifica decide
const opusVoice = join(fixtureDir, 'vocale-whatsapp.opus');
await writeFile(opusVoice, makeWavFixture(1, 330));

// ---------- harness ----------

let failures = 0;
function check(condition, label) {
  if (condition) console.log(`  ✓ ${label}`);
  else { failures++; console.log(`  ✗ FALLITO: ${label}`); }
}

const browser = await chromium.launch();
const jsErrors = [];

// Un unico contesto per i test desktop: la persistenza (localStorage +
// IndexedDB) deve sopravvivere tra una pagina e l'altra, come per un
// utente reale che chiude e riapre la scheda.
const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });

async function newPage(context = desktopContext) {
  const page = await context.newPage();
  page.on('pageerror', (e) => jsErrors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') jsErrors.push(`CONSOLE: ${m.text()}`); });
  // conferma i confirm(); risponde ai prompt() (usato dal test di rinomina)
  page.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'Rinominato' : undefined));
  return page;
}

// ---------- test 1: flusso completo con upload di un file vero ----------

console.log('\n[1] Flusso completo con upload reale');
{
  const page = await newPage();
  await page.goto(`${BASE}/#/new`, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type="file"]', goodWav);
  check(await page.locator('.file-pill .name').textContent() === 'mio-pezzo.wav', 'file accettato e mostrato');
  check((await page.inputValue('input[type="text"]')) === 'mio-pezzo', 'nome progetto precompilato dal file');

  // pre-ascolto prima del caricamento (step A1): player presente sul file
  // scelto, sparisce togliendo il file, ricompare scegliendone un altro
  check((await page.locator('audio[src^="blob:"]').count()) === 1, 'pre-ascolto disponibile sul file scelto');
  await page.locator('.file-pill button').click();
  check((await page.locator('audio').count()) === 0, 'pre-ascolto rimosso togliendo il file');
  await page.setInputFiles('input[type="file"]', goodWav);
  check((await page.locator('audio[src^="blob:"]').count()) === 1, 'pre-ascolto torna ricaricando un file');

  await page.click('button:has-text("Crea il progetto")');
  await page.waitForSelector('.metric-grid', { timeout: 30000 });
  check((await page.locator('.insight').count()) > 0, 'analisi con osservazioni');

  await page.click('button:has-text("Scegli l’identità sonora")');
  await page.waitForSelector('.identity-card');
  check((await page.locator('.identity-card').count()) === 6, '6 identità presenti');

  // suggerimento automatico (blocco 6c): banner con motivo, consigliata
  // evidenziata e preselezionata, due alternative — la scelta resta libera
  check((await page.locator('.suggestion-banner').count()) === 1, 'banner del suggerimento presente');
  check((await page.locator('.suggestion-banner h4').textContent()).includes('partiremmo da'),
    'il suggerimento parla in linguaggio da artista');
  check((await page.locator('.identity-card.recommended').count()) === 1, 'una identità consigliata evidenziata');
  check((await page.locator('.identity-card.recommended.selected').count()) === 1, 'la consigliata è preselezionata');
  check((await page.locator('.reco-ribbon.alt').count()) === 2, 'due alternative proposte');

  // pre-ascolto, poi selezione
  await page.locator('.identity-card').nth(1).locator('button:has-text("Ascolta")').click();
  await page.waitForTimeout(400);
  check((await page.locator('button:has-text("Ferma")').count()) === 1, 'pre-ascolto attivo');
  await page.locator('.identity-card', { hasText: 'Radio Pulito' }).click();
  await page.click('button:has-text("Continua con questa")');
  await page.waitForSelector('.macro-grid');
  check((await page.locator('h4:has-text("adattata al tuo brano")').count()) === 1, 'scheda di adattamento presente');

  // macro + A/B durante la riproduzione
  await page.locator('input[type="range"]').nth(1).fill('85');
  await page.click('.play-btn');
  await page.waitForTimeout(500);
  await page.locator('.ab-toggle button:has-text("Originale")').click();
  await page.waitForTimeout(200);
  await page.locator('.ab-toggle button:has-text("Diretto")').click();

  // indietro: cambio identità, poi avanti fino all'export
  await page.click('button:has-text("Cambia identità")');
  await page.locator('.identity-card', { hasText: 'Club Ready' }).click();
  await page.click('button:has-text("Continua con questa")');
  await page.waitForSelector('.macro-grid');
  check((await page.locator('input[type="range"]').nth(1).inputValue()) === '85', 'le rifiniture sopravvivono al cambio identità');

  await page.click('.step-actions button:has-text("Confronta")');
  await page.waitForSelector('.compare-switch');
  await page.click('.step-actions button:has-text("esporta")');
  await page.waitForSelector('.export-summary');
  check((await page.locator('.export-summary .row').count()) === 5, 'riepilogo export completo');
  check((await page.locator('.export-version').count()) === 4, '3 versioni + snippet social in export');

  let download = page.waitForEvent('download', { timeout: 60000 });
  await page.locator('.export-version', { hasText: 'Master' }).locator('button').click();
  await download;
  await page.waitForSelector('.export-done');
  download = page.waitForEvent('download', { timeout: 60000 });
  await page.locator('.export-version').nth(2).locator('button').click();
  await download;
  check(true, 'versioni Master e Social scaricate');

  // snippet social: presenza nell'export (non testiamo il download reale)
  check((await page.locator('.export-version', { hasText: 'Snippet social' }).count()) === 1,
    'voce snippet social presente in export');
  check((await page.locator('.export-version:has-text("Snippet social") .btn').count()) === 1,
    'bottone snippet social presente e cliccabile');

  // stepper: torno all'analisi e risalto direttamente all'export (già raggiunto)
  await page.click('.stepper button:has-text("Analisi")');
  await page.waitForSelector('.metric-grid');
  await page.click('.stepper button:has-text("Esporta")');
  await page.waitForSelector('.export-summary');
  check(true, 'navigazione libera tra step già raggiunti');
  await page.close();
}

// ---------- test 2: persistenza, libreria, eliminazione, profilo ----------

console.log('\n[2] Libreria, persistenza, profilo');
{
  const page = await newPage();
  await page.goto(`${BASE}/#/library`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.proj-card');
  check((await page.locator('.proj-card').count()) === 1, 'progetto presente dopo nuova sessione');
  check((await page.locator('.badge.done').count()) === 1, 'badge "esportato" presente');

  await page.locator('.proj-card button:has-text("Rinomina")').click();
  await page.waitForTimeout(200);
  check((await page.locator('.proj-card h3').first().textContent()) === 'Rinominato', 'rinomina progetto funziona');

  // secondo progetto (demo), poi eliminazione
  await page.goto(`${BASE}/#/new`);
  await page.click('button:has-text("brano demo")');
  await page.waitForSelector('.metric-grid', { timeout: 30000 });
  await page.goto(`${BASE}/#/library`);
  await page.waitForSelector('.proj-card');
  check((await page.locator('.proj-card').count()) === 2, 'due progetti in libreria');
  await page.locator('.proj-card', { hasText: 'Brano demo' }).locator('button:has-text("Elimina")').click();
  await page.waitForTimeout(300);
  check((await page.locator('.proj-card').count()) === 1, 'eliminazione funziona');

  // riapertura progetto esistente
  await page.locator('.proj-card button').first().click();
  await page.waitForSelector('.export-summary, .metric-grid', { timeout: 30000 });
  check(true, 'progetto riaperto con audio da IndexedDB');

  // profilo
  await page.goto(`${BASE}/#/profile`);
  await page.fill('input[type="text"]', 'TestArtist');
  await page.click('button:has-text("Salva")');
  await page.reload();
  await page.waitForSelector('.page-title');
  check((await page.locator('.page-title').textContent()).includes('TestArtist'), 'nome profilo persistente');
  await page.close();
}

// ---------- test 3: validazione upload (A2) — corrotto bloccato, .opus accettato ----------

console.log('\n[3] Validazione upload: file corrotto e vocale .opus');
{
  const page = await newPage();

  // file corrotto: la creazione viene bloccata SUL FORM, nessun progetto creato
  await page.goto(`${BASE}/#/new`, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type="file"]', badWav);
  await page.click('button:has-text("Crea il progetto")');
  await page.waitForSelector('.toast.error', { timeout: 30000 });
  check((await page.locator('.toast.error').textContent()).includes('Non riesco a leggere'),
    'file corrotto bloccato con messaggio chiaro');
  check((await page.locator('.dropzone').count()) === 1, 'si resta sul form, niente Studio');
  await page.goto(`${BASE}/#/library`);
  await page.waitForSelector('.proj-card');
  check((await page.locator('.proj-card').count()) === 1, 'nessun progetto orfano dal file corrotto');

  // vocale .opus con audio reale: accettato e portato fino all'analisi
  await page.goto(`${BASE}/#/new`);
  await page.setInputFiles('input[type="file"]', opusVoice);
  check(await page.locator('.file-pill .name').textContent() === 'vocale-whatsapp.opus',
    'file .opus accettato dal form');
  await page.click('button:has-text("Crea il progetto")');
  await page.waitForSelector('.metric-grid', { timeout: 30000 });
  check(true, 'progetto creato dal vocale .opus, analisi raggiunta');
  await page.close();
}

// ---------- test 4: mobile (390×844) — niente overflow orizzontale ----------

console.log('\n[4] Mobile viewport');
{
  const page = await newPage(mobileContext);
  const noOverflow = async () =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

  await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
  check(await noOverflow(), 'home senza overflow orizzontale');

  await page.goto(`${BASE}/#/new`);
  await page.click('button:has-text("brano demo")');
  await page.waitForSelector('.metric-grid', { timeout: 30000 });
  check(await noOverflow(), 'analisi senza overflow');

  await page.click('button:has-text("Scegli l’identità sonora")');
  await page.waitForSelector('.identity-card');
  check(await noOverflow(), 'identità senza overflow');

  await page.locator('.identity-card', { hasText: 'Social Punch' }).click();
  await page.click('button:has-text("Continua con questa")');
  await page.waitForSelector('.macro-grid');
  check(await noOverflow(), 'personalizzazione senza overflow');

  await page.click('.step-actions button:has-text("Confronta")');
  await page.waitForSelector('.compare-switch');
  check(await noOverflow(), 'confronto senza overflow');

  await page.click('.step-actions button:has-text("esporta")');
  await page.waitForSelector('.export-summary');
  check(await noOverflow(), 'export senza overflow');

  await page.goto(`${BASE}/#/library`);
  await page.waitForSelector('.proj-card, .empty-state');
  check(await noOverflow(), 'libreria senza overflow');
  await page.close();
}

// ---------- esito ----------

await browser.close();
server.close();

if (jsErrors.length) {
  failures += jsErrors.length;
  console.log('\nErrori JavaScript raccolti:');
  for (const e of jsErrors) console.log('  ' + e);
}

console.log(failures === 0 ? '\n✅ TUTTI I TEST PASSANO' : `\n❌ ${failures} PROBLEMI`);
process.exit(failures === 0 ? 0 : 1);
