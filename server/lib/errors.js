// 错误码常量：与 docs/ARCHITECTURE.md 5.3 冻结合同一一对应（9 个）
export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  INTERNAL: 'INTERNAL',
}

// 应用错误：业务层统一抛这个，由 errorHandler 转成合同格式的 JSON 响应
export class AppError extends Error {
  /**
   * @param {string} code  必须是 ERROR_CODES 之一
   * @param {string} message  面向用户的人话描述
   * @param {Array} details  可选，指明具体哪个字段/什么原因
   * @param {number} status  HTTP 状态码
   */
  constructor(code, message, details = [], status = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.status = status
  }
}

// 各错误码的默认状态码映射，方便快速抛错
export const STATUS_BY_CODE = {
  [ERROR_CODES.VALIDATION_FAILED]: 400,
  [ERROR_CODES.UNAUTHENTICATED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.RATE_LIMITED]: 429,
  [ERROR_CODES.UPSTREAM_TIMEOUT]: 504,
  [ERROR_CODES.UPSTREAM_ERROR]: 502,
  [ERROR_CODES.INTERNAL]: 500,
}

// 快捷工厂：throw fail(ERROR_CODES.VALIDATION_FAILED, '...', details)
export function fail(code, message, details = []) {
  return new AppError(code, message, details, STATUS_BY_CODE[code] ?? 500)
}
