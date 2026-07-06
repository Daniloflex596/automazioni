# Verifica layout — il loop di collaudo con screenshot (non saltabile)

## Perché non è negoziabile
La qualità di un sito immersivo 3D scroll-driven non nasce da un'idea geniale:
nasce da decine di micro-correzioni verificate una a una. Nel mio caso furono
~60, ognuna passata da questo loop, su desktop **E** mobile. Io non consideravo
"fatta" nessuna modifica finché non l'avevo vista con i miei occhi in uno
screenshot del build reale. È un **protocollo ripetibile**, non una teoria: se
salti il collaudo visivo, stai indovinando.

## Strumento
Uso **Playwright (Chromium headless con swiftshader)** + screenshot. Servo la
pagina da un **preview server locale che serve il BUILD DI PRODUZIONE**
(`npm run build`, poi `npm run preview`), **non** il dev server: così vedo
esattamente ciò che verrà pubblicato — stesso minify, stesse chunk, stessi
asset — e non un'approssimazione del dev.

NB operativo: swiftshader (rasterizzazione software della GPU) è **lento** con
una scena 3D piena. I timeout di default non bastano: alzo il default a 90s.

```js
context.setDefaultTimeout(90000); // swiftshader + scena piena = lento
```

## Viewport testati (sempre entrambi, spesso di più)
- **Desktop**: `1440×900`.
- **Mobile**: `390×844` — portrait di classe smartphone, **barra indirizzi
  ritirata** (altezza "grande").
- **Per i bug di viewport**: confronto `390×784` (barra indirizzi **presente**)
  contro `390×844` (barra **ritirata**) per **riprodurre il collasso della barra
  indirizzi** al primo scroll — la causa numero uno dei salti camera su mobile.
- **Per tipografia / dettagli fini**: `deviceScaleFactor: 2`, per vedere i
  dettagli sub-pixel (es. i discendenti di `g/p/q/j` nei titoli, che a scala 1
  sembrano a posto e a scala 2 mostrano il taglio).

## Il loop, passo-passo
1. `npm run build` → controllo l'**assenza di errori** nell'output (grep di
   `error` / conferma del `Complete!`). Se il build non è pulito, mi fermo qui.
2. (Ri)lancio `npm run preview -- --port 4321` **in background**. Lo rilancio
   ogni volta che il container si resetta e uccide il server (capita: se lo
   screenshot va in timeout di connessione, il primo sospetto è il preview
   morto).
