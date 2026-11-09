/**
 * SSE 流解析器：流式逻辑的解析层 owner（Owner Map）。
 * 输入 Response.body 的 ReadableStream，处理跨 chunk 切割的事件缓冲，
 * 按事件合同（docs/ARCHITECTURE.md 5.3）的 type 分发回调。
 * 只认 type，不感知任何模型供应商协议（如 choices[*].delta）。
 */
import type { AiDeltaEvent, AiDoneEvent, AiErrorEvent, AiMetaEvent } from '../types'

export interface SseHandlers<TResult = unknown> {
  onMeta?: (event: AiMetaEvent) => void
  onDelta?: (event: AiDeltaEvent) => void
  onDone?: (event: AiDoneEvent<TResult>) => void
  onError?: (event: AiErrorEvent) => void
}

/** 消费 SSE 流直到结束；解析过程中的异常（如流被读取中断）原样上抛给调用方 */
export async function consumeSseStream<TResult = unknown>(
  stream: ReadableStream<Uint8Array>,
  handlers: SseHandlers<TResult>,
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''
  const reader = stream.getReader()

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      // stream: true 处理多字节字符被切在 chunk 边界的情况
      buffer += decoder.decode(value, { stream: true })
      buffer = dispatchCompleteLines(buffer, handlers)
    }
    // 收尾：flush 解码器，处理最后无换行符的残留行
    buffer += decoder.decode()
    if (buffer.trim().length > 0) {
      dispatchCompleteLines(buffer + '\n', handlers)
    }
  } finally {
    reader.releaseLock()
  }
}

/** 取出 buffer 中所有完整行并逐行分发，返回未成行的残留片段 */
function dispatchCompleteLines<TResult>(buffer: string, handlers: SseHandlers<TResult>): string {
  let rest = buffer
  let newlineIndex: number
  while ((newlineIndex = rest.indexOf('\n')) !== -1) {
    const line = rest.slice(0, newlineIndex).replace(/\r$/, '')
    rest = rest.slice(newlineIndex + 1)
    dispatchLine(line, handlers)
  }
  return rest
}

/** 单行分发：只处理 `data: {JSON}`；其余（注释、空行、非 JSON 数据）安全跳过 */
function dispatchLine<TResult>(line: string, handlers: SseHandlers<TResult>): void {
  if (!line.startsWith('data:')) return
  const payload = line.slice(5).trim()
  if (payload.length === 0 || payload === '[DONE]') return

  let event: unknown
  try {
    event = JSON.parse(payload)
  } catch {
    // 单条坏行不影响整条流：跳过，不中断后续事件
    return
  }
  dispatchEvent(event, handlers)
}

/** 按合同 type 分发；未知 type 忽略（向前兼容新增事件） */
function dispatchEvent<TResult>(event: unknown, handlers: SseHandlers<TResult>): void {
  if (typeof event !== 'object' || event === null) return
  const type = (event as { type?: unknown }).type
  switch (type) {
    case 'meta':
      handlers.onMeta?.(event as AiMetaEvent)
      break
    case 'delta':
      handlers.onDelta?.(event as AiDeltaEvent)
      break
    case 'done':
      handlers.onDone?.(event as AiDoneEvent<TResult>)
      break
    case 'error':
      handlers.onError?.(event as AiErrorEvent)
      break
    default:
      break
  }
}
