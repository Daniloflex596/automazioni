# La fase di vendita e consegna — come è organizzata

Questo documento spiega come i passaggi che facevi **a mano** per vendere e consegnare un sito
diventano automatici (o spariscono), e come il tutto è organizzato per lavorare in blocco:
tu approvi, la macchina fa il resto.

## Il principio: la maggior parte dei passaggi manuali SPARISCE

Li facevi perché ogni sito era un **progetto separato**. Nel modello nuovo — un solo motore, i dati
iniettati — quel disordine non serve più.

| Passaggio manuale (prima) | Ora |
|---|---|
| Creare un **repo GitHub privato** per ogni cliente | **Eliminato.** Ogni cliente è una cartella `sites/<slug>/` + una riga nel registry. Zero repo per cliente. |
| Impostare i **secrets su GitHub** per ogni progetto | **Eliminato.** I segreti stanno UNA volta nel backend (Cloudflare Secrets) + un `.env` operatore. Non per-cliente. |
| **Salvare le password** di ogni sito da qualche parte | **Eliminato.** Il cliente non riceve credenziali (modello "tutto gestito"). Non ci sono password per-cliente da custodire. |
| **Comprare il dominio** dal registrar a mano | **Automatico.** `provision` genera il dominio dal nome del locale, verifica la disponibilità e lo registra via API. |
| Intestare/configurare il dominio | **Automatico + corretto.** Registrato **a nome del cliente** (dati dall'onboarding), niente "sito ostaggio". |
| Configurare **DNS** a mano | **Automatico.** Cloudflare custom hostname via API. |
| Attivare **SSL/HTTPS** | **Automatico e gratis.** Cloudflare emette il certificato da solo (SSL for SaaS). |
| **Deploy** del sito | **Automatico.** Deploy del build statico via API/wrangler. |
| **Consegnare** il sito al cliente | **Semi-automatico.** Messaggio di consegna pronto in coda; lo mandi tu (tocco umano finale). |

Risultato: da ~8 passaggi manuali per sito a **1 azione tua** (approvare) + **1 messaggio di consegna**.

## Le due fasi in blocco

### FASE A — Outreach (pre-vendita)
La macchina prepara le demo di notte. La mattina:

```
1. Apri il cockpit → guardi gli screenshot delle demo
2. Approvi quelle buone:   npm run registry -- approve <id>   (o le scarti)
3. Invii tutto in blocco:  npm run send
```

`npm run send` invia **tutte** le email delle demo approvate (una per azienda, personalizzata con una
recensione vera), mette i WhatsApp in coda (`outbox/whatsapp-da-inviare.json`, invio manuale),
rispetta la **suppress-list** (chi ha detto STOP), applica un rate-limit, e segna ognuno `contattato`.
Tutto loggato per-azienda in `outbox/SENT.log`. È esattamente il "approvo e lui manda tutte le email a
tutte le aziende, ben divise".

### FASE B — Consegna (post-vendita) — `npm run provision`, in DUE tempi
Il sito completo col dominio esiste **solo dopo il pagamento**. La consegna è in due fasi, per dare al
cliente un link che funziona subito senza rischiare i soldi del dominio durante la garanzia.

**B1 — appena paga (istantaneo, gratis, rischio zero):**
```
Stripe conferma il pagamento → il backend segna 'pagato' → provision:
  build LIVE 'provisional' (senza banner di vendita) → deploy su SOTTODOMINIO
  → sito online in minuti su  nomelocale.siti-tuo.it
```
Il cliente ha già il suo link funzionante. Non servono ancora le foto.

**B2 — dopo la garanzia (es. 7 giorni) E ricevute le foto, se non ha chiesto rimborso:**
```
provision (nella nightly):
  1. sceglie il dominio dal nome   (Arcadia Pub → arcadia.it)
  2. lo registra INTESTATO AL CLIENTE, auto-renew ON  ("per sempre")
  3. DNS + SSL su Cloudflare
  4. rebuild con le FOTO del cliente + deploy sul dominio vero
  5. stato → attivo · messaggio di consegna in coda
```

**Perché due fasi:** il dominio .it costa ~€12 non rimborsabili. Comprarlo prima della fine della
garanzia = perderli a ogni rimborso. Il sottodominio dà gratificazione immediata a rischio zero; il
dominio vero si registra solo quando il cliente è "definitivo". Risponde alla domanda "conviene fare
un blocco pagamento e poi il resto?": sì — **il link vero e il dominio arrivano solo dopo il pagamento**,
e il dominio (costo reale) solo dopo la finestra di rimborso.

Ogni passo è in `registry → <cliente> → fulfillment`. Idempotente: se rilanci, riprende da dove era.

### "Per sempre" — `npm run enforce`
Il sito resta online finché il **canone** è attivo. Questo passo (nella nightly) allinea sito e abbonamento:
```
canone ATTIVO   → online + dominio in auto-renew (si rinnova ogni anno da solo)
canone FALLITO  → dopo il dunning di Stripe: sito SOSPESO, auto-renew OFF
RIPAGATO        → riattivato
```
Lo stato dell'abbonamento arriva dal **webhook Stripe** (il backend lo tiene aggiornato). Così il
"real all'infinito" è vero finché paga, e si spegne da solo se smette — senza che tu faccia niente.

## Dove vivono le chiavi (un solo posto)

Tutte le integrazioni esterne stanno in **`lib/providers.mjs`** (registrar, Cloudflare, deploy) e in
**`lib/places.mjs`** / **`lib/outreach.mjs`** / **`worker/`**. Passare dal mock al reale = riempire
quelle funzioni con le chiavi. Nient'altro nel sistema cambia.

| Cosa serve | Chiave | Consigliato |
|---|---|---|
| Ricerca locali | `GOOGLE_PLACES_API_KEY` | Google Cloud |
| Email | `RESEND_API_KEY` + `RESEND_FROM` | Resend |
| Pagamenti | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Stripe Billing |
| Dominio .it | `REGISTRAR_API_KEY` | **Gandi** (API pulita, fa .it) o OVH/Aruba |
| DNS/SSL/deploy | `CF_API_TOKEN` + `CF_ZONE_ID` | Cloudflare (SSL for SaaS) |

Vedi `.env.example`. Senza chiavi tutto gira in **mock**: nessun invio, nessun addebito, nessuna
registrazione — ma la pipeline gira intera e la vedi funzionare.

## Perché il modello scala

- **Un solo dominio-motore, N domini cliente** puntati con Cloudflare custom hostnames: un deploy, tanti
  siti. Non un progetto per cliente.
- **Nessuna password per cliente**: il cliente non tocca niente, tu gestisci tutto da un backend.
- **Dominio del cliente**: asset suo, niente contestazioni, ma DNS/hosting gestiti da te (canone).

## Come provarlo adesso (mock)

```bash
npm run registry -- approve <id>     # cancello 1
npm run send                          # invia le approvate (mock: logga, non invia)
npm run registry -- paid <id>         # simula il pagamento
npm run provision                     # consegna automatica → sito 'live' con dominio finto
```
