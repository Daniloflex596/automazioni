-- Schema D1 (SQLite) del backend. Multi-tenant fin da subito: owner_id ovunque.
-- Serve i pezzi che un sito statico non può fare: tracking, form, pagamenti, abbonamenti, enforcement.

CREATE TABLE IF NOT EXISTS demos (
  token       TEXT PRIMARY KEY,          -- token non indovinabile nell'URL demo
  place_id    TEXT NOT NULL,
  owner_id    TEXT NOT NULL DEFAULT 'danilo',
  slug        TEXT NOT NULL,
  name        TEXT,
  state       TEXT NOT NULL DEFAULT 'published', -- published | expired | sold
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER                    -- demo non convertite scadono (data minimization + urgenza)
);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  token       TEXT,
  place_id    TEXT,
  action      TEXT NOT NULL,             -- open | checkout | whatsapp | wants_change
  ua          TEXT,
  at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kind        TEXT NOT NULL,             -- modify | onboarding
  place_id    TEXT,
  slug        TEXT,
  payload     TEXT,                      -- JSON grezzo del form
  status      TEXT NOT NULL DEFAULT 'new',
  at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  place_id        TEXT PRIMARY KEY,
  owner_id        TEXT NOT NULL DEFAULT 'danilo',
  stripe_customer TEXT,
  stripe_sub      TEXT,
  status          TEXT NOT NULL,         -- active | past_due | canceled  → accende/spegne il sito
  current_period_end INTEGER,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_place ON events(place_id);
CREATE INDEX IF NOT EXISTS idx_events_action ON events(action);
