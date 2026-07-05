#!/usr/bin/env node
// SELFCHECK: test senza dipendenze sulle invarianti che tengono in piedi il sistema.
// Gira in CI/prima di ogni run. Se qualcosa qui fallisce, non si automatizza nulla.
import { validateBusiness } from '../lib/validate.mjs';
import { passesHardFilters, scoreCandidate } from '../lib/score.mjs';
import { mineReviews, deriveClaim } from '../lib/reviews.mjs';
import { waLink, draftEmail } from '../lib/outreach.mjs';
import { isGenericEmail, classifyEmail } from '../lib/contact.mjs';
import { slugify } from '../lib/util.mjs';
import { deriveTheme } from '../lib/theme.mjs';
import { canTransition } from '../lib/registry.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.log(`  ✗ ${name}`); } };
const section = (s) => console.log(`\n${s}`);

function baseBiz(over = {}) {
  return {
    meta: { place_id: 'p1', slug: 'test', owner_id: 'danilo', category: 'pub', template: 'pub', build_mode: 'demo' },
    identity: { name: 'Test Pub', claim: 'Birra, come si deve', tone: 'cozy' },
    contacts: { phone: { value: '06 123', source: 'google_places' }, address: { value: 'Via X', source: 'google_places' }, hours: { value: ['Lun 18-24'], source: 'google_places' } },
    social_proof: { rating: 4.6, count: 200, source: 'google_places', themes: [], testimonials: [] },
    gallery: [], loved: [], theme: deriveTheme('cozy'),
    sections_order: ['hero', 'cta'],
    cta: { mode: 'demo' },
    ...over,
  };
}

section('Schema & compliance');
ok('business valido passa', validateBusiness(baseBiz()).ok);
ok('build_mode/cta.mode incoerenti bocciati', !validateBusiness(baseBiz({ cta: { mode: 'live' } })).ok);
ok('LIVE con foto google bloccato', !validateBusiness(baseBiz({
  meta: { place_id: 'p', slug: 's', owner_id: 'd', category: 'pub', template: 'pub', build_mode: 'live' },
  cta: { mode: 'live' },
  gallery: [{ url: 'x', source: 'google_places', rights: 'manager_uploaded_google' }],
})).ok);
ok('LIVE con foto cliente ok', validateBusiness(baseBiz({
  meta: { place_id: 'p', slug: 's', owner_id: 'd', category: 'pub', template: 'pub', build_mode: 'live' },
  cta: { mode: 'live' },
  gallery: [{ url: 'x', source: 'client_onboarding', rights: 'client_provided' }],
})).ok);
ok('testimonial con nome+cognome pieno bocciato', !validateBusiness(baseBiz({
  social_proof: { rating: 4.6, count: 200, source: 'google_places', themes: [], testimonials: [{ text: 'ottimo', author: 'Mario Rossi', source: 'manual' }] },
})).ok);
ok('testimonial anonimizzato ok', validateBusiness(baseBiz({
  social_proof: { rating: 4.6, count: 200, source: 'google_places', themes: [], testimonials: [{ text: 'ottimo', author: 'Marco R.', source: 'derived_from_reviews' }] },
})).ok);

section('Filtri hard');
ok('con sito scartato', !passesHardFilters({ website: 'http://x', rating: 4.8, reviews_count: 300, types: [], name: 'x' }).pass);
ok('rating basso scartato', !passesHardFilters({ website: '', rating: 3.5, reviews_count: 300, types: [], name: 'x' }).pass);
ok('poche recensioni scartato', !passesHardFilters({ website: '', rating: 4.8, reviews_count: 10, types: [], name: 'x' }).pass);
ok('nome tabacchi scartato', !passesHardFilters({ website: '', rating: 4.8, reviews_count: 300, types: [], name: 'Bar Tabacchi Aldo' }).pass);
ok('buon candidato passa', passesHardFilters({ website: '', rating: 4.6, reviews_count: 300, types: ['bar'], name: 'Cool Pub' }).pass);

section('Scoring');
const hi = scoreCandidate({ rating: 4.8, reviews_count: 800, price_level: 3, reviews: [{ text: { text: 'sempre pieno, prenotate' } }] }, 'pub');
const lo = scoreCandidate({ rating: 4.1, reviews_count: 60, price_level: 1, reviews: [] }, 'kebab');
ok('score alto > score basso', hi > lo);
ok('score in 0..100', hi <= 100 && lo >= 0);

section('Review mining');
const mined = mineReviews(['birra artigianale ottima', 'birra artigianale top', 'hamburger enorme', 'hamburger buono'], 'pub');
ok('trova temi', mined.themes.length >= 1);
ok('dedup: "birra" rimosso se c\'è "birra artigianale"', !mined.loved.some((l) => l.name.toLowerCase() === 'birra'));
ok('claim leggibile', /come si deve|conosce bene/.test(deriveClaim(mined.themes, 'pub')));

section('Contatti & outreach');
ok('info@ è generica', isGenericEmail('info@locale.it'));
ok('nome.cognome@ non generica', !isGenericEmail('mario.rossi@gmail.com'));
ok('classify nominative', classifyEmail('mario.rossi@x.it') === 'nominative');
ok('wa.link aggiunge 39 a nazionale', waLink('06 12345678', 'ciao').includes('wa.me/390612345678'));
ok('wa.link gestisce +39', waLink('+39 333 1112223', 'x').includes('wa.me/393331112223'));
ok('email cita tema reale', draftEmail(baseBiz({ social_proof: { rating: 4.6, count: 200, source: 'google_places', themes: [{ label: 'Porchetta', evidence_count: 5, source: 'derived_from_reviews' }], testimonials: [] } }), 'http://d').body.toLowerCase().includes('porchetta'));
ok('email ha opt-out', draftEmail(baseBiz(), 'http://d').body.includes('STOP'));

section('Slug & transizioni');
ok('slug pulito', slugify('Il Re della Porchetta!') === 'il-re-della-porchetta');
ok('slug accenti', slugify('Caffè Però') === 'caffe-pero');
ok('no ritorno indietro pagato→trovato', !canTransition('pagato', 'trovato'));
ok('ok qualificato→demo-pronta', canTransition('qualificato', 'demo-pronta'));
ok('da terminale non si esce (scartato→live)', !canTransition('scartato', 'live'));
ok('scartato sempre ammesso', canTransition('qualificato', 'scartato'));

console.log(`\n${fail === 0 ? '✓' : '✗'} ${pass} passati, ${fail} falliti`);
process.exit(fail === 0 ? 0 : 1);
