// Adapter dei fornitori esterni: UN solo posto dove vivono le API di registrar, DNS/SSL e deploy.
// In mock (o senza chiavi) restituiscono valori finti così la pipeline gira end-to-end.
// Passare al reale = riempire queste 3 funzioni con l'API del fornitore scelto. Nient'altro cambia.
import { isMock } from './util.mjs';

// ---- 1. REGISTRAR (dominio .it intestato al CLIENTE) ----
// Consigliato: Gandi (API pulita, fa .it) oppure OVH/Aruba. Il .it richiede i dati anagrafici reali
// del registrante (li raccoglie l'onboarding). Env: REGISTRAR_API_KEY, REGISTRAR_PROVIDER.
export async function checkDomainAvailability(domain) {
  if (isMock() || !process.env.REGISTRAR_API_KEY) {
    // in mock consideriamo libero il primo .it "pieno" (senza trattini) e i .com
    return !domain.includes('-') || domain.endsWith('.com');
  }
  // TODO reale (Gandi): GET https://api.gandi.net/v5/domain/check?name=<domain>
  const res = await fetch(`https://api.gandi.net/v5/domain/check?name=${encodeURIComponent(domain)}`, {
    headers: { authorization: `Bearer ${process.env.REGISTRAR_API_KEY}` },
  });
  const data = await res.json();
  return data?.products?.[0]?.status === 'available';
}

export async function registerDomain(domain, { registrant }) {
  if (isMock() || !process.env.REGISTRAR_API_KEY) {
    return { id: `mock-order-${domain}`, domain, registrant: registrant?.name, mode: 'mock' };
  }
  // TODO reale (Gandi): POST https://api.gandi.net/v5/domain/domains con owner=registrant (dati cliente)
  const res = await fetch('https://api.gandi.net/v5/domain/domains', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.REGISTRAR_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ fqdn: domain, owner: mapRegistrant(registrant) }),
  });
  const data = await res.json();
  return { id: data?.id || `order-${domain}`, domain, mode: 'live' };
}

// ---- 2. CLOUDFLARE: custom hostname + SSL (SSL for SaaS) ----
// Modello multi-tenant: UN progetto/Worker serve tutti i siti, ogni dominio cliente è un "custom hostname"
// con certificato SSL emesso in automatico. Env: CF_API_TOKEN, CF_ZONE_ID.
export async function attachCustomHostname(domain, slug) {
  if (isMock() || !process.env.CF_API_TOKEN) {
    return { id: `mock-host-${slug}`, domain, ssl: 'pending', mode: 'mock' };
  }
  // TODO reale: POST https://api.cloudflare.com/client/v4/zones/{zone}/custom_hostnames
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/custom_hostnames`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.CF_API_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ hostname: domain, ssl: { method: 'http', type: 'dv' } }),
  });
  const data = await res.json();
  return { id: data?.result?.id, domain, ssl: data?.result?.ssl?.status, mode: 'live' };
}

// ---- 3. DEPLOY del sito statico (Cloudflare Pages) ----
export async function deploySite(dir, slug, domain) {
  if (isMock() || !process.env.CF_API_TOKEN) {
    return { id: `mock-deploy-${slug}`, url: `https://${domain}`, mode: 'mock' };
  }
  // TODO reale: wrangler pages deploy <dir> --project-name <proj>  (o Cloudflare API direct upload)
  return { id: `deploy-${slug}`, url: `https://${domain}`, mode: 'live' };
}

function mapRegistrant(r) {
  return { given: (r.name || '').split(' ')[0] || r.name, family: (r.name || '').split(' ').slice(1).join(' ') || '.', email: r.email, phone: r.phone, country: r.country || 'IT', streetaddr: r.address || '', type: 0 };
}
