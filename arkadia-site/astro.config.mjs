import { defineConfig } from 'astro/config';

// Arkadia Pub — configurazione statica per GitHub Pages (project page).
// URL di pubblicazione: https://daniloflex596.github.io/automazioni/
// Con un dominio personalizzato in futuro: rimetti base: '/' e aggiorna `site`.
// La sitemap è statica in public/sitemap.xml (il sito è una one-page).
export default defineConfig({
  site: 'https://daniloflex596.github.io',
  base: '/automazioni',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      // Isola three.js in un chunk separato: viene caricato solo quando serve
      // (feature-detection lato client), così l'HTML iniziale resta leggero.
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
          },
        },
      },
    },
  },
});
