// Express 装配：中间件顺序与路由挂载的唯一入口（不含 listen，入口是 index.js）
import express from 'express'
import requestContext from './middleware/requestContext.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import aiRouter from './routes/ai.js'

export function createApp() {
  const app = express()

  // body ≤ 256KB（合同上界），超限由 errorHandler 映射为 VALIDATION_FAILED
  app.use(express.json({ limit: '256kb' }))
  // requestId / deviceId 注入 + 统一请求日志，必须最先挂
  app.use(requestContext)

  // 探活：成功响应格式 { data, meta: { requestId } }
  app.get('/api/health', (req, res) => {
    res.json({ data: { ok: true, uptime: process.uptime() }, meta: { requestId: req.ctx.requestId } })
  })

  app.use('/api', aiRouter)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
