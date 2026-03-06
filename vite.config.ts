import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react', '@googlemaps/js-api-loader'],
    },
    build: {
      rollupOptions: {
        external: (id) => {
          // Nao incluir Google Maps loader no build se nao houver API key
          if (id.includes('@googlemaps/js-api-loader') && !env.VITE_GOOGLE_MAPS_API_KEY) {
            return true;
          }
          return false;
        }
      }
    }
  };
});