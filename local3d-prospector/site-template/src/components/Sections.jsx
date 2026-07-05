// Sezioni contenuto: HTML reale (non dentro il canvas). Così i dati sono verificabili,
// indicizzabili e leggibili anche senza WebGL. Il 3D è atmosfera, non contenuto.
import React from 'react';
import { motion } from 'framer-motion';

const fade = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

export function Hero({ business }) {
  const { identity, social_proof } = business;
  return (
    <section className="hero" data-section="hero">
      <motion.div className="hero-inner" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
        <p className="eyebrow" data-field="category">{business.meta.category}</p>
        <h1 className="hero-title" data-field="name">{identity.name}</h1>
        <p className="hero-claim" data-field="claim">{identity.claim}</p>
        {social_proof?.count > 0 && (
          <div className="rating-badge" data-field="rating">
            <span className="stars">★</span>
            <strong>{social_proof.rating.toFixed(1)}</strong>
            <span className="muted">su {social_proof.count} recensioni Google</span>
          </div>
        )}
        <div className="scroll-hint">scorri per entrare ↓</div>
      </motion.div>
    </section>
  );
}

export function Atmosphere({ business }) {
  return (
    <section className="panel" data-section="atmosphere">
      <motion.div className="panel-card" {...fade}>
        <h2>L'atmosfera</h2>
        <p>
          {business.identity.name} non è un posto qualunque: è uno di quei locali che la gente
          del quartiere conosce e consiglia. Questa è un'anteprima di come potrebbe raccontarsi online.
        </p>
      </motion.div>
    </section>
  );
}

export function Loved({ business }) {
  const items = business.loved || [];
  if (!items.length) return null;
  return (
    <section className="panel" data-section="loved">
      <motion.div className="panel-card" {...fade}>
        <h2>I più amati</h2>
        <p className="muted small">Dai temi ricorrenti nelle recensioni dei clienti</p>
        <ul className="chips">
          {items.map((it, i) => <li key={i} className="chip" data-field="loved">{it.name}</li>)}
        </ul>
      </motion.div>
    </section>
  );
}

export function Reviews({ business }) {
  const t = business.social_proof?.testimonials || [];
  if (!t.length) return null;
  return (
    <section className="panel" data-section="reviews">
      <motion.div className="panel-card" {...fade}>
        <h2>Cosa dicono</h2>
        <div className="reviews">
          {t.map((r, i) => (
            <blockquote key={i} className="review">
              <p>“{r.text}”</p>
              <cite>— {r.author}</cite>
            </blockquote>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export function Hours({ business }) {
  const hours = business.contacts?.hours?.value || [];
  if (!hours.length) return null;
  return (
    <section className="panel" data-section="hours">
      <motion.div className="panel-card" {...fade}>
        <h2>Orari</h2>
        <ul className="hours" data-field="hours">
          {hours.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </motion.div>
    </section>
  );
}

export function Gallery({ business }) {
  const imgs = business.gallery || [];
  if (!imgs.length) return null;
  return (
    <section className="panel" data-section="gallery">
      <motion.div className="panel-card wide" {...fade}>
        <h2>Il locale</h2>
        <div className="gallery-grid">
          {imgs.map((g, i) => <img key={i} src={g.url} alt={g.alt || business.identity.name} loading="lazy" />)}
        </div>
      </motion.div>
    </section>
  );
}

export function Contact({ business }) {
  const { phone, address } = business.contacts;
  return (
    <section className="panel" data-section="contact">
      <motion.div className="panel-card" {...fade}>
        <h2>Dove siamo</h2>
        {address?.value && (
          <p data-field="address">
            {address.maps_url
              ? <a href={address.maps_url} target="_blank" rel="noreferrer">{address.value}</a>
              : address.value}
          </p>
        )}
        {phone?.value && (
          <p><a className="phone" href={`tel:${phone.value.replace(/\s/g, '')}`} data-field="phone">{phone.value}</a></p>
        )}
      </motion.div>
    </section>
  );
}
