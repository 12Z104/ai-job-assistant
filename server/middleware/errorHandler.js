// 错误兜底：所有未捕获错误统一转成合同失败格式
// 成功响应 { data, meta: { requestId } }；失败响应 { error: { code, message, details }, requestId }
import { AppError, ERROR_CODES } from '../lib/errors.js'

// 404 兜底：未匹配任何路由
export function notFound(req, res, next) {
  next(new AppError(ERROR_CODES.NOT_FOUND, `接口不存在: ${req.method} ${req.originalUrl}`, [], 404))
}

// 四参数错误中间件，必须最后挂载
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let code = ERROR_CODES.INTERNAL
  let message = '服务器内部错误'
  let details = []
  let status = 500

  if (err instanceof AppError) {
    code = err.code
    message = err.message
    details = err.details
    status = err.status
  } else if (err?.type === 'entity.too.large') {
    // express.json limit 超限 → 合同要求映射为 VALIDATION_FAILED
    code = ERROR_CODES.VALIDATION_FAILED
    message = '请求体超过 256KB 上限'
    status = 413
  } else if (err?.type === 'entity.parse.failed') {
    code = ERROR_CODES.VALIDATION_FAILED
    message = '请求体不是合法 JSON'
    status = 400
  } else {
    // 未知错误：记录堆栈，不把内部细节泄露给调用方
    console.error(JSON.stringify({ time: new Date().toISOString(), kind: 'unhandled', requestId: req.ctx?.requestId, message: err?.message, stack: err?.stack }))
  }

  if (req.ctx?.log) req.ctx.log.errorCode = code

  // SSE 已开始后无法再改状态码/写 JSON，只能断流
  if (res.headersSent) {
    res.end()
    return
  }
  res.status(status).json({
    error: { code, message, ...(details.length > 0 ? { details } : {}) },
    requestId: req.ctx?.requestId,
  })
}
