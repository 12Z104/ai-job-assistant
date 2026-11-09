// errors.test.js · 错误码映射单测
import { describe, it, expect } from 'vitest'
import { AppError, fail, ERROR_CODES, STATUS_BY_CODE } from './errors.js'

describe('AppError / fail()', () => {
  it('fail() 按 STATUS_BY_CODE 映射 HTTP 状态码', () => {
    for (const [code, status] of Object.entries(STATUS_BY_CODE)) {
      const err = fail(code, 'msg')
      expect(err).toBeInstanceOf(AppError)
      expect(err.code).toBe(code)
      expect(err.status).toBe(status)
      expect(err.name).toBe('AppError')
    }
  })

  it('fail() 携带 details 数组', () => {
    const err = fail(ERROR_CODES.VALIDATION_FAILED, '不合法', [{ field: 'resumeText', issue: '缺少必填字段' }])
    expect(err.details).toHaveLength(1)
    expect(err.details[0].field).toBe('resumeText')
  })

  it('未知错误码兜底 500', () => {
    const err = fail('NOT_A_CODE', 'msg')
    expect(err.status).toBe(500)
  })
})
