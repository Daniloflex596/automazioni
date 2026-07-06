/**
 * ============================================================================
 *  ARKADIA — CARRELLO / ORDINA (feature isolata)
 * ============================================================================
 *  Nessun backend: l'ordine si compone qui e parte come messaggio WhatsApp
 *  precompilato — stessa filosofia della prenotazione. Persistenza in
 *  localStorage, quantità, formati (25cl/50cl/Tower, Bicchiere/Shot,
 *  Calice/Bottiglia) scelti da un pannellino dedicato.
 *
 *  Aggancio: bottoni [data-ord] su /menu + numero WhatsApp in
 *  #contenuto[data-whatsapp]. Per rimuovere la feature: cancella questo
 *  file, i bottoni .ord-btn e gli stili .crl-* — il resto non cambia.
 * ============================================================================
 */
const KEY = 'arkadia-carrello-v1';
const wa = document.getElementById('contenuto')?.dataset.whatsapp || '';
const prezzoNum = (p) => parseFloat(String(p).replace(',', '.')) || 0;
const eur = (n) => '€ ' + n.toFixed(2).replace('.', ',');
// Escape difensivo: i nomi/formati arrivano da dati controllati (data-ord),
// ma passano da localStorage; li ripuliamo prima di inserirli via innerHTML.
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let items = [];
try {
  items = JSON.parse(localStorage.getItem(KEY) || '[]');
  if (!Array.isArray(items)) items = [];
} catch {
  items = [];
}
const save = () => localStorage.setItem(KEY, JSON.stringify(items));
const count = () => items.reduce((s, i) => s + i.q, 0);
const total = () => items.reduce((s, i) => s + prezzoNum(i.p) * i.q, 0);

/* ---------- UI iniettata ---------- */
const ui = document.createElement('div');
ui.id = 'crl-root';
ui.innerHTML = `
  <button id="crl-fab" aria-label="Apri il tuo ordine" hidden>
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/>
      <path d="M3 3h2.5l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.2L20.5 7H6"/>
    </svg>
    <span id="crl-badge">0</span>
  </button>
  <div id="crl-overlay" hidden></div>
  <aside id="crl-panel" data-lenis-prevent hidden role="dialog" aria-label="Il tuo ordine">
    <header class="crl-head">
      <h3>Il tuo ordine</h3>
      <button id="crl-close" aria-label="Chiudi">×</button>
    </header>
    <ul id="crl-list"></ul>
    <p id="crl-vuoto">Il carrello è vuoto. Tocca <b>+</b> accanto a una voce del menu per aggiungerla.</p>
    <footer class="crl-foot">
      <p class="crl-tot">Totale <strong id="crl-tot">€ 0,00</strong></p>
      <button id="crl-invia" class="crl-btn-oro">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm5.9 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.8-.6-3.1-1.3-5.1-4.4-5.3-4.6-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .7.5.3.6.9 2.1 1 2.2.1.2.1.3 0 .5-.1.2-.2.4-.3.5l-.5.5c-.2.2-.3.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.3.1 1.7.8 2 .9.3.2.5.2.6.4.1.1.1.7-.1 1.4z"/></svg>
        Ordina su WhatsApp
      </button>
      <p class="crl-nota">Ritiro o consegna? Lo concordi in chat.</p>
      <button id="crl-svuota">Svuota il carrello</button>
    </footer>
  </aside>
  <div id="crl-picker" data-lenis-prevent hidden role="dialog" aria-label="Scegli il formato">
    <p id="crl-picker-nome"></p>
    <div id="crl-picker-opts"></div>
    <button id="crl-picker-chiudi">Annulla</button>
  </div>
  <p id="crl-toast" role="status" hidden></p>
`;
document.body.appendChild(ui);

const $ = (id) => document.getElementById(id);
const fab = $('crl-fab');
const overlay = $('crl-overlay');
const panel = $('crl-panel');
const picker = $('crl-picker');
const toastEl = $('crl-toast');

let toastT = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  toastEl.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(() => {
    toastEl.classList.remove('is-on');
    setTimeout(() => (toastEl.hidden = true), 300);
  }, 1600);
}

