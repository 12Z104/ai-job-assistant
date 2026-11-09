// 游客限流：内存 Map 按 deviceId（缺省回退 IP）计数，5 次/天
// 判定在发起 LLM 调用之前（路由链顺序：rateLimit → validate → handler），超限 429 RATE_LIMITED
import { fail, ERROR_CODES } from '../lib/errors.js'

const GUEST_LIMIT = 5
const buckets = new Map() // key → { date: 'YYYY-MM-DD', count }
let lastSweep = Date.now()

// 清理过期桶，防止 Map 无界增长（宪法：所有状态要有上界）
function sweep(today) {
  if (Date.now() - lastSweep < 3600_000) return
  lastSweep = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.date !== today) buckets.delete(key)
  }
}

export default function rateLimit(req, res, next) {
  const today = new Date().toISOString().slice(0, 10)
  const key = req.ctx.deviceId || req.ip
  sweep(today)

  let bucket = buckets.get(key)
  if (!bucket || bucket.date !== today) {
    bucket = { date: today, count: 0 }
    buckets.set(key, bucket)
  }
  // 先占额再放行：防止并发请求绕过判定
  bucket.count++
  if (bucket.count > GUEST_LIMIT) {
    return next(fail(ERROR_CODES.RATE_LIMITED, `今日体验次数已用完（${GUEST_LIMIT} 次/天），明天再来`))
  }
  next()
}
