import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window'  // <-- thêm dòng này để fix lỗi sockjs-client
  },
  server: {
    proxy: {
      '/chat-service': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        secure: false
      },
      '/api/chatbot': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chatbot/, '/api')
      }
    }
  }
})
