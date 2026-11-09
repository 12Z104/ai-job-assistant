// 请求上下文中间件：注入 req.ctx = { requestId, deviceId }
// 后续所有层（限流/校验/服务）只读 req.ctx，不直接读请求头
import crypto from 'node:crypto'
import { logRequest } from '../lib/logger.js'

export default function requestContext(req, res, next) {
  req.ctx = {
    requestId: crypto.randomUUID(),
    // 前端生成的设备号，仅用于限流分桶；缺省回退由限流中间件处理
    deviceId: typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : null,
    // 请求级日志附加信息，由后续层（路由/错误处理）填入
    log: {},
  }
  // 可观测：响应头回传 requestId，便于用户报障时定位
  res.setHeader('X-Request-Id', req.ctx.requestId)

  // 统一请求日志：finish（正常完成）或 close（客户端中断）时输出一行
  const start = Date.now()
  let logged = false
  const emitLog = () => {
    if (logged) return
    logged = true
    const aborted = !res.writableEnded
    logRequest({
      requestId: req.ctx.requestId,
      route: req.originalUrl,
      method: req.method,
      status: res.statusCode,
      ms: Date.now() - start,
      errorCode: req.ctx.log.errorCode,
      promptVersion: req.ctx.log.promptVersion,
      aborted,
    })
  }
  res.on('finish', emitLog)
  res.on('close', emitLog) // 客户端 abort 时 finish 不触发，靠 close 记录并带 aborted 标记

  next()
}
