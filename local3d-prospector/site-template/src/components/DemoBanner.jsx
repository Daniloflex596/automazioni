// Banner di attivazione (solo build 'demo'): il gancio verso la vendita.
// Traccia il click sul CTA via Worker (se track_url presente), poi apre il pagamento/WhatsApp.
import React, { useState } from 'react';
import { motion } from 'framer-motion';

function track(business, action) {
  const url = business.cta?.track_url;
  if (!url) return;
  try {
    navigator.sendBeacon?.(url, JSON.stringify({ slug: business.meta.slug, place_id: business.meta.place_id, action, t: Date.now() }));
  } catch { /* best effort */ }
}

export default function DemoBanner({ business }) {
  const cta = business.cta || {};
  const [openForm, setOpenForm] = useState(false);
  if (cta.mode !== 'demo') return null;

  return (
    <section className="cta" data-section="cta">
      <motion.div
        className="cta-card"
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="eyebrow">Anteprima riservata</p>
        <h2>{cta.headline || `Anteprima per ${business.identity.name}`}</h2>
        <p className="cta-sub">
          Ti piace? Questo sito è già pronto per il tuo locale.
          Attivalo con dominio tuo, prenotazioni online e gestione inclusa.
        </p>
        <div className="price">
          <div><strong>€{cta.price_setup_eur}</strong><span className="muted"> attivazione</span></div>
          <div className="plus">+</div>
          <div><strong>€{cta.price_monthly_eur}</strong><span className="muted">/mese tutto incluso</span></div>
        </div>
        <p className="guarantee">🛡️ Soddisfatto o rimborsato entro {cta.guarantee_days} giorni</p>
        <div className="cta-actions">
          {cta.checkout_url && cta.checkout_url !== '#' && (
            <a className="btn primary" href={cta.checkout_url} onClick={() => track(business, 'checkout')}>Attiva ora</a>
          )}
          {cta.wa_link && (
            <a className="btn ghost" href={cta.wa_link} target="_blank" rel="noreferrer" onClick={() => track(business, 'whatsapp')}>
              Ne parliamo su WhatsApp
            </a>
          )}
          <button className="btn link" onClick={() => { setOpenForm(!openForm); track(business, 'wants_change'); }}>
            Vorrei cambiare qualcosa
          </button>
        </div>
        {openForm && (
          <form
            className="change-form"
            action={cta.track_url ? cta.track_url.replace('/track', '/modify') : undefined}
            method="POST"
          >
            <input type="hidden" name="slug" value={business.meta.slug} />
            <input type="hidden" name="place_id" value={business.meta.place_id} />
            <textarea name="message" rows="3" placeholder="Es. cambiate i colori, mettete più foto della sala, aggiornate gli orari…" required />
            <button className="btn primary" type="submit">Invia richiesta (1 modifica gratis)</button>
          </form>
        )}
      </motion.div>
      <p className="watermark">ANTEPRIMA · non indicizzata</p>
    </section>
  );
}
