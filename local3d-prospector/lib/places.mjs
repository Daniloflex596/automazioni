// Client Google Places (New) a DUE STADI, con cache su disco.
// Stadio 1 (discovery): field mask economico → filtra i non-qualificati SENZA pagare il tier caro.
// Stadio 2 (details): recensioni/foto (tier Enterprise) SOLO sulla shortlist, poi cache con TTL.
// In mock mode legge da mock/ senza toccare la rete.
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { paths, readJSON, writeJSON, isMock, logger } from './util.mjs';

const API = 'https://places.googleapis.com/v1';
const CACHE_DIR = join(paths.data, 'places-cache');
const TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 giorni

const DISCOVERY_MASK = [
  'places.id',
  'places.displayName',
  'places.types',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.websiteUri',
].join(',');

const DETAILS_MASK = [
  'id', 'displayName', 'types', 'rating', 'userRatingCount', 'priceLevel',
  'websiteUri', 'nationalPhoneNumber', 'formattedAddress', 'googleMapsUri',
  'regularOpeningHours', 'reviews', 'photos',
].join(',');

function key() {
  const k = process.env.GOOGLE_PLACES_API_KEY;
  if (!k) throw new Error('GOOGLE_PLACES_API_KEY mancante (usa PROSPECTOR_MODE=mock per girare senza rete)');
  return k;
}

// STADIO 1 — discovery a basso costo per una (zona × query).
export async function discover(zone, query) {
  if (isMock()) return mockDiscover(zone, query);
  const res = await fetch(`${API}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key(),
      'X-Goog-FieldMask': DISCOVERY_MASK,
    },
    body: JSON.stringify({
      textQuery: `${query} ${zone.name}`,
      locationBias: { circle: { center: { latitude: zone.lat, longitude: zone.lng }, radius: zone.radius_m } },
      languageCode: 'it', regionCode: 'IT', maxResultCount: 20,
    }),
  });
  if (!res.ok) { logger.error(`Places discovery ${res.status}`, { zone: zone.name, query }); return []; }
  const data = await res.json();
  return (data.places || []).map(normalizeDiscovery);
}

// STADIO 2 — details costoso, solo su shortlist, con cache.
export async function details(placeId) {
  const cachePath = join(CACHE_DIR, `${placeId}.json`);
  if (existsSync(cachePath)) {
    const cached = readJSON(cachePath);
    if (Date.now() - (cached._fetched_at || 0) < TTL_MS) return cached;
  }
  if (isMock()) {
    const m = mockDetails(placeId);
    if (m) writeJSON(cachePath, m);
    return m;
  }
  const res = await fetch(`${API}/places/${placeId}?languageCode=it&regionCode=IT`, {
    headers: { 'X-Goog-Api-Key': key(), 'X-Goog-FieldMask': DETAILS_MASK },
  });
  if (!res.ok) { logger.error(`Places details ${res.status}`, { placeId }); return null; }
  const data = await res.json();
  data._fetched_at = Date.now();
  writeJSON(cachePath, data);
  return data;
}

function normalizeDiscovery(p) {
  return {
    place_id: p.id,
    name: p.displayName?.text || '',
    types: p.types || [],
    rating: p.rating || 0,
    reviews_count: p.userRatingCount || 0,
    price_level: priceLevelToInt(p.priceLevel),
    website: p.websiteUri || '',
  };
}

function priceLevelToInt(pl) {
  const map = { PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };
  if (typeof pl === 'number') return pl;
  return map[pl] ?? 2;
}

// ---------- MOCK ----------
function mockDiscover(zone, query) {
  const path = join(paths.mock, 'places-raw.json');
  if (!existsSync(path)) return [];
  const all = readJSON(path);
  // In mock ritorniamo i locali il cui campo mock_query combacia con la query o categoria.
  return all
    .filter((p) => !p.mock_zone || p.mock_zone === zone.name)
    .filter((p) => !query || (p.mock_query || '').includes(query) || (p.name || '').toLowerCase().includes(query))
    .map(normalizeDiscovery);
}

function mockDetails(placeId) {
  const path = join(paths.mock, 'places-raw.json');
  if (!existsSync(path)) return null;
  const all = readJSON(path);
  const p = all.find((x) => x.id === placeId);
  if (!p) return null;
  return { ...p, _fetched_at: Date.now() };
}
