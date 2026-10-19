import { useState } from 'react'
import Panel from '../components/Panel'
import { rewriteResume } from '../services/api'

// 解析 AI 返回的标记：【改】...【/改】=绿底，【补】...【/补】=黄底
function renderWithHighlights(text: string) {
  const parts: { text: string; type: 'normal' | 'green' | 'yellow' }[] = []
  const regex = /【改】(.*?)【\/改】|【补】(.*?)【\/补】/gs
  let lastIndex = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), type: 'normal' })
    }
    parts.push({
      text: match[1] !== undefined ? match[1] : match[2],
      type: match[1] !== undefined ? 'green' : 'yellow',
    })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), type: 'normal' })
  }
  return parts
}

export default function RewritePage() {
  const [resume, setResume] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRewrite() {
    if (!resume.trim()) { alert('请先贴一段简历'); return }
    setLoading(true)
    setResult('AI 正在改写...')
    try {
      const reply = await rewriteResume(resume)
      setResult(reply)
    } catch (err) {
      setResult('出错了: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const parts = result ? renderWithHighlights(result) : []

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>✍️ 简历智能改写</h2>
        <button
          onClick={handleRewrite}
          disabled={loading}
          style={{
            marginLeft: 'auto', padding: '8px 20px', borderRadius: 8, border: 'none',
            cursor: loading ? 'wait' : 'pointer', background: 'var(--primary)',
            color: '#fff', fontSize: 14, fontWeight: 500,
          }}
        >
          {loading ? '改写中...' : 'AI 改写简历'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <Panel title="原文粘贴">
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="在这里粘贴你的简历原文..."
            style={{
              width: '100%', flex: 1, minHeight: 400, resize: 'vertical',
              padding: 8, boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6,
            }}
          />
        </Panel>
        <Panel title="改写结果（绿=润色 黄=新增建议）">
          <div style={{
            flex: 1, background: '#f9fafb', padding: 12, borderRadius: 4,
            minHeight: 400, whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14,
          }}>
            {parts.length === 0 ? (
              <span style={{ color: '#9ca3af' }}>改写后的简历会显示在这里</span>
            ) : (
              parts.map((p, i) => (
                <span key={i} style={{
                  background: p.type === 'green' ? '#dcfce7' : p.type === 'yellow' ? '#fef9c3' : 'transparent',
                  padding: p.type === 'normal' ? 0 : '1px 3px',
                  borderRadius: 3,
                }}>
                  {p.text}
                </span>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
