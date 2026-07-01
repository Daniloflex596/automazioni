import { defineConfig } from 'astro/config';

// Arkadia Pub — configurazione statica ottimizzata per Cloudflare Pages.
// Aggiorna `site` con il dominio definitivo prima del deploy (serve per OG/canonical).
// La sitemap è statica in public/sitemap.xml (il sito è una one-page).
export default defineConfig({
  site: 'https://arkadiapub.it',
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
