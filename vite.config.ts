import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 前端请求 /api/xxx 时，自动转发到后端 3001 端口
    // 这样前端代码里写 fetch('/api/chat') 就行，不用写完整地址
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
