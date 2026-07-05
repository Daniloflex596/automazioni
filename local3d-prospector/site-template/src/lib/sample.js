// Dato di sviluppo: usato solo quando window.__BUSINESS__ è null (vite dev / build standalone).
// In produzione il generatore inietta il business.json reale.
export default {
  meta: { place_id: 'sample', slug: 'sample-pub', owner_id: 'danilo', category: 'pub', template: 'pub', build_mode: 'demo' },
  identity: { name: 'Arcadia Pub', claim: 'Dove la birra artigianale è una cosa seria', tone: 'cozy' },
  contacts: {
    phone: { value: '+39 06 1234567', source: 'google_places' },
    address: { value: 'Via Roma 42, Ciampino (RM)', maps_url: 'https://maps.google.com', source: 'google_places' },
    hours: { value: ['Lun–Gio 18:00–01:00', 'Ven–Sab 18:00–02:00', 'Dom 18:00–00:00'], source: 'google_places' },
  },
  social_proof: {
    rating: 4.7, count: 384, source: 'google_places',
    themes: [
      { label: 'Birra artigianale', evidence_count: 41, source: 'derived_from_reviews' },
      { label: 'Hamburger', evidence_count: 33, source: 'derived_from_reviews' },
      { label: 'Alette di pollo', evidence_count: 18, source: 'derived_from_reviews' },
    ],
    testimonials: [
      { text: 'Selezione di birre pazzesca e panini enormi, sempre pieno il sabato. Consiglio di prenotare.', author: 'Cliente G.', source: 'derived_from_reviews' },
      { text: 'Atmosfera top, staff gentilissimo, tornerò di sicuro.', author: 'Cliente M.', source: 'derived_from_reviews' },
    ],
  },
  gallery: [],
  loved: [
    { name: 'Birra artigianale', source: 'derived_from_reviews' },
    { name: 'Hamburger', source: 'derived_from_reviews' },
    { name: 'Alette di pollo', source: 'derived_from_reviews' },
  ],
  theme: {
    palette: { bg: '#140f0a', surface: '#221913', primary: '#e08a3c', accent: '#f2c879', text: '#f7efe4', muted: '#b09a82' },
    font_display: "'Fraunces', serif", font_body: "'Inter', sans-serif", fx_intensity: 'high',
  },
  sections_order: ['hero', 'atmosphere', 'loved', 'reviews', 'hours', 'contact', 'cta'],
  cta: {
    mode: 'demo', headline: 'Anteprima per Arcadia Pub',
    price_setup_eur: 890, price_monthly_eur: 59, guarantee_days: 7,
    wa_link: 'https://wa.me/390612345670', checkout_url: '#', track_url: '',
  },
};
