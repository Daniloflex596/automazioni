#!/usr/bin/env node
// COCKPIT: genera outbox/cockpit.html — il cruscotto visuale da cui Danilo governa i due cancelli
// e vede i lead caldi. Self-contained: apri il file nel browser. Gli screenshot sono referenziati
// dai siti generati. In LIVE i lead caldi arrivano dal Worker (/admin/leads); in locale mostriamo
// lo stato del funnel e dell'outreach.
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { paths, logger } from '../lib/util.mjs';
import { config } from '../lib/config.mjs';
import { load, all, STATES } from '../lib/registry.mjs';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function funnelBars(byState) {
  const max = Math.max(1, ...STATES.map((s) => byState[s].length));
  return STATES.filter((s) => byState[s].length).map((s) => {
    const n = byState[s].length;
    return `<div class="frow"><span class="fname">${s}</span><span class="fbar" style="width:${(n / max) * 100}%"></span><span class="fnum">${n}</span></div>`;
  }).join('');
}

function demoCard(b) {
  const shots = b.site_dir ? `../${b.site_dir}/shots` : null;
  const imgs = shots ? ['desktop-hero.png', 'mobile-hero.png', 'desktop-cta.png']
    .map((f) => `<a href="${shots}/${f}" target="_blank"><img src="${shots}/${f}" loading="lazy"></a>`).join('') : '<em>no screenshot</em>';
  const qa = b.qa?.ok ? `QA ✓ ${b.qa.jsKB}KB · ${b.qa.loadMs}ms` : (b.qa ? 'QA ✗' : '—');
  return `<div class="card">
    <div class="chead"><h3>${esc(b.name)}</h3><span class="score">${b.score ?? ''}</span></div>
    <div class="meta">${esc(b.rating)}★ (${esc(b.reviews_count)}) · ${esc(b.zone)} · ${esc(b.template)} · <span class="state s-${b.state}">${b.state}</span></div>
    <div class="shots">${imgs}</div>
    <div class="meta small">${qa}${b.qa?.warnings?.length ? ' · ⚠ ' + esc(b.qa.warnings.join('; ')) : ''}</div>
    ${b.demo_url ? `<div class="meta small">Demo: <code>${esc(b.demo_url)}</code></div>` : ''}
    <div class="actions">
      <code>npm run registry -- approve ${esc(b.place_id)}</code>
      <code>npm run registry -- reject ${esc(b.place_id)}</code>
    </div>
  </div>`;
}

