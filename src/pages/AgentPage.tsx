import { useState, useRef } from 'react'
import Panel from '../components/Panel'

interface Step {
  num: number
  title: string
  content: string
}

// 解析流式文本里的【步骤N:标题】...【/步骤】标记
function parseSteps(raw: string): Step[] {
  const steps: Step[] = []
  const regex = /【步骤(\d+):([^】]+)】(.*?)【\/步骤】/gs
  let match
  while ((match = regex.exec(raw)) !== null) {
    steps.push({
      num: parseInt(match[1] ?? '0'),
      title: match[2] ?? '',
      content: (match[3] ?? '').trim(),
    })
  }
  return steps
}

export default function AgentPage() {
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function startAgent() {
    if (!resume.trim() || !jd.trim()) { alert('请先贴简历和 JD'); return }
    setLoading(true)
    setRaw('')
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/agent-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jd }),
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
          const payload = line.slice(6)
          if (payload === '[DONE]') break
          try {
            const json = JSON.parse(payload)
            const text = json.choices?.[0]?.delta?.content
            if (text) setRaw((prev) => prev + text)
          } catch { /* 跳过不完整行 */ }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setRaw((p) => p + '\n❌ 出错: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function stop() {
    abortRef.current?.abort()
    setLoading(false)
  }

  const steps = parseSteps(raw)
  const finalStep = steps.find((s) => s.num === 4)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>🧠 简历优化 Agent（多步思考）</h2>
        {loading ? (
          <button onClick={stop} style={{
            marginLeft: 'auto', padding: '8px 20px', borderRadius: 8,
            border: '1px solid #ef4444', background: '#fff', color: '#ef4444', cursor: 'pointer',
          }}>■ 停止</button>
        ) : (
          <button onClick={startAgent} style={{
            marginLeft: 'auto', padding: '8px 20px', borderRadius: 8, border: 'none',
            cursor: 'pointer', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 500,
          }}>开始 Agent 分析</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左：输入 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="简历">
            <textarea value={resume} onChange={(e) => setResume(e.target.value)}
              placeholder="贴简历..."
              style={{ width: '100%', flex: 1, minHeight: 150, resize: 'vertical', padding: 8, boxSizing: 'border-box' }} />
          </Panel>
          <Panel title="岗位 JD">
            <textarea value={jd} onChange={(e) => setJd(e.target.value)}
              placeholder="贴 JD..."
              style={{ width: '100%', flex: 1, minHeight: 150, resize: 'vertical', padding: 8, boxSizing: 'border-box' }} />
          </Panel>
        </div>

        {/* 右：思考链 + 最终结果 */}
        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel title="思考链（AI 正在想什么）">
            <div style={{ minHeight: 200, fontSize: 13, lineHeight: 1.6 }}>
              {steps.length === 0 && !loading && <span style={{ color: '#9ca3af' }}>点击"开始 Agent 分析"，这里会逐步显示 AI 的思考过程</span>}
              {steps.filter((s) => s.num !== 4).map((s) => (
                <div key={s.num} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
                    ✓ 步骤{s.num}：{s.title}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{s.content}</div>
                </div>
              ))}
              {loading && <div style={{ color: '#9ca3af' }}>思考中...</div>}
            </div>
          </Panel>
          <Panel title="最终修改方案">
            <div style={{
              minHeight: 150, background: '#f0fdf4', padding: 12, borderRadius: 4,
              whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14,
            }}>
              {finalStep ? finalStep.content : <span style={{ color: '#9ca3af' }}>Agent 走完 4 步后，这里会给出最终修改方案</span>}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
