import { useCallback, useEffect, useRef, useState } from 'react'
import { HttpError, postStream } from '../services/http'
import { consumeSseStream } from '../services/sse'

/** 流式请求生命周期：idle 未开始 / streaming 推进中 / done 正常结束 / error 失败 */
export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error'

/** 统一错误形态：页面只需 code + message */
export interface StreamingError {
  code: string
  message: string
}

export interface UseStreamingReturn<TResult> {
  status: StreamStatus
  /** 累积的 delta 文本（流式渲染直用） */
  text: string
  /** done.result（仅 analyze 端点可能携带，其余端点为 null） */
  result: TResult | null
  /** meta.requestId，用于问题追踪 */
  requestId: string | null
  error: StreamingError | null
  /** 发起流式请求；重复调用会先中止上一次 */
  start: (body: unknown) => Promise<void>
  /** 立即中止当前流（AbortController） */
  stop: () => void
}

/**
 * 流式请求/取消逻辑唯一 owner（Owner Map）。
 * 组合 http.postStream（请求 + 错误归一）与 sse.consumeSseStream（解析）：
 * delta 累积进 text 供流式渲染，done 携带 result 时透传，error 事件与
 * 网络失败统一进入 error 态；用户 stop 与组件卸载走同一 AbortController 中止路径。
 */
export function useStreaming<TResult = unknown>(path: string): UseStreamingReturn<TResult> {
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [text, setText] = useState('')
  const [result, setResult] = useState<TResult | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [error, setError] = useState<StreamingError | null>(null)

  /** 当前流的控制器：stop / 卸载 / 重入都通过它中止 */
  const controllerRef = useRef<AbortController | null>(null)
  /** 用户主动中止标记：中止不算失败，不进 error 态 */
  const stoppedRef = useRef(false)

  // 组件卸载自动 abort，避免泄漏的流继续 setState
  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    stoppedRef.current = true
    controllerRef.current?.abort()
    controllerRef.current = null
    setStatus((prev) => (prev === 'streaming' ? 'idle' : prev))
  }, [])

  const start = useCallback(
    async (body: unknown) => {
      // 重入保护：上一次流还在跑就先中止
      controllerRef.current?.abort()
      stoppedRef.current = false
      const controller = new AbortController()
      controllerRef.current = controller

      setStatus('streaming')
      setText('')
      setResult(null)
      setError(null)
      setRequestId(null)

      try {
        const response = await postStream(path, body, { signal: controller.signal })
        if (!response.body) {
          throw new HttpError('NO_STREAM', '服务端未返回流式响应')
        }
        // 终态标记：done / error 事件必须二选一，否则视为连接被截断
        let terminated = false
        await consumeSseStream<TResult>(response.body, {
          onMeta: (event) => setRequestId(event.requestId),
          onDelta: (event) => setText((prev) => prev + event.text),
          onDone: (event) => {
            terminated = true
            setResult(event.result ?? null)
            setStatus('done')
          },
          onError: (event) => {
            terminated = true
            setError({ code: event.code, message: event.message })
            setStatus('error')
          },
        })
        // 流结束但没收到 done/error 事件（连接被截断）：按错误处理，不静默
        if (!terminated) {
          setError({ code: 'STREAM_TRUNCATED', message: '连接中断，未收到完整结果' })
          setStatus('error')
        }
      } catch (err) {
        // 用户主动中止 / 卸载触发：不算失败，保留已累积文本
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError({
          code: err instanceof HttpError ? err.code : 'UNKNOWN',
          message: err instanceof Error ? err.message : '未知错误',
        })
        setStatus('error')
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
        }
      }
    },
    [path],
  )

  return { status, text, result, requestId, error, start, stop }
}
