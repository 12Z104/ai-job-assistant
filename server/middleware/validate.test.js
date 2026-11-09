// validate.test.js · 请求体校验单测（对应 curl 手测的 4 类 VALIDATION_FAILED）
import { describe, it, expect } from 'vitest'
import { validate, LIMITS } from './validate.js'
import { ERROR_CODES } from '../lib/errors.js'

function run(rules, body) {
  const req = { body }
  let nextArg
  const next = (arg) => { nextArg = arg }
  validate(rules)(req, {}, next)
  return nextArg
}

const resumeRule = { required: true, type: 'string', maxLength: LIMITS.RESUME_MAX }
const jdRule = { required: true, type: 'string', maxLength: LIMITS.JD_MAX }
const messagesRule = { required: true, type: 'array', maxItems: LIMITS.MESSAGES_MAX }

describe('validate() 中间件', () => {
  it('合法请求直接放行（next 无参调用）', () => {
    const arg = run({ resumeText: resumeRule, jdText: jdRule }, { resumeText: '简历', jdText: 'JD' })
    expect(arg).toBeUndefined()
  })

  it('缺必填字段 → VALIDATION_FAILED + 逐字段 details', () => {
    const arg = run({ resumeText: resumeRule, jdText: jdRule }, {})
    expect(arg.code).toBe(ERROR_CODES.VALIDATION_FAILED)
    expect(arg.details).toEqual([
      { field: 'resumeText', issue: '缺少必填字段' },
      { field: 'jdText', issue: '缺少必填字段' },
    ])
  })

  it('null 与空字符串同样视为缺失', () => {
    const arg = run({ resumeText: resumeRule }, { resumeText: null })
    expect(arg.details[0].issue).toBe('缺少必填字段')
    expect(run({ resumeText: resumeRule }, { resumeText: '' }).details[0].issue).toBe('缺少必填字段')
  })

  it('超长 → details 给出实际长度与上限', () => {
    const arg = run({ resumeText: resumeRule }, { resumeText: 'a'.repeat(LIMITS.RESUME_MAX + 1) })
    expect(arg.details[0]).toEqual({ field: 'resumeText', issue: `长度 ${LIMITS.RESUME_MAX + 1} 超过上限 ${LIMITS.RESUME_MAX}` })
  })

  it('类型不对 → 必须是字符串', () => {
    const arg = run({ resumeText: resumeRule }, { resumeText: 123 })
    expect(arg.details[0].issue).toBe('必须是字符串')
  })

  it('messages 元素必须是 { role: user|assistant, content 非空字符串 }', () => {
    const bad = [{ role: 'user', content: '' }]
    const arg = run({ messages: messagesRule }, { messages: bad })
    expect(arg.details[0].field).toBe('messages[0]')
  })

  it('messages 超条数上限', () => {
    const msgs = Array(LIMITS.MESSAGES_MAX + 1).fill({ role: 'user', content: 'hi' })
    const arg = run({ messages: messagesRule }, { messages: msgs })
    expect(arg.details[0].issue).toContain(`超过上限 ${LIMITS.MESSAGES_MAX}`)
  })

  it('合法 messages 放行', () => {
    const arg = run({ messages: messagesRule }, { messages: [{ role: 'assistant', content: '你好' }] })
    expect(arg).toBeUndefined()
  })
})
