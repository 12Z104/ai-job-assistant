// rateLimit.test.js · 游客限流单测（5 次/天，deviceId 分桶）
// 注意：buckets 是模块级 Map，本文件所有用例共享；用例间用不同 deviceId 隔离
import { describe, it, expect, vi, afterEach } from 'vitest'
import rateLimit from './rateLimit.js'
import { ERROR_CODES } from '../lib/errors.js'

function run(deviceId, ip = '10.0.0.1') {
  const req = { ctx: { deviceId }, ip }
  let nextArg
  const next = (arg) => { nextArg = arg }
  rateLimit(req, {}, next)
  return nextArg
}

afterEach(() => {
  vi.useRealTimers()
})

describe('rateLimit() 中间件', () => {
  it('同一 deviceId 前 5 次放行，第 6 次 RATE_LIMITED', () => {
    for (let i = 1; i <= 5; i++) {
      expect(run('dev-limit')).toBeUndefined()
    }
    const err = run('dev-limit')
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe(ERROR_CODES.RATE_LIMITED)
    expect(err.status).toBe(429)
  })

  it('不同 deviceId 桶互不影响', () => {
    // 把 dev-iso-a 打满
    for (let i = 0; i < 5; i++) run('dev-iso-a')
    expect(run('dev-iso-a').code).toBe(ERROR_CODES.RATE_LIMITED)
    // dev-iso-b 仍然是全新桶
    expect(run('dev-iso-b')).toBeUndefined()
  })

  it('deviceId 缺失时回退按 req.ip 分桶', () => {
    for (let i = 0; i < 5; i++) run(null, '10.0.0.99')
    expect(run(null, '10.0.0.99').code).toBe(ERROR_CODES.RATE_LIMITED)
    // 另一个 IP 不受影响
    expect(run(null, '10.0.0.98')).toBeUndefined()
  })

  it('跨天自动清零（sweep 清过期桶）', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-11-09T10:00:00Z')
    vi.setSystemTime(start)
    for (let i = 0; i < 5; i++) run('dev-cross-day')
    expect(run('dev-cross-day').code).toBe(ERROR_CODES.RATE_LIMITED)
    // 前进 25 小时：跨天 + 距上次 sweep 超过 1h，触发清理
    vi.setSystemTime(new Date(start.getTime() + 25 * 3600_000))
    expect(run('dev-cross-day')).toBeUndefined()
  })
})