function renderBadge() {
  const n = count();
  $('crl-badge').textContent = n;
  fab.hidden = panel.hidden ? n === 0 : true;
  fab.classList.toggle('has-items', n > 0);
}

function renderPanel() {
  const list = $('crl-list');
  list.innerHTML = '';
  items.forEach((it, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="crl-n">${esc(it.n)}${it.f ? ` <em>${esc(it.f)}</em>` : ''}</span>
      <span class="crl-q">
        <button data-idx="${idx}" data-d="-1" aria-label="Togli uno">−</button>
        <b>${it.q}</b>
        <button data-idx="${idx}" data-d="1" aria-label="Aggiungi uno">+</button>
      </span>
      <span class="crl-p mono">${eur(prezzoNum(it.p) * it.q)}</span>`;
    list.appendChild(li);
  });
  $('crl-vuoto').hidden = items.length > 0;
  $('crl-tot').textContent = eur(total());
  $('crl-invia').disabled = items.length === 0;
  renderBadge();
}

function addItem(n, f, p) {
  const found = items.find((i) => i.n === n && i.f === f);
  if (found) found.q += 1;
  else items.push({ n, f, p, q: 1 });
  save();
  renderPanel();
  toast(`Aggiunto: ${n}${f ? ' · ' + f : ''} ✓`);
}

function openPanel() {
  panel.hidden = false;
  overlay.hidden = false;
  fab.hidden = true;
  requestAnimationFrame(() => panel.classList.add('is-open'));
}
function closePanel() {
  panel.classList.remove('is-open');
  overlay.hidden = true;
  setTimeout(() => {
    panel.hidden = true;
    renderBadge();
  }, 250);
}
function openPicker(data) {
  $('crl-picker-nome').textContent = data.n;
  const opts = $('crl-picker-opts');
  opts.innerHTML = '';
  data.f.forEach((o) => {
    const b = document.createElement('button');
    b.className = 'crl-opt';
    b.innerHTML = `<span>${esc(o.f)}</span><span class="mono">€ ${esc(o.p)}</span>`;
    b.addEventListener('click', () => {
      picker.hidden = true;
      overlay.hidden = true;
      addItem(data.n, o.f, o.p);
    });
    opts.appendChild(b);
  });
  picker.hidden = false;
  overlay.hidden = false;
}

/* ---------- eventi ---------- */
document.querySelectorAll('.ord-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    let data;
    try {
      data = JSON.parse(btn.dataset.ord || '{}');
    } catch {
      return;
    }
    if (data.f && data.f.length) openPicker(data);
    else if (data.n && data.p) addItem(data.n, '', data.p);
  });
});
fab.addEventListener('click', openPanel);
$('crl-close').addEventListener('click', closePanel);
overlay.addEventListener('click', () => {
  if (!picker.hidden) {
    picker.hidden = true;
    overlay.hidden = panel.hidden;
    return;
  }
  closePanel();
});
$('crl-picker-chiudi').addEventListener('click', () => {
  picker.hidden = true;
  overlay.hidden = panel.hidden;
});
$('crl-list').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-idx]');
  if (!b) return;
  const it = items[Number(b.dataset.idx)];
  if (!it) return;
  it.q += Number(b.dataset.d);
  if (it.q <= 0) items.splice(items.indexOf(it), 1);
  save();
  renderPanel();
});
$('crl-svuota').addEventListener('click', () => {
  items = [];
  save();
  renderPanel();
});
$('crl-invia').addEventListener('click', () => {
  if (!items.length) return;
  const righe = items.map((i) => `• ${i.q}× ${i.n}${i.f ? ` (${i.f})` : ''} — ${eur(prezzoNum(i.p) * i.q)}`);
  const testo = [
    'Ciao Arkadia! Vorrei ordinare:',
    '',
    ...righe,
    '',
    `Totale: ${eur(total())}`,
    '',
    'Nome e ritiro/consegna te li scrivo qui sotto 👇',
  ].join('\n');
  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(testo)}`, '_blank', 'noopener');
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!picker.hidden) {
      picker.hidden = true;
      overlay.hidden = panel.hidden;
    } else if (!panel.hidden) closePanel();
  }
});

renderPanel();
