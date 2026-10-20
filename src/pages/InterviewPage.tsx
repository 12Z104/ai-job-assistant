import { useState, useRef, useEffect } from 'react'
import Panel from '../components/Panel'

interface Msg { role: 'user' | 'assistant'; content: string }

export default function InterviewPage() {
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [interviewing, setInterviewing] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function callAI(msgs: Msg[]) {
    setStreaming(true)
    abortRef.current = new AbortController()
    let assistantMsg = ''
    try {
      const res = await fetch('/api/interview-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jd, messages: msgs }),
        signal: abortRef.current.signal,
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const p = line.slice(6)
          if (p === '[DONE]') break
          try {
            const json = JSON.parse(p)
            const text = json.choices?.[0]?.delta?.content
            if (text) {
              assistantMsg += text
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { role: 'assistant', content: assistantMsg }
                return next
              })
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setMessages((p) => [...p, { role: 'assistant', content: '❌ 出错了' }])
    } finally {
      setStreaming(false)
    }
  }

  function startInterview() {
    if (!resume.trim() || !jd.trim()) { alert('请先贴简历和 JD'); return }
    setMessages([])
    setInterviewing(true)
    const msgs: Msg[] = [{ role: 'user', content: '开始面试' }]
    setMessages([...msgs, { role: 'assistant', content: '' }])
    callAI([...msgs, { role: 'assistant', content: '请开始' }])
  }

  function send() {
    if (!input.trim() || streaming) return
    const userMsg: Msg = { role: 'user', content: input }
    const newMsgs = [...messages, userMsg]
    setMessages([...newMsgs, { role: 'assistant', content: '' }])
    setInput('')
    callAI(newMsgs)
  }

  function endInterview() {
    const userMsg: Msg = { role: 'user', content: '面试结束，请给出综合点评' }
    const newMsgs = [...messages, userMsg]
    setMessages([...newMsgs, { role: 'assistant', content: '' }])
    callAI(newMsgs)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>🎤 AI 模拟面试</h2>
        {interviewing && !streaming && (
          <button onClick={endInterview} style={{
            marginLeft: 'auto', padding: '8px 20px', borderRadius: 8,
            border: '1px solid #ef4444', background: '#fff', color: '#ef4444', cursor: 'pointer',
          }}>结束面试并点评</button>
        )}
      </div>

      {!interviewing ? (
        <div style={{ display: 'flex', gap: 16 }}>
          <Panel title="简历" style={{ flex: 1 }}>
            <textarea value={resume} onChange={(e) => setResume(e.target.value)}
              placeholder="贴你的简历..."
              style={{ width: '100%', minHeight: 200, resize: 'vertical', padding: 8, boxSizing: 'border-box' }} />
          </Panel>
          <Panel title="岗位 JD" style={{ flex: 1 }}>
            <textarea value={jd} onChange={(e) => setJd(e.target.value)}
              placeholder="贴目标岗位 JD..."
              style={{ width: '100%', minHeight: 200, resize: 'vertical', padding: 8, boxSizing: 'border-box' }} />
          </Panel>
        </div>
      ) : (
        <Panel title="面试对话">
          <div style={{ minHeight: 300, maxHeight: 500, overflowY: 'auto', padding: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.6,
                  background: m.role === 'user' ? 'var(--primary)' : '#f1f5f9',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content || '...'}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {interviewing && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="回答面试官的问题..."
                disabled={streaming}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }}
              />
              <button onClick={send} disabled={streaming} style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--primary)', color: '#fff', fontSize: 14,
              }}>{streaming ? '思考中...' : '发送'}</button>
            </div>
          )}
        </Panel>
      )}

      {!interviewing && (
        <button onClick={startInterview} style={{
          marginTop: 16, width: '100%', padding: '14px', borderRadius: 10,
          border: 'none', cursor: 'pointer', background: 'var(--primary)', color: '#fff',
          fontSize: 16, fontWeight: 600,
        }}>开始模拟面试</button>
      )}
    </div>
  )
}
