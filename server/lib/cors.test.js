// cors.test.js · CORS 白名单单测（部署坑 §7.1 的固化）
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import cors from './cors.js'
import { ERROR_CODES } from '../lib/errors.js'

function run(origin, method = 'GET') {
  const req = { headers: origin ? { origin } : {}, method }
  const headers = new Map()
  const res = {
    setHeader: (k, v) => headers.set(k, v),
    status(code) { this.statusCode = code; return { end: () => {} } },
    end: () => {},
  }
  let nextCalled = false
  let nextArg
  const next = (arg) => { nextCalled = true; nextArg = arg }
  cors(req, res, next)
  return { nextCalled, nextArg, headers, res }
}

describe('cors 中间件', () => {
  beforeEach(() => { delete process.env.FRONTEND_ORIGIN })
  afterEach(() => { delete process.env.FRONTEND_ORIGIN })

  it('未配置 FRONTEND_ORIGIN = 本地开发，全放行', () => {
    expect(run('http://evil.com').nextCalled).toBe(true)
    expect(run(undefined).nextCalled).toBe(true)
  })

  it('白名单内的 Origin 下发Allow-Origin 且放行', () => {
    process.env.FRONTEND_ORIGIN = 'https://app.vercel.app, https://preview-x.vercel.app'
    const { nextCalled, headers } = run('https://preview-x.vercel.app')
    expect(nextCalled).toBe(true)
    expect(headers.get('Access-Control-Allow-Origin')).toBe('https://preview-x.vercel.app')
    expect(headers.get('Vary')).toBe('Origin')
  })

  it('白名单外的 Origin 放行但不下发 CORS 头（浏览器拦截）', () => {
    process.env.FRONTEND_ORIGIN = 'https://app.vercel.app'
    const { nextCalled, headers } = run('http://evil.com')
    expect(nextCalled).toBe(true)
    expect(headers.has('Access-Control-Allow-Origin')).toBe(false)
  })

  it('白名单外的预检请求直接 403 FORBIDDEN', () => {
    process.env.FRONTEND_ORIGIN = 'https://app.vercel.app'
    const { nextArg } = run('http://evil.com', 'OPTIONS')
    expect(nextArg).toBeInstanceOf(Error)
    expect(nextArg.code).toBe(ERROR_CODES.FORBIDDEN)
    expect(nextArg.status).toBe(403)
  })

  it('白名单内的预检请求 204 收尾', () => {
    process.env.FRONTEND_ORIGIN = 'https://app.vercel.app'
    const { nextArg, res } = run('https://app.vercel.app', 'OPTIONS')
    expect(nextArg).toBeUndefined() // cors 自己收尾，不调 next
    expect(res.statusCode).toBe(204)
  })

  it('无 Origin 的请求（curl / 同源）不受白名单限制', () => {
    process.env.FRONTEND_ORIGIN = 'https://app.vercel.app'
    expect(run(undefined).nextCalled).toBe(true)
  })
})
