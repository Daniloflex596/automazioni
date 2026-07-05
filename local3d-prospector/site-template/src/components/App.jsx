import React, { useEffect, useState } from 'react';
import Scene3D from './Scene3D.jsx';
import Intro from './Intro.jsx';
import DemoBanner from './DemoBanner.jsx';
import { Hero, Atmosphere, Loved, Reviews, Gallery, Hours, Contact } from './Sections.jsx';
import { perfBudget } from '../lib/device.js';
import { attachScroll } from '../lib/scroll.js';

const SECTION_COMPONENTS = { hero: Hero, atmosphere: Atmosphere, loved: Loved, reviews: Reviews, gallery: Gallery, hours: Hours, contact: Contact };

export default function App({ business }) {
  const [budget, setBudget] = useState({ level: 'medium', mobile: false });

  useEffect(() => {
    setBudget(perfBudget());
    attachScroll();
  }, []);

  const order = business.sections_order || ['hero', 'atmosphere', 'loved', 'reviews', 'hours', 'contact'];

  return (
    <div className={`app fx-${business.theme?.fx_intensity || 'medium'} level-${budget.level}`}>
      <Intro name={business.identity.name} />
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <Scene3D template={business.meta.template} theme={business.theme} level={budget.level} />
      <main className="content">
        {order.map((key) => {
          const C = SECTION_COMPONENTS[key];
          return C ? <C key={key} business={business} /> : null;
        })}
        <DemoBanner business={business} />
        <footer className="footer">
          <span data-field="name">{business.identity.name}</span>
          <span className="muted"> · anteprima realizzata automaticamente</span>
        </footer>
      </main>
    </div>
  );
}
