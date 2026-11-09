// 请求体上界校验：合同（5.3）—— 简历 ≤ 20k 字符、JD ≤ 8k、messages ≤ 40 条、body ≤ 256KB
// body 256KB 由 app.js 的 express.json({ limit: '256kb' }) 兜住，超限进 errorHandler 映射为 VALIDATION_FAILED
import { fail, ERROR_CODES } from '../lib/errors.js'

export const LIMITS = {
  RESUME_MAX: 20000,
  JD_MAX: 8000,
  MESSAGES_MAX: 40,
}

// 校验规则：字段名 → { required, type, maxLength, maxItems, emptyOk }
// required 默认拒绝空字符串；emptyOk: true 表示字段必须存在但允许 ''（如面试无简历输入源）
// 失败抛 VALIDATION_FAILED，details 指明哪个字段为什么超限
export function validate(rules) {
  return (req, res, next) => {
    const body = req.body ?? {}
    const details = []

    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field]
      const missing = value === undefined || value === null || value === ''

      if (missing) {
        if (rule.required && !(rule.emptyOk && value === '')) {
          details.push({ field, issue: '缺少必填字段' })
        }
        continue
      }
      if (rule.type === 'string') {
        if (typeof value !== 'string') {
          details.push({ field, issue: '必须是字符串' })
        } else if (rule.maxLength && value.length > rule.maxLength) {
          details.push({ field, issue: `长度 ${value.length} 超过上限 ${rule.maxLength}` })
        }
      }
      if (rule.type === 'array') {
        if (!Array.isArray(value)) {
          details.push({ field, issue: '必须是数组' })
        } else if (rule.maxItems && value.length > rule.maxItems) {
          details.push({ field, issue: `条数 ${value.length} 超过上限 ${rule.maxItems}` })
        } else {
          // 每条消息必须是 { role, content }，role 只允许 user/assistant
          for (let i = 0; i < value.length; i++) {
            const msg = value[i]
            const ok =
              msg &&
              typeof msg === 'object' &&
              (msg.role === 'user' || msg.role === 'assistant') &&
              typeof msg.content === 'string' &&
              msg.content.length > 0
            if (!ok) {
              details.push({ field: `${field}[${i}]`, issue: '必须是 { role: "user"|"assistant", content: 非空字符串 }' })
              break
            }
          }
        }
      }
    }

    if (details.length > 0) {
      return next(fail(ERROR_CODES.VALIDATION_FAILED, '请求参数不合法', details))
    }
    next()
  }
}
