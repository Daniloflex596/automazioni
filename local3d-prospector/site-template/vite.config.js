import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base relativa: ogni sito è servito da una sottocartella/sottodominio proprio.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2019',
    // Bundle sotto controllo: la performance è un vincolo di design, non un check a valle.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
