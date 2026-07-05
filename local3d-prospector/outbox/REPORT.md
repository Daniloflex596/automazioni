# Report Prospector — 05/07/2026

## Funnel

| Stato | # |
|---|---|
| trovato | 1 |
| demo-pronta | 2 |

## 🟢 CANCELLO 1 — Demo da APPROVARE (guarda gli screenshot, poi approva/scarta)

### Arcadia Pub  ·  score 56  ·  4.7★ (384)
- Zona: Ciampino · Template: pub
- Demo: https://api.local3d.example/d/nzbx9mw2wtnm8nj4k2gn2q
- Screenshot: `sites/arcadia-pub/shots/desktop-hero.png`, `mobile-hero.png`, `desktop-cta.png`
- Approva:  `npm run registry -- approve mock_arcadia_pub`
- Scarta:   `npm run registry -- reject mock_arcadia_pub`

### Il Re della Porchetta  ·  score 46  ·  4.6★ (512)
- Zona: Frascati · Template: streetfood
- Demo: https://api.local3d.example/d/p17ctbfgwyd4l647lvt3cd
- Screenshot: `sites/il-re-della-porchetta/shots/desktop-hero.png`, `mobile-hero.png`, `desktop-cta.png`
- Approva:  `npm run registry -- approve mock_porchetta_re`
- Scarta:   `npm run registry -- reject mock_porchetta_re`

## 📨 CANCELLO 2 — Contatti pronti da INVIARE

- **Arcadia Pub** — email: info@arcadiapub.example · bozza in `outbox/arcadia-pub.md`
  - Segna inviato: `npm run registry -- sent mock_arcadia_pub`
- **Il Re della Porchetta** — email: prenotazioni@reporchetta.example · bozza in `outbox/il-re-della-porchetta.md`
  - Segna inviato: `npm run registry -- sent mock_porchetta_re`

## Note
- La macchina PREPARA. Nessuna demo va online e nessun messaggio parte senza la tua approvazione.
- Email solo verso indirizzi generici; WhatsApp sempre a invio manuale.