export function buildCockpit() {
  const reg = load();
  const cfg = config();
  const businesses = all(reg).sort((a, b) => (b.score || 0) - (a.score || 0));
  const byState = {}; for (const s of STATES) byState[s] = businesses.filter((b) => b.state === s);

  const toApprove = byState['demo-pronta'];
  const approved = byState['approvata'];
  const readySend = businesses.filter((b) => b.outreach_drafted && ['demo-pronta', 'approvata'].includes(b.state));
  const won = businesses.filter((b) => ['pagato', 'live', 'attivo'].includes(b.state));
  const mrr = won.filter((b) => ['pagato', 'live', 'attivo'].includes(b.state)).length * (cfg.commercial.monthly_price_eur || 0);

  const html = `<!doctype html><html lang="it"><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Local3D · Cockpit</title><style>
*{box-sizing:border-box;margin:0}body{font-family:system-ui,sans-serif;background:#0a0a0f;color:#f5f5f7;padding:2rem;max-width:1200px;margin:auto}
h1{font-size:1.6rem;margin-bottom:.3rem}.sub{color:#9a9aa8;margin-bottom:1.5rem}
.kpis{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:2rem}
.kpi{background:#15151f;border:1px solid #ffffff14;border-radius:14px;padding:1rem 1.4rem;min-width:140px}
.kpi b{font-size:1.8rem;display:block;color:#ffd23f}.kpi span{color:#9a9aa8;font-size:.85rem}
h2{font-size:1.1rem;margin:2rem 0 1rem;border-bottom:1px solid #ffffff14;padding-bottom:.5rem}
.frow{display:flex;align-items:center;gap:.6rem;margin:.35rem 0}.fname{width:110px;color:#9a9aa8;font-size:.85rem}
.fbar{height:12px;background:linear-gradient(90deg,#ff3d5a,#ffd23f);border-radius:6px;min-width:4px}.fnum{font-weight:700}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1.2rem}
.card{background:#15151f;border:1px solid #ffffff14;border-radius:16px;padding:1.1rem}
.chead{display:flex;justify-content:space-between;align-items:center}.chead h3{font-size:1.15rem}
.score{background:#ff3d5a22;border:1px solid #ff3d5a55;color:#ffd23f;border-radius:100px;padding:.1rem .7rem;font-weight:700}
.meta{color:#9a9aa8;font-size:.85rem;margin:.5rem 0}.small{font-size:.78rem}
.shots{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:auto auto;gap:.4rem;margin:.6rem 0}
.shots a:first-child{grid-row:span 2}.shots img{width:100%;border-radius:8px;display:block;border:1px solid #ffffff14}
.actions{display:flex;flex-direction:column;gap:.3rem;margin-top:.6rem}
code{background:#000;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;color:#ffd23f;display:block;overflow:auto}
.state{padding:.05rem .5rem;border-radius:100px;font-size:.72rem}.s-approvata{background:#3fae6a33;color:#7fe0a3}
.s-demo-pronta{background:#ffd23f22;color:#ffd23f}.s-pagato,.s-live,.s-attivo{background:#00e5ff22;color:#7ff0ff}
.empty{color:#6a6a78;font-style:italic}
</style></head><body>
<h1>Local3D · Cockpit</h1>
<div class="sub">Governa i due cancelli. Aggiornato: ${esc(reg.updated_at || '')}</div>
<div class="kpis">
  <div class="kpi"><b>${businesses.length}</b><span>prospect totali</span></div>
  <div class="kpi"><b>${toApprove.length}</b><span>demo da approvare</span></div>
  <div class="kpi"><b>${readySend.length}</b><span>contatti da inviare</span></div>
  <div class="kpi"><b>${won.length}</b><span>clienti</span></div>
  <div class="kpi"><b>€${mrr}</b><span>MRR stimato</span></div>
</div>

<h2>🟢 Cancello 1 — Demo da approvare (${toApprove.length})</h2>
<div class="grid">${toApprove.map(demoCard).join('') || '<p class="empty">Niente in attesa.</p>'}</div>

<h2>✅ Approvate — pronte a pubblicare/inviare (${approved.length})</h2>
<div class="grid">${approved.map(demoCard).join('') || '<p class="empty">Niente.</p>'}</div>

<h2>📊 Funnel</h2>
${funnelBars(byState)}

<h2>📨 Cancello 2 — Contatti pronti (${readySend.length})</h2>
${readySend.map((b) => `<div class="meta">• <b>${esc(b.name)}</b> — ${b.contact_email ? esc(b.contact_email) : 'solo WhatsApp'} · <code>npm run registry -- sent ${esc(b.place_id)}</code></div>`).join('') || '<p class="empty">Niente in coda.</p>'}

<h2>🔥 Lead caldi</h2>
<p class="meta small">In produzione arrivano dal backend: <code>curl -H "Authorization: Bearer $ADMIN_TOKEN" $WORKER_BASE/admin/leads</code> — chi ha aperto/cliccato la demo è il momento di chiamare.</p>
</body></html>`;
  return html;
}

export function runCockpit() {
  const out = join(paths.outbox, 'cockpit.html');
  writeFileSync(out, buildCockpit());
  logger.ok('COCKPIT scritto in outbox/cockpit.html (aprilo nel browser)');
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) runCockpit();
