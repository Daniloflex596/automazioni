// Pagine HTML servite dal Worker (onboarding post-pagamento). Self-contained, tema coerente.
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function onboardingPage({ place_id = '', slug = '', name = '' } = {}) {
  return `<!doctype html><html lang="it"><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Attiviamo il tuo sito${name ? ' — ' + esc(name) : ''}</title><style>
*{box-sizing:border-box;margin:0}body{font-family:system-ui,sans-serif;background:#0a0a0f;color:#f5f5f7;min-height:100vh;padding:2rem 1rem}
.wrap{max-width:640px;margin:auto;background:#15151f;border:1px solid #ffffff14;border-radius:20px;padding:2rem}
h1{font-size:1.6rem;margin-bottom:.4rem}.sub{color:#9a9aa8;margin-bottom:1.6rem;line-height:1.5}
label{display:block;margin:1.1rem 0 .35rem;font-weight:600;font-size:.95rem}
input,textarea{width:100%;padding:.85rem;border-radius:12px;background:#0a0a0f;color:#f5f5f7;border:1px solid #ffffff22;font-family:inherit;font-size:1rem}
textarea{resize:vertical;min-height:90px}.hint{color:#9a9aa8;font-size:.8rem;margin-top:.25rem}
button{margin-top:1.8rem;width:100%;padding:1rem;border:none;border-radius:100px;background:#ff3d5a;color:#fff;font-weight:700;font-size:1.05rem;cursor:pointer}
.ok{background:#3fae6a22;border:1px solid #3fae6a55;color:#7fe0a3;padding:1rem;border-radius:12px;margin-bottom:1rem}
.step{color:#ffd23f;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase}
</style></head><body><div class="wrap">
<p class="step">Pagamento ricevuto ✓</p>
<h1>Attiviamo il tuo sito${name ? ', ' + esc(name) : ''}</h1>
<p class="sub">Ultimo passo: raccontaci le ultime cose e prepariamo la versione definitiva. Bastano 2 minuti — poi ci pensiamo noi.</p>
<div class="ok">Sei coperto dalla garanzia: soddisfatto o rimborsato entro 7 giorni.</div>
<form method="POST" action="/onboarding">
  <input type="hidden" name="place_id" value="${esc(place_id)}">
  <input type="hidden" name="slug" value="${esc(slug)}">
  <label>Il tuo nome e ruolo</label>
  <input name="referente" placeholder="Es. Marco, titolare" required>
  <label>Telefono diretto (per WhatsApp)</label>
  <input name="telefono" placeholder="+39 ..." required>
  <label>Dominio che preferisci</label>
  <input name="dominio" placeholder="es. ilrederporchetta.it">
  <p class="hint">Se è libero lo registriamo a nome tuo. Altrimenti ti proponiamo alternative.</p>
  <label>Menu ufficiale</label>
  <textarea name="menu" placeholder="Incolla il menu, o scrivi 've lo mando su WhatsApp'"></textarea>
  <label>Foto del locale</label>
  <textarea name="foto" placeholder="Le foto vere fanno la differenza. Scrivi 'le mando su WhatsApp' e ti scriviamo noi dove caricarle."></textarea>
  <label>Social da collegare</label>
  <input name="social" placeholder="Instagram / Facebook (facoltativo)">
  <label>Vuoi cambiare qualcosa rispetto all'anteprima?</label>
  <textarea name="note" placeholder="2 revisioni incluse — dicci pure"></textarea>
  <button type="submit">Invia e attiva il sito</button>
</form>
</div></body></html>`;
}
