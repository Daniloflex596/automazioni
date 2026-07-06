/**
 * ============================================================================
 *  capability.js — Capability detection PRIMA di scaricare il motore 3D
 * ============================================================================
 *  Modulo NEUTRO e portabile: nessun tema, nessun asset, nessuna dipendenza.
 *  Non importa three e non lascia nulla nel DOM (usa un canvas usa-e-getta).
 *
 *  PERCHÉ decidere il tier PRIMA di importare il motore
 *  ---------------------------------------------------------------------------
 *  Il chunk del motore WebGL (three + la scena) pesa centinaia di KB. Scaricarlo,
 *  parsarlo e compilarne le shader costa rete, CPU e soprattutto BATTERIA. Su un
 *  device che non potrà mai reggere l'esperienza — o su un utente che ha chiesto
 *  "meno movimento" / "risparmio dati" — quel costo è puro spreco: meglio
 *  saperlo prima e servire subito il fallback leggero. Questa funzione è quindi
 *  il "cancello" che boot.js interroga per capire se caricare o no il motore.
 *  È volutamente SINCRONA, velocissima e senza effetti collaterali persistenti.
 *
 *  Tre livelli:
 *    'none' → NON caricare il motore: fallback leggero (2D / SVG / statico).
 *    'low'  → motore in modalità ridotta (meno istanze/luci, dpr basso, no AA).
 *    'high' → motore pieno (antialias, dpr fino a 2, particellari, ecc.).
 *
 *  Le soglie sono un punto di partenza SENSATO, non un dogma: taratele sul
 *  carico reale della vostra scena.
 * ============================================================================
 */

/**
 * detectTier(): 'none' | 'low' | 'high'
 *
 * Ordine dei controlli: dal veto più forte al più debole. Appena una condizione
 * "none" è vera si esce, senza nemmeno tentare di creare il contesto WebGL —
 * così il caso "questo utente non deve/non può avere il 3D" costa quasi zero.
 */
export function detectTier() {
  // 1) ACCESSIBILITÀ — prefers-reduced-motion.
  //    Chi ha attivato "riduci animazioni" a livello di sistema NON vuole una
  //    camera che vola: è una scelta (vertigini, chinetosi, attenzione).
  //    Onorala sempre → fallback statico, niente motore.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'none';

  // 2) RETE / BATTERIA — Save-Data.
  //    Se il browser espone navigator.connection.saveData, l'utente ha chiesto
  //    di risparmiare dati (connessione a consumo, roaming): non scaricare
  //    centinaia di KB che non ha richiesto.
  const conn = navigator.connection;
  if (conn && conn.saveData) return 'none';

  // 3) CAPACITÀ REALE — esiste un contesto WebGL?
  //    Senza WebGL (né webgl2 né webgl) il motore non parte proprio. Il canvas
  //    è usa-e-getta: serve solo a interrogare la GPU, non entra mai nel DOM.
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2') || probe.getContext('webgl');
  if (!gl) return 'none';

  // 4) MEMORIA — device con RAM molto bassa.
  //    navigator.deviceMemory è un valore approssimato in GB (può mancare:
  //    default prudente 4). A <=2GB una scena piena rischia jank e crash del
  //    tab → meglio il fallback. Filtro "best effort", non tutti i browser
  //    lo espongono.
  const mem = navigator.deviceMemory || 4;
  if (mem <= 2) return 'none';

  // 5) FASCIA DEL DEVICE — mobile vs desktop.
  //    Superati tutti i veti, distinguiamo la POTENZA presunta. Il mobile (per
  //    larghezza o per user-agent) riceve 'low': stesso motore, ma meno istanze,
  //    meno luci e devicePixelRatio più basso, così tiene i 60fps. Tutto il
  //    resto è 'high'. Euristiche volutamente semplici: sbagliare verso 'low' è
  //    innocuo (resta fluido), sbagliare verso 'high' su un telefono no.
  const mobile =
    matchMedia('(max-width: 820px)').matches || /Mobi|Android/i.test(navigator.userAgent);
  return mobile ? 'low' : 'high';
}

/**
 * pixelRatioFor(tier): devicePixelRatio già cappato per il tier.
 *  'high' → fino a 2 (retina nitido, ma non oltre: raddoppierebbe i pixel da
 *  disegnare senza guadagno percepito). 'low' → 1.35 (nitidezza accettabile,
 *  molti meno pixel da riempire sulle GPU mobili, limitate dal fill-rate).
 */
export function pixelRatioFor(tier) {
  const cap = tier === 'high' ? 2 : 1.35;
  return Math.min(window.devicePixelRatio || 1, cap);
}

/**
 * tierSettings(tier): pacchetto di parametri di rendering da passare a
 * renderer/scena, così il costo scala con la capacità reale del device.
 * `instanceScale`/`lightBudget` sono suggerimenti da applicare NELLA vostra
 * scena (numero di istanze, di luci, di particelle).
 */
export function tierSettings(tier) {
  const high = tier === 'high';
  return {
    high,
    antialias: high,
    pixelRatioCap: high ? 2 : 1.35,
    instanceScale: high ? 1 : 0.5, // dimezza gli oggetti ripetuti su 'low'
    lightBudget: high ? 'full' : 'reduced',
    particles: high, // particellari (polvere/atmosfera) solo su 'high'
  };
}
