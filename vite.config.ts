import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', '@googlemaps/js-api-loader'],
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Não incluir Google Maps loader no build se não houver API key
        if (id.includes('@googlemaps/js-api-loader') && !process.env.VITE_GOOGLE_MAPS_API_KEY) {
          return true;
        }
        return false;
      }
    }
  },
  define: {
    // Substituir variáveis de ambiente por valores seguros no build
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(
      process.env.VITE_GOOGLE_MAPS_API_KEY || ''
    )
  }
});
