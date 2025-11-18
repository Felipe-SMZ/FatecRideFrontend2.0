// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Encaminha chamadas ao serviço de mensagens para evitar CORS durante o desenvolvimento
      '/api/messages': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/messages/, '/api/messages')
      },
      // Proxy para WebSocket: o cliente conecta em ws://localhost:3000/socket e o Vite proxya para o servidor WS em 9000
      '/socket': {
        target: 'ws://localhost:9000',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
})