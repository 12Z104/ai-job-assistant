// DeepSeek 供应商适配层：全仓库唯一知道 OpenAI 兼容协议的地方
// 暴露 streamChat({ messages, signal }) 异步迭代器：
//   产出 { type: 'delta', text } 若干，最后产出 { type: 'end', finishReason, usage }
// 业务字段（简历/JD/prompt）不进入本层，只透传 messages

import { fail, ERROR_CODES } from '../lib/errors.js'

export const MODEL_NAME = 'deepseek-chat'
const TIMEOUT_MS = 30000 // 合同：上游 30s 超时

// 调上游并解析 OpenAI 格式 SSE 流
export async function* streamChat({ messages, signal }) {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    // 启动时已崩溃拦截，这里兜底：运行中 key 意外缺失返回 INTERNAL
    throw fail(ERROR_CODES.INTERNAL, '服务端未配置 LLM_API_KEY')
  }
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.deepseek.com'

  // 30s 超时与客户端取消信号组合：任一触发即中止上游
  const timeoutSignal = AbortSignal.timeout(TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

  let upstream
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        stream: true,
        // 要求上游在流末尾附带 token 用量，供 done 事件的 usage
        stream_options: { include_usage: true },
        messages,
      }),
      signal: combined,
    })
  } catch (err) {
    if (err.name === 'TimeoutError') throw fail(ERROR_CODES.UPSTREAM_TIMEOUT, '模型响应超时')
    // 客户端主动取消（AbortError）原样上抛，由上层静默处理
    throw err
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '')
    throw fail(ERROR_CODES.UPSTREAM_ERROR, `上游返回 ${upstream.status}`, [text.slice(0, 500)])
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let finishReason = null
  let usage = null

  try {
    for await (const chunk of upstream.body) {
      buffer += decoder.decode(chunk, { stream: true })
      let idx
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim()
        buffer = buffer.slice(idx + 1)
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        let json
        try {
          json = JSON.parse(payload)
        } catch {
          continue // 半截或非 JSON 行直接跳过
        }
        const choice = json.choices?.[0]
        const text = choice?.delta?.content
        if (text) yield { type: 'delta', text }
        if (choice?.finish_reason) finishReason = choice.finish_reason
        if (json.usage) usage = json.usage
      }
    }
  } catch (err) {
    if (err.name === 'TimeoutError') throw fail(ERROR_CODES.UPSTREAM_TIMEOUT, '模型响应超时')
    throw err
  }

  yield { type: 'end', finishReason: finishReason ?? 'stop', usage }
}
