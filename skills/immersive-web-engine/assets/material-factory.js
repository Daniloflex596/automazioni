/**
 * ============================================================================
 *  material-factory.js — factory per MeshStandardMaterial (versione CORRETTA)
 * ============================================================================
 *  Scorciatoie:
 *    r  = roughness · m = metalness · e = emissive · ei = emissiveIntensity
 *
 *  PERCHE' LA DESTRUTTURAZIONE (trappola nota):
 *  la tentazione e' scrivere la factory cosi'
 *      (color, opts) => new THREE.MeshStandardMaterial({
 *        color, roughness: opts.r, metalness: opts.m, ..., ...opts   // ← BUG
 *      })
 *  ma lo spread `...opts` RI-INIETTA le scorciatoie r/m/e/ei, che
 *  MeshStandardMaterial NON conosce → un warning in console per OGNI materiale
 *  creato ("'r' is not a property of THREE.MeshStandardMaterial", idem m/e/ei).
 *  Nel progetto di riferimento faceva 193 warning: innocui ma rumorosi, e
 *  segnalano che stai passando chiavi sbagliate al costruttore.
 *
 *  LA CURA (una sola): DESTRUTTURARE ed ESCLUDERE le scorciatoie, lasciando
 *  passare solo `...rest` — cioe' le chiavi che Three riconosce davvero (side,
 *  transparent, opacity, map, depthWrite, flatShading, ...). Questo file nasce
 *  gia' corretto: usalo com'e'.
 *
 *  Uso:
 *    import { makeMat } from './material-factory.js';
 *    const legno = makeMat(0x3a2416, { r: 0.55, m: 0.08 });
 *    const vetro = makeMat(0xffffff, { r: 0.1, transparent: true, opacity: 0.3 });
 *    const neon  = makeMat(0xffd68a, { e: 0xffd68a, ei: 0.6 });
 * ============================================================================
 */
import * as THREE from 'three';

export function makeMat(color, { r = 0.85, m = 0, e = 0x000000, ei = 1, ...rest } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: r,
    metalness: m,
    emissive: e,
    emissiveIntensity: ei,
    ...rest, // SOLO chiavi che Three riconosce davvero (r/m/e/ei restano fuori)
  });
}
