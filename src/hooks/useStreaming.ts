import { useState, useRef, useCallback } from 'react'

// 自定义 Hook：封装"流式请求 + 中途取消"的逻辑
// 以后任何需要流式的页面都用这一个 Hook，不用重复写
export function useStreaming() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(async (body: object) => {
    setResult('')
    setLoading(true)
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,  // ★ 绑定取消信号
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        // 解析 SSE：每行形如 data: {"choices":[{"delta":{"content":"字"}}]}
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break
          try {
            const json = JSON.parse(payload)
            const text = json.choices?.[0]?.delta?.content
            if (text) setResult((prev) => prev + text)  // 逐字追加
          } catch { /* 跳过不完整行 */ }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setResult((prev) => prev + '\n\n❌ 出错了: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // 停止生成：触发 AbortController
  const stop = useCallback(() => {
    abortRef.current?.abort()
    setLoading(false)
  }, [])

  return { result, loading, start, stop, setResult }
}
