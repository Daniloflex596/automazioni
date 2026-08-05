// Helper minimi per costruire DOM e feedback utente.

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== null && value !== undefined && value !== false) {
      node.setAttribute(key, value === true ? '' : value);
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function toast(message, type = 'info', duration = null) {
  const root = document.getElementById('toast-root');
  const node = el('div', { class: `toast ${type === 'error' ? 'error' : ''}` }, message);
  root.append(node);
  // gli errori spiegano anche cosa fare: restano visibili più a lungo
  setTimeout(() => node.remove(), duration ?? (type === 'error' ? 5200 : 3200));
}

// Dialog dell'app (sostituisce prompt/confirm nativi): coerente col design,
// chiudibile con Esc o cliccando fuori. Risolve con:
//  - conferma semplice → true / null
//  - con `input`      → testo inserito / null
export function appDialog({ title, message, confirmLabel = 'Conferma', cancelLabel = 'Annulla', input = null, danger = false }) {
  return new Promise((resolve) => {
    const inputEl = input
      ? el('input', { type: 'text', value: input.value || '', maxlength: input.maxlength || '60' })
      : null;

    const close = (result) => { overlay.remove(); resolve(result); };
    const confirmBtn = el('button', {
      class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`,
      onClick: () => close(inputEl ? inputEl.value.trim() : true),
    }, confirmLabel);

    const overlay = el('div', {
        class: 'dialog-overlay',
        onClick: (event) => { if (event.target === overlay) close(null); },
        onKeydown: (event) => { if (event.key === 'Escape') close(null); },
      },
      el('div', { class: 'dialog-card' },
        el('h3', {}, title),
        message && el('p', { class: 'muted small', style: 'margin-top:8px' }, message),
        inputEl && el('div', { style: 'margin-top:14px' }, inputEl),
        el('div', { class: 'dialog-actions' },
          el('button', { class: 'btn', onClick: () => close(null) }, cancelLabel),
          confirmBtn
        )
      )
    );

    document.body.append(overlay);
    if (inputEl) {
      inputEl.addEventListener('keydown', (event) => { if (event.key === 'Enter') confirmBtn.click(); });
      inputEl.focus();
      inputEl.select();
    } else {
      confirmBtn.focus();
    }
  });
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// Slider con riempimento colorato fino al valore corrente.
export function syncRangeFill(input) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const pct = ((Number(input.value) - min) / (max - min)) * 100;
  input.style.setProperty('--fill', `${pct}%`);
}
