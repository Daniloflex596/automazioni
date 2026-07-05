#!/usr/bin/env node
// VERIFY: QA meccanico e deterministico. Ciò che è oggettivo lo decide la macchina;
// l'"è spettacolare?" resta all'occhio umano (report mattutino). Qui: diff dati, errori console,
// budget performance, sanity layout + screenshot desktop/mobile.
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { paths, ensureDir, readJSON, logger } from '../lib/util.mjs';
import { load, save, all, upsert } from '../lib/registry.mjs';
import { launchChromium } from '../lib/browser.mjs';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const MAX_JS_BYTES = 1_600_000; // budget raw (non gzip) del JS totale servito
const MAX_LOAD_MS = 12_000;

function serveDir(dir) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/' || p === '') p = '/index.html';
      if (p === '/favicon.ico') { res.statusCode = 204; return res.end(); }
      const file = join(dir, p);
      if (!existsSync(file) || !file.startsWith(dir)) { res.statusCode = 404; return res.end('nf'); }
      res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream');
      res.end(readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

async function verifyOne(browser, siteDir, biz) {
  const { server, port } = await serveDir(siteDir);
  const errors = [];
  const warnings = [];
  let jsBytes = 0;
  const shotsDir = join(siteDir, 'shots');
  ensureDir(shotsDir);

  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // gli errori di risorsa 404 li cattura il response handler; qui teniamo i veri errori JS
      if (/Failed to load resource|favicon/i.test(t)) return;
      errors.push(`console: ${t}`.slice(0, 200));
    });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`.slice(0, 200)));
    page.on('response', (r) => {
      const u = r.url();
      if (u.endsWith('.js')) jsBytes += Number(r.headers()['content-length'] || 0);
      if (r.status() >= 400 && !u.includes('favicon')) errors.push(`http ${r.status()}: ${u.split('/').pop()}`);
    });

    const t0 = Date.now();
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle', timeout: MAX_LOAD_MS }).catch((e) => errors.push(`load: ${e.message}`));
    const loadMs = Date.now() - t0;

    // --- DIFF DATI: i campi chiave devono comparire nel DOM ---
    const domName = norm(await page.locator('[data-field="name"]').first().textContent().catch(() => ''));
    const domPhone = norm(await page.locator('[data-field="phone"]').first().textContent().catch(() => ''));
    const domClaim = norm(await page.locator('[data-field="claim"]').first().textContent().catch(() => ''));

    if (!domName || !norm(biz.identity.name).includes(domName.slice(0, 6))) errors.push(`diff-dati: nome DOM='${domName}' vs '${biz.identity.name}'`);
    if (biz.contacts.phone.value && domPhone.replace(/\D/g, '') !== biz.contacts.phone.value.replace(/\D/g, '')) errors.push(`diff-dati: telefono DOM='${domPhone}' vs '${biz.contacts.phone.value}'`);
    if (!domClaim) warnings.push('claim non visibile nel DOM');

    // --- SANITY LAYOUT: hero title ha dimensioni reali ---
    const box = await page.locator('.hero-title').first().boundingBox().catch(() => null);
    if (!box || box.width < 40 || box.height < 20) errors.push('layout: titolo hero non renderizzato');

    // --- PERFORMANCE ---
    if (jsBytes > MAX_JS_BYTES) errors.push(`perf: JS ${Math.round(jsBytes / 1024)}KB > budget ${Math.round(MAX_JS_BYTES / 1024)}KB`);
    if (loadMs > MAX_LOAD_MS - 500) warnings.push(`perf: load ${loadMs}ms vicino al limite`);

    // --- SCREENSHOT desktop ---
    await page.waitForTimeout(1200); // lascia partire l'animazione 3D
    await page.screenshot({ path: join(shotsDir, 'desktop-hero.png') });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(shotsDir, 'desktop-cta.png') });

    // --- SCREENSHOT mobile ---
    await ctx.close();
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
    const mpage = await mctx.newPage();
    await mpage.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle', timeout: MAX_LOAD_MS }).catch(() => {});
    await mpage.waitForTimeout(1200);
    await mpage.screenshot({ path: join(shotsDir, 'mobile-hero.png'), fullPage: false });
    await mctx.close();

    return { ok: errors.length === 0, errors, warnings, loadMs, jsBytes };
  } finally {
    server.close();
  }
}

export async function runVerify() {
  const reg = load();
  const todo = all(reg).filter((b) => b.site_dir && ['qualificato', 'demo-pronta'].includes(b.state));
  if (!todo.length) { logger.info('VERIFY: niente da verificare'); return { verified: 0, passed: 0 }; }

  logger.step(`VERIFY: ${todo.length} siti`);
  const browser = await launchChromium();
  let passed = 0;
  try {
    for (const b of todo) {
      const siteDir = join(paths.root, b.site_dir);
      const biz = readJSON(join(siteDir, 'business.json'));
      const res = await verifyOne(browser, siteDir, biz);
      if (res.ok) {
        passed++;
        upsert(reg, b.place_id, { state: 'demo-pronta', qa: { ok: true, warnings: res.warnings, loadMs: res.loadMs, jsKB: Math.round(res.jsBytes / 1024), at: new Date().toISOString() }, last_error: null });
        logger.ok(`✓ ${b.name} — QA superato (load ${res.loadMs}ms, JS ${Math.round(res.jsBytes / 1024)}KB)`);
      } else {
        upsert(reg, b.place_id, { qa: { ok: false, errors: res.errors, warnings: res.warnings, at: new Date().toISOString() }, last_error: res.errors.join('; ') });
        logger.error(`✗ ${b.name} — QA fallito`, { errors: res.errors });
      }
    }
  } finally {
    await browser.close();
  }
  save(reg);
  logger.ok(`VERIFY completato: ${passed}/${todo.length} superati → stato 'demo-pronta' (in attesa cancello umano PUBBLICA)`);
  return { verified: todo.length, passed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runVerify().catch((e) => { logger.error(e.stack || e.message); process.exit(1); });
}