3. Eseguo uno **script Playwright** che: apre la pagina, aspetta **~2500ms**
   l'avvio del 3D (`waitForTimeout(2500)`), **scrolla al punto interessato**
   (`scrollIntoView` sull'elemento della sezione, oppure `window.scrollTo`
   all'`offsetTop` della sezione), aspetta l'assestamento, **screenshot**.
4. Per il **3D scuro** inietto un filtro **solo per lo screenshot di controllo**,
   così leggo i dettagli in ombra. **Non è una modifica al sito**: è un aiuto
   visivo temporaneo che vive solo dentro la pagina di test.
   ```js
   await page.addStyleTag({ content: 'canvas{filter:brightness(1.6)}' });
   ```
5. **GUARDO lo screenshot** — desktop **e** mobile — e giudico con criteri
   espliciti: l'**oggetto-chiave** è interamente in quadro? il **testo** è
   leggibile sopra il 3D? le **colonne / i prezzi** sono incolonnati? **niente
   trabocca l'asse orizzontale**? Non leggo una variabile di stato: guardo
   l'immagine.
6. Se non è perfetto: correggo **UN SOLO parametro**, ricostruisco,
   ri-screenshot. Iterazione **stretta** — un parametro alla volta — per
   **isolare la causa**. Cambiare due cose insieme significa non sapere quale
   ha funzionato.
7. **Controllo del controllo**: dopo un batch di modifiche, faccio uno **scroll
   integrale di ogni pagina** raccogliendo gli eventi `pageerror` → la lista
   **deve essere vuota**. È la rete di sicurezza contro le regressioni che il
   singolo screenshot non vede.

## Cosa controllo esplicitamente
- **In quadro** (entrambi i viewport): gli **oggetti-chiave** della sezione sono
  interamente visibili sia su desktop sia su mobile. Molti bug "soggetto fuori
  campo su mobile" nascono proprio qui.
- **Leggibilità del testo su 3D**: c'è uno **scrim / gradiente** sul lato del
  testo? i **sottotitoli** sono "illuminati" abbastanza da staccare dal mondo 3D
  sottostante?
- **FOV adattivo in portrait**: verifico che in verticale il campo visivo si
  **allarghi**, così i soggetti allineati non escono ai bordi.
- **Touch vs mouse**: sui pannelli che scrollano da soli metto `data-lenis-prevent`
  (perché non litighino con lo smooth-scroll globale); sulle **barre orizzontali**
  uso `touch-action` / `overscroll-behavior` perché il drag non trascini la
  pagina. Verifico entrambe le modalità di input.
- **Downgrade high→low→none**: testo con `reducedMotion: 'reduce'` (→ deve
  scattare il **fallback** leggero) e controllo che i contenuti restino
  **visibili**; verifico che conteggi di istanze/luci e `devicePixelRatio`
  vengano **scalati** per tier.
- **Refresh e deep-link**: **reload** a metà pagina → deve tornare **in cima**;
  un **deep-link fresco** tipo `/x#sezione` da navigazione nuova → deve
  **atterrare sulla sezione**.
- **Console pulita**: **0 warning / 0 error**. Non è pignoleria: è proprio da
  questo controllo che è emerso (ed è stato eliminato) un blocco di **193
  warning** ripetuti dalla factory dei materiali.

## Criteri di "è perfetto"
Un cambiamento è **"fatto"** solo se, **su desktop E mobile**, valgono tutte:
- **(a)** gli oggetti target sono **in quadro** e **leggibili**;
- **(b)** lo **scroll è fluido** e la camera **non scatta**;
- **(c)** **console pulita** (0 warning / 0 error);
- **(d)** **nessun overflow orizzontale**;
- **(e)** **fallback** e **reduced-motion** reggono;
- **(f)** **nessuna regressione** nello scroll integrale (`pageerror` vuoto).

Se anche uno solo di questi salta, non è fatto: torno al passo 6.

## Trappola metodologica (da conoscere prima di scriptare)
Lo smooth-scroll (es. **Lenis**) **intercetta `window.scrollTo` programmatico**.
Conseguenza pratica: se dallo script chiami `window.scrollTo` e poi leggi
`window.scrollY` aspettandoti che si sia mosso, puoi trovarti la variabile
**ferma** — perché il tuo `scrollTo` **non ha mosso** lo stato interno dello
smooth-scroll. Per verificare davvero lo scroll via script conviene o
**scrollare "a mano"** con eventi `wheel`, o **affidarsi allo screenshot
visivo** del movimento camera. La verità è nell'immagine, **non** in una
variabile di stato che il tuo `scrollTo` non ha toccato.

## Appendice: scheletro di script Playwright (neutro e riusabile)
Piccolo script generico — nessun riferimento al tema — che collauda i viewport
canonici, scrolla a una lista di selettori di sezione, salva screenshot con nomi
parlanti e raccoglie/stampa gli eventuali `pageerror`.

```js
// verifica-layout.mjs — collaudo screenshot multi-viewport, neutro e riusabile
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE_URL = process.env.URL || 'http://localhost:4321/';
const OUT_DIR  = './screenshot';

// I due viewport canonici; su mobile alzo il deviceScaleFactor per i dettagli fini.
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390,  height: 844, deviceScaleFactor: 2 },
];

// Selettori delle sezioni-chiave da verificare (adattali al tuo markup).
const SEZIONI = ['#sezione-1', '#sezione-2', '#sezione-3'];

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor ?? 1,
    });
    // swiftshader + scena 3D piena => tutto è lento: alzo il timeout di default.
    context.setDefaultTimeout(90000);

    const page = await context.newPage();

    // Raccolgo gli errori runtime della pagina: a fine giro deve essere vuoto.
    const errori = [];
    page.on('pageerror', (e) => errori.push(String(e)));

    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.waitForTimeout(2500); // lascio partire il mondo 3D

    for (const sel of SEZIONI) {
      // Scrollo alla sezione. NB: uno smooth-scroll (es. Lenis) può intercettare
      // window.scrollTo, quindi mi fido dello screenshot, non di window.scrollY.
      await page.evaluate((s) => {
        document.querySelector(s)?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, sel);
      await page.waitForTimeout(1200); // assestamento camera/damping

      // Filtro brightness SOLO per lo screenshot di controllo del 3D scuro:
      // aiuto visivo temporaneo, non una modifica al sito.
      await page.addStyleTag({ content: 'canvas{filter:brightness(1.6)}' });

      const nome = `${OUT_DIR}/${vp.name}_${sel.replace(/[^a-z0-9]/gi, '')}.png`;
      await page.screenshot({ path: nome, fullPage: false });
      console.log('screenshot:', nome);
    }

    if (errori.length) {
      console.error(`[${vp.name}] PAGEERROR:\n` + errori.join('\n'));
    } else {
      console.log(`[${vp.name}] console pulita: nessun pageerror.`);
    }

    await context.close();
  }
} finally {
  await browser.close();
}
```

Uso finale: **guardo** ogni PNG (desktop e mobile), applico i criteri di "è
perfetto", e se qualcosa non torna correggo **un solo parametro** e rifaccio il
giro. Lo screenshot è il giudice; il resto è opinione.
