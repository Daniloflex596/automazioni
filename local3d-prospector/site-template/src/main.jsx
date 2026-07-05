import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import { getBusiness, applyTheme } from './lib/data.js';
import './styles.css';

const business = getBusiness();
applyTheme(business.theme);
document.title = business.cta?.mode === 'demo'
  ? `${business.identity.name} — Anteprima`
  : business.identity.name;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App business={business} />
  </React.StrictMode>
);
