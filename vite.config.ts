import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * 第三方依赖分包（只拆 node_modules，业务代码不动）：
 * - react-vendor：react 内核与路由，页面切换时不应重复下载
 * - antd-icons：@ant-design/icons 独立拆出——图标更新频率低，单独缓存，
 *   且把 antd-vendor 压回 500KB 红线以内
 * - antd-vendor：antd 及其依赖的 rc-* 生态（不含 icons）
 * - vendor：其余第三方（lucide-react 等）
 * 业务页面已由 router 的 React.lazy 按路由拆 chunk，这里不再人为切分。
 */
function manualChunks(id: string): string | undefined {
  const path = id.replace(/\\/g, '/')
  if (!path.includes('/node_modules/')) return undefined
  if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(path)) {
    return 'react-vendor'
  }
  // icons 必须写在 antd 规则之前：@ant-design/icons 也命中 @ant-design 前缀
  if (/\/node_modules\/@ant-design\/icons\//.test(path)) {
    return 'antd-icons'
  }
  if (/\/node_modules\/(antd|@ant-design|@rc-component|rc-[^/]+|dayjs)\//.test(path)) {
    return 'antd-vendor'
  }
  return 'vendor'
}

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
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
