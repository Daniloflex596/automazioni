// Launcher browser robusto: usa il Chromium completo preinstallato (non il chrome-headless-shell,
// che può avere una build diversa da quella attesa da Playwright). Con fallback per versione.
import { existsSync, readdirSync } from 'node:fs';

function findChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const candidates = [];
  try {
    for (const d of readdirSync(base)) {
      if (d.startsWith('chromium-') && !d.includes('headless')) candidates.push(`${base}/${d}/chrome-linux/chrome`);
    }
  } catch { /* ignore */ }
  candidates.push(`${base}/chromium/chrome-linux/chrome`);
  return candidates.find((p) => existsSync(p)) || null;
}

export async function launchChromium() {
  const { chromium } = await import('playwright');
  const args = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader'];
  const exe = findChromium();
  if (exe) { try { return await chromium.launch({ executablePath: exe, headless: true, args }); } catch { /* fall through */ } }
  return chromium.launch({ headless: true, args }); // ultima spiaggia: default
}
