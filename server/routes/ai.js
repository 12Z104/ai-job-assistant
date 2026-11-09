// AI 路由：只做 HTTP 编排（挂中间件、建 AbortController、写 SSE），不写 prompt、不碰供应商协议
// 路由链顺序：rateLimit（LLM 调用之前判定）→ validate（SSE 开始前可返回 JSON 错误）→ handler
import { Router } from 'express'
import rateLimit from '../middleware/rateLimit.js'
import { validate, LIMITS } from '../middleware/validate.js'
import { initSse, writeEvent as sseWrite } from '../llm/sse.js'
import { ERROR_CODES } from '../lib/errors.js'
import { logEvent } from '../lib/logger.js'
import { runAnalyze } from '../services/analyze.js'
import { runRewrite } from '../services/rewrite.js'
import { runAgent } from '../services/agent.js'
import { runInterviewTurn, runInterviewSummary } from '../services/interview.js'

const router = Router()

// SSE 端点统一 handler 工厂：装配取消、事件包装与兜底
function sseHandler(runService) {
  return async (req, res) => {
    // 取消合同：客户端断开 → abort 上游 fetch（AbortController 透传到 llm 层）
    // 注意挂在 res 上：Node 16+ 中 req 的 'close' 在请求体接收完就触发，会误杀流；
    // res 'close' 且未正常写完（writableEnded=false）才是客户端真实断开
    const controller = new AbortController()
    res.on('close', () => {
      if (!res.writableEnded) controller.abort()
    })

    // 包装写事件：拦截 meta/error 进请求日志（promptVersion / errorCode）
    const writeEvent = (event) => {
      if (event.type === 'meta') req.ctx.log.promptVersion = event.promptVersion
      if (event.type === 'error') req.ctx.log.errorCode = event.code
      sseWrite(res, event)
    }

    initSse(res)
    try {
      await runService({ body: req.body, requestId: req.ctx.requestId, signal: controller.signal, writeEvent })
    } catch (err) {
      if (err.name === 'AbortError') {
        // 客户端取消：静默收尾，日志由 requestContext 带 aborted 标记
      } else {
        // service 编排之外的意外错误兜底
        req.ctx.log.errorCode = ERROR_CODES.INTERNAL
        logEvent({ requestId: req.ctx.requestId, event: 'unhandled_service_error', level: 'error', message: err.message })
        if (!res.writableEnded) {
          writeEvent({ type: 'error', code: ERROR_CODES.INTERNAL, message: '服务器内部错误' })
        }
      }
    }
    res.end()
  }
}

const resumeRule = { required: true, type: 'string', maxLength: LIMITS.RESUME_MAX }
const jdRule = { required: true, type: 'string', maxLength: LIMITS.JD_MAX }
const jdOptionalRule = { required: false, type: 'string', maxLength: LIMITS.JD_MAX }
const messagesRule = { required: true, type: 'array', maxItems: LIMITS.MESSAGES_MAX }
// 面试页无简历/JD 输入源：字段必须存在但允许空串，service 层对空值注入兜底文案
const resumeEmptyOkRule = { required: true, type: 'string', maxLength: LIMITS.RESUME_MAX, emptyOk: true }
const jdEmptyOkRule = { required: true, type: 'string', maxLength: LIMITS.JD_MAX, emptyOk: true }

// POST /api/ai/analyze { resumeText, jdText } — 匹配分析，done 事件可能带 result
router.post('/ai/analyze', rateLimit, validate({ resumeText: resumeRule, jdText: jdRule }), sseHandler(({ body, ...meta }) => runAnalyze({ resumeText: body.resumeText, jdText: body.jdText, ...meta })))

// POST /api/ai/rewrite { resumeText, jdText? } — 简历改写
router.post('/ai/rewrite', rateLimit, validate({ resumeText: resumeRule, jdText: jdOptionalRule }), sseHandler(({ body, ...meta }) => runRewrite({ resumeText: body.resumeText, jdText: body.jdText, ...meta })))

// POST /api/ai/agent { resumeText, jdText } — 4 步优化 Agent
router.post('/ai/agent', rateLimit, validate({ resumeText: resumeRule, jdText: jdRule }), sseHandler(({ body, ...meta }) => runAgent({ resumeText: body.resumeText, jdText: body.jdText, ...meta })))

// POST /api/ai/interview/turn { resumeText, jdText, messages[] } — 面试单轮追问（resume/jd 允许空串）
router.post('/ai/interview/turn', rateLimit, validate({ resumeText: resumeEmptyOkRule, jdText: jdEmptyOkRule, messages: messagesRule }), sseHandler(({ body, ...meta }) => runInterviewTurn({ resumeText: body.resumeText, jdText: body.jdText, messages: body.messages, ...meta })))

// POST /api/ai/interview/summary { messages[] } — 面试综合点评
router.post('/ai/interview/summary', rateLimit, validate({ messages: messagesRule }), sseHandler(({ body, ...meta }) => runInterviewSummary({ messages: body.messages, ...meta })))

export default router
