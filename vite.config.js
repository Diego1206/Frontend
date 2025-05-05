import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173, 
    proxy: {
      // Cualquier petición que empiece con /api será redirigida
      '/api': {
        target: 'http://localhost:3001', // Tu servidor backend
        changeOrigin: true, // Necesario para hosts virtuales
        secure: false,      // No validar certificados SSL (importante para localhost)
        
      }
    }
  }
})