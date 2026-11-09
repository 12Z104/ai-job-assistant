// CORS 白名单：docs/ARCHITECTURE.md §7 部署坑 1
// FRONTEND_ORIGIN 未配置 → 本地开发，不拦截（vite proxy 同源，无跨域）
// 配置后 → 逗号分隔白名单精确匹配 Origin；Vercel preview 子域用逗号追加
// 非白名单 Origin 的非预检请求照常处理但不下发 CORS 头（浏览器会拦响应），预检直接 403
import { fail, ERROR_CODES } from '../lib/errors.js'

function parseOrigins(raw) {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

export default function cors(req, res, next) {
  const allowed = parseOrigins(process.env.FRONTEND_ORIGIN)
  // 未配置白名单：本地开发模式，全部放行
  if (allowed.size === 0) return next()

  const origin = req.headers.origin
  if (!origin) return next() // 同源请求 / curl 无 Origin，不存在跨域问题

  if (!allowed.has(origin)) {
    // 预检请求直接拒绝；真实请求不下发头，由浏览器执行同源策略
    if (req.method === 'OPTIONS') {
      return next(fail(ERROR_CODES.FORBIDDEN, '来源不在 CORS 白名单内'))
    }
    return next()
  }

  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-device-id, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
}
