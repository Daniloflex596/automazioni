// Backend Local3D (Cloudflare Worker + D1). Zero dipendenze: fa i pezzi che un sito statico non può.
// Rotte: demo link + tracking, form (modifiche/onboarding), Stripe checkout + webhook, stato abbonamento.
// Il webhook Stripe è ciò che ACCENDE/SPEGNE il sito del cliente (enforcement del canone).

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', ...extra } });
const now = () => Date.now();

function requireAdmin(req, env) {
  const t = (req.headers.get('authorization') || '').replace('Bearer ', '');
  return env.ADMIN_TOKEN && t === env.ADMIN_TOKEN;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    try {
      if (method === 'OPTIONS') return new Response(null, { headers: cors() });
      if (path === '/health') return json({ ok: true, service: 'local3d-api', t: now() });

      // --- Registrazione demo (chiamata dalla pipeline DOPO l'approvazione umana) ---
      if (path === '/register' && method === 'POST') {
        if (!requireAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
        const b = await req.json();
        const ttl = Number(env.DEMO_TTL_DAYS || 45) * 86400000;
        await env.DB.prepare(
          `INSERT INTO demos (token, place_id, owner_id, slug, name, state, created_at, expires_at)
           VALUES (?,?,?,?,?, 'published', ?, ?)
           ON CONFLICT(token) DO UPDATE SET slug=excluded.slug, name=excluded.name, state='published'`
        ).bind(b.token, b.place_id, b.owner_id || 'danilo', b.slug, b.name || '', now(), now() + ttl).run();
        return json({ ok: true });
      }

      // --- Link demo canonico: logga 'open' e reindirizza al sito statico ---
      if (path.startsWith('/d/')) {
        const token = path.slice(3);
        const demo = await env.DB.prepare('SELECT * FROM demos WHERE token=?').bind(token).first();
        if (!demo) return new Response('Anteprima non trovata', { status: 404 });
        if (demo.state === 'expired' || (demo.expires_at && demo.expires_at < now()))
          return new Response('Questa anteprima è scaduta.', { status: 410 });
        await logEvent(env, { token, place_id: demo.place_id, action: 'open', ua: req.headers.get('user-agent') });
        const host = env.DEMO_HOST || 'demo.local3d.example';
        return Response.redirect(`https://${host}/${demo.slug}/`, 302);
      }

      // --- Tracking beacon dal sito (checkout/whatsapp/wants_change) ---
      if (path === '/track' && method === 'POST') {
        const b = await safeJson(req);
        await logEvent(env, { token: b.token, place_id: b.place_id, action: b.action || 'open', ua: req.headers.get('user-agent') });
        return json({ ok: true });
      }

      // --- Form: 1 modifica gratis pre-pagamento ---
      if (path === '/modify' && method === 'POST') {
        const payload = await formOrJson(req);
        await env.DB.prepare('INSERT INTO requests (kind, place_id, slug, payload, status, at) VALUES (?,?,?,?,?,?)')
          .bind('modify', payload.place_id || null, payload.slug || null, JSON.stringify(payload), 'new', now()).run();
        await logEvent(env, { place_id: payload.place_id, action: 'wants_change' });
        return htmlThanks('Richiesta ricevuta! Applichiamo la modifica e ti rimandiamo il link.');
      }

      // --- Form onboarding (post-pagamento) ---
      if (path === '/onboarding' && method === 'POST') {
        const payload = await formOrJson(req);
        await env.DB.prepare('INSERT INTO requests (kind, place_id, slug, payload, status, at) VALUES (?,?,?,?,?,?)')
          .bind('onboarding', payload.place_id || null, payload.slug || null, JSON.stringify(payload), 'new', now()).run();
        return htmlThanks('Grazie! Abbiamo tutto: prepariamo il tuo sito definitivo.');
      }

      // --- Avvio pagamento: crea sessione Stripe Checkout ---
      if (path.startsWith('/buy/')) {
        const token = path.slice(5);
        const demo = await env.DB.prepare('SELECT * FROM demos WHERE token=?').bind(token).first();
        if (!demo) return new Response('Anteprima non trovata', { status: 404 });
        await logEvent(env, { token, place_id: demo.place_id, action: 'checkout' });
        if (!env.STRIPE_SECRET_KEY) {
          return htmlInfo(`Pagamento non ancora configurato. Contatta Danilo per attivare ${demo.name}.`);
        }
        const session = await createCheckout(env, demo);
        if (!session?.url) return htmlInfo('Errore nella creazione del pagamento. Riprova o contattaci.');
        return Response.redirect(session.url, 303);
      }

      // --- Webhook Stripe: accende/spegne l'abbonamento ---
      if (path === '/webhook/stripe' && method === 'POST') {
        return handleStripeWebhook(req, env);
      }

      // --- Stato abbonamento (il sito live lo interroga per accendersi/spegnersi) ---
      if (path.startsWith('/status/')) {
        const placeId = path.slice(8);
        const sub = await env.DB.prepare('SELECT status, current_period_end FROM subscriptions WHERE place_id=?').bind(placeId).first();
        return json({ place_id: placeId, status: sub?.status || 'none', active: sub?.status === 'active' });
      }

      // --- Admin: lead caldi (chi ha aperto/cliccato la demo) ---
      if (path === '/admin/leads') {
        if (!requireAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
        const rows = await env.DB.prepare(
          `SELECT place_id,
                  SUM(action='open') opens,
                  SUM(action='checkout') checkouts,
                  SUM(action='wants_change') changes,
                  MAX(at) last
           FROM events GROUP BY place_id ORDER BY checkouts DESC, opens DESC LIMIT 100`
        ).all();
        return json({ leads: rows.results });
      }

      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  },
};

function cors() { return { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,authorization' }; }
async function safeJson(req) { try { return await req.json(); } catch { return {}; } }
async function formOrJson(req) {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) return safeJson(req);
  const fd = await req.formData();
  const o = {}; for (const [k, v] of fd.entries()) o[k] = v; return o;
}
async function logEvent(env, e) {
  await env.DB.prepare('INSERT INTO events (token, place_id, action, ua, at) VALUES (?,?,?,?,?)')
    .bind(e.token || null, e.place_id || null, e.action, e.ua || null, now()).run();
}
function htmlThanks(msg) { return new Response(`<!doctype html><meta charset=utf8><body style="font-family:sans-serif;background:#0a0a0f;color:#f5f5f7;display:grid;place-items:center;height:100vh;text-align:center"><div><h2>✓</h2><p>${msg}</p></div>`, { headers: { 'content-type': 'text/html' } }); }
function htmlInfo(msg) { return new Response(`<!doctype html><meta charset=utf8><body style="font-family:sans-serif;background:#0a0a0f;color:#f5f5f7;display:grid;place-items:center;height:100vh;text-align:center"><div><p>${msg}</p></div>`, { headers: { 'content-type': 'text/html' } }); }

// --- Stripe: Checkout (setup una tantum + abbonamento) via API REST, senza SDK ---
async function createCheckout(env, demo) {
  const base = env.PUBLIC_BASE_URL || '';
  const body = new URLSearchParams();
  body.set('mode', 'subscription');
  body.set('success_url', `${base}/onboarding?place_id=${demo.place_id}&slug=${demo.slug}`);
  body.set('cancel_url', `${base}/d/${demo.token}`);
  body.set('client_reference_id', demo.place_id);
  // Canone mensile ricorrente
  body.set('line_items[0][price_data][currency]', 'eur');
  body.set('line_items[0][price_data][recurring][interval]', 'month');
  body.set('line_items[0][price_data][product_data][name]', `Sito + gestione — ${demo.name}`);
  body.set('line_items[0][price_data][unit_amount]', String(Number(env.MONTHLY_PRICE_EUR || 59) * 100));
  body.set('line_items[0][quantity]', '1');
  // Setup una tantum come add_invoice_item
  body.set('subscription_data[metadata][place_id]', demo.place_id);
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  return res.json();
}

async function handleStripeWebhook(req, env) {
  const sig = req.headers.get('stripe-signature') || '';
  const raw = await req.text();
  if (env.STRIPE_WEBHOOK_SECRET) {
    const ok = await verifyStripeSig(raw, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!ok) return json({ error: 'bad signature' }, 400);
  }
  let evt; try { evt = JSON.parse(raw); } catch { return json({ error: 'bad json' }, 400); }
  const type = evt.type;
  const obj = evt.data?.object || {};
  const placeId = obj.client_reference_id || obj.metadata?.place_id || obj.subscription_details?.metadata?.place_id;

  const setSub = (status, extra = {}) => env.DB.prepare(
    `INSERT INTO subscriptions (place_id, owner_id, stripe_customer, stripe_sub, status, current_period_end, updated_at)
     VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(place_id) DO UPDATE SET status=excluded.status, stripe_customer=COALESCE(excluded.stripe_customer,subscriptions.stripe_customer),
       stripe_sub=COALESCE(excluded.stripe_sub,subscriptions.stripe_sub), current_period_end=excluded.current_period_end, updated_at=excluded.updated_at`
  ).bind(placeId, 'danilo', extra.customer || null, extra.sub || null, status, extra.period_end || null, now()).run();

  if (type === 'checkout.session.completed') {
    if (placeId) { await setSub('active', { customer: obj.customer, sub: obj.subscription }); await env.DB.prepare("UPDATE demos SET state='sold' WHERE place_id=?").bind(placeId).run(); }
  } else if (type === 'invoice.paid' || type === 'invoice.payment_succeeded') {
    if (placeId) await setSub('active', { period_end: (obj.lines?.data?.[0]?.period?.end || 0) * 1000 });
  } else if (type === 'invoice.payment_failed') {
    if (placeId) await setSub('past_due');
  } else if (type === 'customer.subscription.deleted') {
    if (placeId) await setSub('canceled');
  }
  return json({ received: true });
}

// Verifica firma Stripe (schema v1) con WebCrypto HMAC-SHA256.
async function verifyStripeSig(payload, header, secret) {
  try {
    const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
    const t = parts.t, v1 = parts.v1;
    if (!t || !v1) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`));
    const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return timingSafeEq(hex, v1);
  } catch { return false; }
}
function timingSafeEq(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
