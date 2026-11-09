// 共享编排管道：meta → 流转发 → done / error
// service 层禁止碰 req/res（Owner Map）：通过 writeEvent 回调写事件、signal 感知客户端取消
import { streamChat, MODEL_NAME } from '../llm/deepseek.js'
import { ERROR_CODES } from '../lib/errors.js'
import { logEvent } from '../lib/logger.js'

/**
 * 跑一次 LLM 流式任务并产出统一事件流。
 * @param {object} opts
 * @param {Array} opts.messages  发给模型的消息（service 层拼好）
 * @param {AbortSignal} opts.signal  客户端取消信号，透传到 llm 层
 * @param {Function} opts.writeEvent  写统一事件的回调
 * @param {string} opts.promptVersion  如 analyze.v1，进 meta 事件与日志
 * @param {boolean} [opts.bufferText]  true 时不转发 delta，只返回全文（analyze 用于先做 JSON 校验）
 * @returns {{ full: string, end: object } | null}  正常返回全文与结束信息；出错返回 null（已写 error 事件）；客户端取消则抛 AbortError
 */
export async function runStream({ messages, signal, requestId, promptVersion, writeEvent, bufferText = false }) {
  // 合同：首事件必须是 meta
  writeEvent({ type: 'meta', requestId, model: MODEL_NAME, promptVersion })

  let full = ''
  let end = null
  try {
    for await (const evt of streamChat({ messages, signal })) {
      if (evt.type === 'delta') {
        full += evt.text
        if (!bufferText) writeEvent({ type: 'delta', text: evt.text })
      } else if (evt.type === 'end') {
        end = evt
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err // 客户端取消：路由层静默收尾，日志由 requestContext 记 aborted
    const code = err.code ?? ERROR_CODES.INTERNAL
    writeEvent({ type: 'error', code, message: err.message })
    if (code === ERROR_CODES.INTERNAL) {
      logEvent({ requestId, event: 'llm_internal_error', level: 'error', message: err.message })
    }
    return null
  }

  const done = { type: 'done', usage: end?.usage ?? null, finishReason: end?.finishReason ?? 'stop' }
  return { full, done }
}
