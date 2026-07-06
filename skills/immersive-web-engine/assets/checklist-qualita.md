# Checklist qualità — consegna "è perfetto?"

Nessuna esperienza è pronta finché **tutte** queste caselle passano, **su desktop
E su mobile**. È lo standard non negoziabile del motore: la qualità non arriva da
una grande idea, ma da decine di micro-verifiche spuntate una a una. Passa questa
lista prima di ogni consegna/deploy.

---

## 1. Console e stabilità runtime
- [ ] **0 error** in console (nessuna eccezione a runtime, nessun 404 di risorsa).
- [ ] **0 warning** in console. In particolare: nessun `THREE.Material: 'x' is not a
      property…` dalla factory materiali (destruttura ed **escludi** le scorciatoie
      r/m/e/ei, non fare `...opts` a valle).
- [ ] **Scroll integrale** di ogni pagina raccogliendo `pageerror` → nessuno
      ("controllo del controllo" dopo ogni batch di modifiche).

## 2. Performance
- [ ] **60fps stabili** durante lo scroll anche su **low-end** (verifica su tier `low`:
      dpr cappato ~1.35, meno istanze/luci, antialias off, particellari spenti).
- [ ] **Smorzamento frame-rate-independent** attivo (`1 - pow(k, dt·60)`), mai lerp a
      fattore fisso per frame: stessa "morbidezza" a 20 e a 120fps.
- [ ] **Pre-warm GPU** eseguito sotto il preloader → nessun micro-stutter al primo
      scroll (shader compilati e texture caricate prima di scoprire la scena).
- [ ] `document.hidden` guard nel render loop (tab in background = niente render) e
      `dt` clampato (nessun salto al ritorno in primo piano).
- [ ] Oggetti ripetuti in **InstancedMesh** (un draw call per centinaia di istanze).

## 3. Capability detection e fallback
- [ ] **Capability detection attiva** PRIMA di scaricare il motore: su
      reduced-motion / save-data / no-WebGL / RAM≤2GB il chunk 3D **non** viene
      nemmeno importato.
- [ ] **Import dinamico** del motore (`import()`): three si scarica solo sui tier
      capaci, mai sui `none`.
- [ ] **Fallback a cascata** motore → leggero → statico: un errore del motore degrada
      in silenzio senza rompere l'esperienza.
- [ ] **Guardia anti doppio-boot** (`window.__ENGINE_BOOTED__`): il fallback non
      ricrea un secondo scroll/reveal se il principale li possiede già.

## 4. Accessibilità
- [ ] **Funziona in reduced-motion**: con `prefers-reduced-motion: reduce` parte il
      fallback statico e **tutti i contenuti restano visibili e leggibili**.
- [ ] **Skip link** ("salta al contenuto") come primo elemento focusabile.
- [ ] **Focus** visibile e ordine di tabulazione sensato; nessuna trappola di focus.
- [ ] **ARIA sui modali/overlay** (carrello, dialog): `role="dialog"`, `aria-modal`,
      `aria-label`, chiusura con `Esc`, focus rimandato al trigger alla chiusura.
- [ ] Immagini/canvas decorativi con `aria-hidden`/`alt` corretti; contrasto testo su
      3D sufficiente (scrim/gradiente dal lato del testo).

## 5. Progressive enhancement (senza JS)
- [ ] **Funziona senza JS** (`<noscript>`): i contenuti rivelati allo scroll restano
      visibili (regola CSS che forza `opacity:1` quando JS è assente).
- [ ] Navigazione e contenuti principali fruibili anche a JS spento.

## 6. Viewport e mobile
- [ ] **Viewport stabile mobile**: il collasso della barra indirizzi (Chrome/Safari)
      NON fa saltare la scena (probe a `100vh`; hero a `100lvh`; resize solo su cambi
      veri di larghezza o Δaltezza grande).
- [ ] Nessun **overflow orizzontale** (`overflow-x: clip`; nessuna barra che spunta
      trascinando il dito; `overscroll-behavior` sull'asse).
- [ ] **FOV adattivo**: in portrait il campo si allarga (gli oggetti-chiave restano
      tutti in quadro, non "2 su 3").
- [ ] Oggetti-chiave di ogni sezione **interamente in quadro** a 1440×900 **e** a 390×844.

## 7. Navigazione e stato
- [ ] **Refresh torna in cima**: `history.scrollRestoration = 'manual'` (anche inline
      nell'`<head>`); su reload sempre in cima, anche con `#sezione` nell'URL.
- [ ] **Deep-link** `#sezione` da navigazione fresca → atterra sulla sezione giusta.

## 8. SEO e social
- [ ] **Lighthouse buono** su tutte e quattro le categorie (Performance, Accessibility,
      Best Practices, SEO); nessun regresso rispetto al target concordato.
- [ ] **SEO** di base: `<title>`/`meta description` per pagina, `lang`, `canonical`,
      heading gerarchici, `sitemap.xml` + `robots.txt`.
- [ ] **JSON-LD** valido e coerente col cliente (schema.org appropriato alla nicchia).
- [ ] **Open Graph / Twitter Card** (`og:title`, `og:description`, `og:image`, ecc.):
      l'anteprima di condivisione è corretta.

## 9. Determinismo
- [ ] **Nessun `Math.random`** in tutto il codice della scena/layout: ogni "caso"
      passa dall'hash deterministico `pseudo(i)=fract(sin(i·12.9898)·43758.5453)`.
      Il layout "casuale" deve rigenerarsi identico ad ogni build e ad ogni resume.
- [ ] Nessun'altra sorgente di non-determinismo nel rendering (seed fissi, niente
      `Date.now()` nel layout).

---

## Metodo di verifica (come si spuntano davvero le caselle)
1. `npm run build` → nessun errore.
2. `npm run preview` in background: serve il **build di produzione**, non il dev.
3. Playwright (Chromium headless): apri, attendi l'avvio del 3D (~2.5s), scrolla al
   punto, attendi, **screenshot**. Per il 3D scuro inietta `canvas{filter:brightness(1.6)}`
   via `addStyleTag` **solo** per lo screenshot di controllo (non è una modifica al sito).
4. **Guarda** lo screenshot (desktop **e** mobile) e giudica contro le caselle.
5. Se non è perfetto: correggi **un solo parametro**, ricostruisci, ri-screenshot. Un
   parametro alla volta, per isolare la causa.
6. Dopo un batch: scroll integrale di tutte le pagine → `pageerror` deve essere vuoto.

## Viewport da testare
- Desktop: **1440×900**.
- Mobile: **390×844** (barra ritirata) **e** **390×784** (barra presente), per
  riprodurre il collasso della barra indirizzi.
- Tipografia fine (discendenti g/p/q/j, kerning): `deviceScaleFactor: 2`.
