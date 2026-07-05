# Local3D Prospector

Motore **semi-automatico** che trova locali particolari senza sito web, genera per ognuno una
**demo 3D personalizzata** con i loro dati reali, la verifica da solo e prepara l'outreach.
L'automazione fa il lavoro ripetitivo; **l'umano approva ogni pubblicazione e ogni invio**.

> Il 3D "wow" è il gancio. Il ricorrente (canone) è il business.

## Come funziona (una run)

```
scan → find-contact → generate → verify → outreach(bozze) → report
             ↑ tutto automatico ↑                    ↓
                                          CANCELLO 1: approvi le demo
                                          CANCELLO 2: approvi gli invii
```

1. **scan** — Google Places (a due stadi: discovery economica → details cari solo sulla shortlist), filtri hard, scoring, registry.
2. **find-contact** — cerca un'email **generica** del locale (mai nominativa).
3. **generate** — `business.json` validato → sito statico (copia del bundle + iniezione dati).
4. **verify** — Playwright: diff dati, errori console, budget performance, screenshot desktop/mobile.
5. **outreach** — bozze email (conformi) + messaggi WhatsApp con `wa.me`, messi in coda. **Non inviati.**
6. **report** — `outbox/REPORT.md`: cosa approvare e cosa inviare.

## Avvio rapido (mock, senza chiavi né rete)

```bash
npm install
cd site-template && npm install && npm run build && cd ..
npm run pipeline:mock          # gira tutto in mock
open outbox/REPORT.md          # il cruscotto dei cancelli umani
open sites/arcadia-pub/shots/  # gli screenshot generati
```

I due cancelli umani, dalla CLI:

```bash
npm run registry -- list                 # vedi il funnel
npm run registry -- approve <place_id>    # CANCELLO 1: la demo è ok
npm run send                              # CANCELLO 2: invia tutte le approvate in blocco
npm run registry -- paid <place_id>       # (di solito lo fa Stripe) cliente pagante
npm run provision                         # CONSEGNA: dominio + DNS + SSL + deploy → live
```

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run nightly` | Run notturna completa: prepara le demo (fino ai cancelli) **e** consegna i clienti già paganti |
| `npm run pipeline` | Come nightly ma senza provisioning |
| `npm run scan` | Trova e qualifica i locali (Google Places) |
| `npm run generate` | Genera i siti dei qualificati |
| `npm run verify` | QA meccanica + screenshot (Playwright) |
| `npm run apply-changes` | Applica le richieste "vorrei cambiare qualcosa" (parametri vincolati) |
| `npm run send` | Invia in blocco le email delle demo approvate (WhatsApp in coda) |
| `npm run provision` | Consegna automatica dei clienti paganti → sito live |
| `npm run cockpit` | Rigenera il cruscotto `outbox/cockpit.html` |
| `npm run selfcheck` | 32 test sulle invarianti |

Dettaglio della fase vendita+consegna in **[docs/DELIVERY.md](docs/DELIVERY.md)**.

## Le 4 scene 3D

Una scena parametrica per categoria (stessa architettura, atmosfera diversa):
**pub** (bancone + bottiglie luminose), **streetfood** (griglia + braci), **ethnic** (lanterne + vapore),
**barber** (palo rotante + specchi + forbici). La palette arriva dai design tokens.

## Passare al LIVE

Servono tre chiavi (nessuna committata):

| Cosa | Variabile | Dove |
|------|-----------|------|
| Google Places API | `GOOGLE_PLACES_API_KEY` | Google Cloud Console → Places API (New) |
| Backend (tracking/pagamenti) | vedi `worker/wrangler.toml` | Cloudflare Workers + D1 |
| Pagamenti ricorrenti | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe Billing |

```bash
export GOOGLE_PLACES_API_KEY=...       # senza questa, gira in mock
export WORKER_BASE_URL=https://api.tuodominio.it
npm run pipeline                        # scan reale su Ciampino + Roma SE
```

### Backend (Cloudflare Worker)
```bash
cd worker
wrangler d1 create local3d              # copia l'id in wrangler.toml
wrangler d1 execute local3d --file schema.sql
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put ADMIN_TOKEN
wrangler deploy
```

### Deploy di una demo (Cloudflare Pages)
```bash
npx wrangler pages deploy sites/<slug> --project-name demo-local3d
```

## Configurazione

Tutto il "chi cerchiamo e quanto vale" è in **`config/targeting.json`** (zone, categorie target/escluse,
pesi di scoring, prezzi, limiti per run). Il contratto dati dei siti è **`config/business.schema.json`**.

## Architettura (perché è una fabbrica e non artigianato)

Tre strati separati, così aggiungere un cliente = due file JSON:

- **CONTENT** — `business.json`, schema unico, ogni campo con `source` verificabile.
- **THEME** — design tokens (`lib/theme.mjs`), palette per categoria/mood.
- **SCENE** — scena R3F fissa e parametrica (`site-template/src/scenes/`), riceve props.

```
lib/            motore: places, score, build-business, validate, theme, reviews, registry, outreach
scripts/        scan, find-contact, generate-site, verify, outreach, publish, report, pipeline, registry-cli
site-template/  React+Vite+R3F+Framer Motion — un bundle, N siti (iniezione dati in index.html)
worker/         Cloudflare Worker + D1: tracking, form, Stripe checkout+webhook, stato abbonamento
config/         targeting.json + business.schema.json
data/           registry.json (fonte di verità/CRM) + cache Places
sites/<slug>/   sito generato + screenshot QA
outbox/         bozze email + coda WhatsApp + REPORT.md
```

## Principi non negoziabili

- **Solo dati verificabili** sui siti: niente menu inventato (sezione "I più amati" dalle recensioni; menu vero solo post-vendita).
- **Compliance codificata come test** (`lib/validate.mjs`): in LIVE solo foto del cliente; testimonianze anonimizzate; email a freddo solo generiche. Se una regola salta, la build si blocca.
- **Uomo ai due cancelli**: nessuna demo online e nessun messaggio inviato senza approvazione. Un errore non è un log: è un'attività reale che riceve un sito col suo nome.

## Costi (ordine di grandezza)

Places API: **non €0** (free tier per-SKU; details con recensioni è il tier caro) → con field mask stretto
+ caching, decine di €/mese. Cloudflare Pages/Workers/D1: ~€0 ai volumi iniziali. Email: gratis a volumi bassi.
Il vincolo non sono i costi: sono conversione, tempo di vendita umano e retention.
