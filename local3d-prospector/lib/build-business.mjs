// Trasforma i dettagli Places (o mock) nel content model validato (business.json).
// Ogni campo porta la sua 'source'. Niente dato senza provenienza.
import { config } from './config.mjs';
import { slugify } from './util.mjs';
import { templateFor } from './score.mjs';
import { deriveTheme, defaultToneFor } from './theme.mjs';
import { mineReviews, deriveClaim } from './reviews.mjs';

function toneForTemplate(template) {
  return { pub: 'cozy', streetfood: 'street', ethnic: 'neon', barber: 'elegant' }[template] || 'cozy';
}

function formatHours(regularOpeningHours) {
  if (!regularOpeningHours) return [];
  if (regularOpeningHours.weekdayDescriptions) return regularOpeningHours.weekdayDescriptions;
  return [];
}

// details = risposta Places (o mock). ctx = { matchedQuery, owner_id, build_mode }
export function buildBusiness(details, ctx) {
  const cfg = config();
  const matchedQuery = ctx.matchedQuery || '';
  const template = ctx.template || templateFor(matchedQuery);
  const buildMode = ctx.build_mode || 'demo';
  const name = details.displayName?.text || details.name || 'Locale';
  const slug = slugify(name);
  const category = matchedQuery || (details.types && details.types[0]) || 'locale';

  const reviewTexts = (details.reviews || []).map((r) => r.text?.text || r.originalText?.text || r.text || '');
  const mined = mineReviews(reviewTexts, template);
  const tone = toneForTemplate(template);

  // Galleria: in demo nessuna foto (la scena 3D è autosufficiente). In live SOLO foto del cliente,
  // fornite nell'onboarding (rights=client_provided) — la compliance è imposta dal validatore.
  const onboarding = ctx.onboarding || {};
  const gallery = buildMode === 'live'
    ? (onboarding.photos || []).map((url, i) => ({ url, alt: `${name} ${i + 1}`, source: 'client_onboarding', rights: 'client_provided' }))
    : [];

  const biz = {
    meta: {
      place_id: details.id || details.place_id || 'unknown',
      slug,
      owner_id: ctx.owner_id || 'danilo',
      category,
      template,
      build_mode: buildMode,
      ...(ctx.provisional ? { provisional: true } : {}),
      score: ctx.score ?? 0,
      generated_at: new Date().toISOString(),
    },
    identity: {
      name,
      claim: deriveClaim(mined.themes, category),
      tone,
    },
    contacts: {
      phone: { value: details.nationalPhoneNumber || details.internationalPhoneNumber || '', source: 'google_places' },
      address: {
        value: details.formattedAddress || '',
        maps_url: details.googleMapsUri || '',
        source: 'google_places',
      },
      hours: { value: formatHours(details.regularOpeningHours), source: 'google_places' },
    },
    social_proof: {
      rating: details.rating || 0,
      count: details.userRatingCount || 0,
      source: 'google_places',
      themes: mined.themes,
      testimonials: mined.testimonials,
    },
    gallery,
    loved: mined.loved,
    theme: deriveTheme(tone),
    sections_order: gallery.length
      ? ['hero', 'atmosphere', 'loved', 'reviews', 'gallery', 'hours', 'contact', 'cta']
      : ['hero', 'atmosphere', 'loved', 'reviews', 'hours', 'contact', 'cta'],
    cta: {
      mode: buildMode,
      headline: buildMode === 'demo' ? `Anteprima per ${name}` : name,
      price_setup_eur: cfg.commercial.setup_price_eur,
      price_monthly_eur: cfg.commercial.monthly_price_eur,
      guarantee_days: cfg.commercial.guarantee_days,
      wa_link: '',
      checkout_url: '',
      track_url: '',
    },
  };

  return biz;
}
