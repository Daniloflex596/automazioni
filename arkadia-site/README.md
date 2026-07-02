# Arkadia Pub — Sito Scrollytelling 3D

Sito cinematografico per **Arkadia Pub** (Ciampino, RM). Lo scroll è il motore
narrativo: **si entra nel pub in 3D** dalla porta e la camera percorre il locale
fermandosi alle "stazioni" — ogni sezione ha la sua micro-scena:

- 🍺 **La Spina** → una pinta si riempie sotto il rubinetto (getto + schiuma).
- 🍔 **La Tavola** → il burger a strati **si scompone a mezz'aria** e si ricompone.
- 🎯 **La Sala Giochi** → freccette sul muro anche in 3D; card con icone animate
  (giochi da tavolo, freccette, Nintendo Switch, carte da gioco).
- 🥂 **Il Brindisi** → due boccali al séparé si inclinano e si toccano sul CTA.
- ✨ Polvere dorata nell'aria, insegna neon, progress-scroll a forma di pinta.

La sottopagina **/menu** contiene tutte le 7 categorie reali (spina, bottiglia,
fritti, hamburger, dessert, da bere, caffetteria, cocktail) con illustrazioni
SVG per categoria e il calice che viene "versato" all'arrivo.

Costruito con **Astro** (statico, super veloce) + **Three.js** (scena del pub e
calice, geometria procedurale — nessun modello scaricato) + **Lenis** (smooth
scroll). Nessun costo fisso: pubblicato su **GitHub Pages** via Actions.

- **Lighthouse mobile:** Performance 99 · Accessibilità 100 · Best Practices 100 · SEO 100 (entrambe le pagine)
- **Degrado a 3 tier:** 3D pieno su desktop, 3D alleggerito su mobile, fallback
  SVG senza WebGL / `prefers-reduced-motion` / risparmio dati

---

## ✍️ Come aggiornare i contenuti (menu, orari, contatti)

**Tutto ciò che cambia nel tempo sta in un solo file:**

```
src/data/contenuti.ts
```

Apri quel file e modifica il testo tra virgolette. Esempi:

- **Orari** → sezione `orari` (e `orariSchema` per Google, formato `Tu-Su 19:00-24:00`).
- **Birre alla spina** → `birre.spina` (prezzi per formato 25cl→Tower 3L); **in bottiglia** → `birreBottiglia`.
- **Menu completo** → `fritti`, `hamburger`, `dessert`, `daBere`, `caffetteria`, `cocktail`.
- **Sala giochi** → `giochi.lista` · **Piatti in home** → `cibo.piatti`.
- **Telefono / WhatsApp / indirizzo / social** → oggetto `info`.
- **Testi SEO** (titolo Google, descrizione) → oggetto `meta`.

I campi con il commento `// ⚠️ DA CONFERMARE` vanno verificati prima della
pubblicazione: **indirizzo definitivo, P.IVA, numero WhatsApp, tap-list reale,
prezzi, coordinate GPS**.

Dopo la modifica, se il sito è collegato a Cloudflare Pages via Git, basta fare
commit: il sito si ricostruisce da solo. In locale: `npm run build`.

> Regole d'oro: non togliere virgole, parentesi graffe `{ }` o quadre `[ ]`.
> Cambia solo il testo tra virgolette.

---

## 🎨 Identità visiva (in breve)

Palette derivata dalla birra e dalla sera (in `src/styles/tokens.css`):

| Colore | Hex | Significato |
|---|---|---|
| notte | `#0E0A07` | il pub di sera (sfondo) |
| ambra | `#C77B29` | la birra ambrata (il liquido 3D) |
| oro | `#E8B04B` | l'ora d'oro / accenti |
| schiuma | `#F4E9D0` | testo e respiro |
| rame | `#7A2E1E` | la spina in rame |
| luppolo | `#3B5E4A` | freschezza / gluten-free / km0 |

Tipografia: **Fraunces** (titoli), **Inter** (testo), **Space Mono** (ABV/IBU/prezzi).

---

## 🖥️ Sviluppo in locale

Serve **Node.js 18+**.

```bash
npm install        # installa le dipendenze (una volta sola)
npm run dev        # anteprima live su http://localhost:4321
npm run build      # genera il sito statico in dist/
npm run preview    # anteprima della build di produzione
```

### Struttura del progetto

```
src/
  data/contenuti.ts     ← ⭐ i contenuti da aggiornare
  styles/tokens.css     ← palette, tipografia, scala
  layouts/Base.astro    ← <head>, SEO, Open Graph, Schema.org Restaurant
  pages/index.astro     ← assembla le sezioni + canvas 3D + fallback
  components/            ← le 6 sezioni (Hero, Storia, Birre, Cibo, Luogo, Prenotazione) + Footer/Preloader
  three/calice3d.js      ← la scena 3D del calice (liquido, schiuma, bollicine)
  scroll/experience.js   ← orchestratore: tier, smooth scroll, riempimento, reveal
public/                 ← favicon, robots.txt, sitemap.xml, og-arkadia.jpg
```

---

## 📱 Come si comporta su dispositivi diversi (degrado con grazia)

La scena 3D si adatta automaticamente alla potenza del dispositivo (in
`experience.js`, funzione `detectTier`):

- **Desktop / GPU capace** → calice 3D completo (vetro, liquido, schiuma, bollicine).
- **Mobile medio** → versione 3D alleggerita (meno effetti, pixel ratio limitato,
  render in pausa quando fuori schermo).
- **GPU deboli / niente WebGL / `Risparmio dati` / `Riduci movimento`** → **niente
  Three.js**: il riempimento è reso da un **calice in SVG** che si riempie con lo
  scroll (o pieno e statico se l'utente ha attivato "riduci movimento").

Il sito è **completo e leggibile in ogni caso**, con o senza 3D.

---

## 🚀 Pubblicazione su Cloudflare Pages (gratis)

1. Carica questo repository su GitHub/GitLab.
2. Su **Cloudflare → Pages → Create a project → Connect to Git**, seleziona il repo.
3. Impostazioni di build:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `arkadia-site` (questa cartella)
4. Deploy. Ad ogni `git push` il sito si aggiorna da solo.
5. Collega il **dominio** (es. `arkadiapub.it`) da *Custom domains*.

> Dopo aver scelto il dominio definitivo, aggiorna il campo `site` in
> `astro.config.mjs` e gli URL in `public/robots.txt` e `public/sitemap.xml`
> (servono per canonical, Open Graph e sitemap corretti).

---

## 🌍 Predisposizione multilingua (IT → EN)

I testi sono centralizzati in `contenuti.ts`. Per aggiungere l'inglese in futuro:
duplicare i contenuti in un `contenuti.en.ts`, creare `src/pages/en/index.astro` e
uno switch di lingua. La struttura è già pronta per questo passaggio.

---

## 🔧 Manutenzione tecnica

- **Icona pin/mappa:** la mappa in `Luogo.astro` è un SVG stilizzato (niente embed
  Google pesante); il pulsante *"apri in Maps"* usa `luogo.mapsUrl` da `contenuti.ts`.
- **Immagine social (Open Graph):** `public/og-arkadia.jpg`. Sostituiscila con una
  foto reale del locale (1200×630) mantenendo lo stesso nome, oppure aggiorna
  `meta.ogImage` in `contenuti.ts`.
- **Prenotazioni:** il form compone un messaggio **WhatsApp** già pronto verso il
  numero in `info.whatsapp`. Nessun backend, nessun costo. In futuro si può
  collegare un gestionale sostituendo la logica in `components/Prenotazione.astro`.
