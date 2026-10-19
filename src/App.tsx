import { useState } from 'react'
import Panel from './components/Panel'
import ResumeEditor from './pages/ResumeEditor'
import JdEditor from './pages/JdEditor'
import ResultPanel from './pages/ResultPanel'
import Home from './pages/Home'
import RewritePage from './pages/RewritePage'
import { useStreaming } from './hooks/useStreaming'

function App() {
  const [view, setView] = useState<'home' | 'analyze' | 'rewrite'>('home')
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const { result, loading, start, stop, setResult } = useStreaming()

  function handleAnalyze() {
    if (!resumeText.trim() || !jdText.trim()) {
      alert('请先把简历和 JD 都贴进去')
      return
    }
    start({ resume: resumeText, jd: jdText })
  }

  if (view === 'home') {
    return <Home onOpenAnalyze={() => setView('analyze')} onOpenRewrite={() => setView('rewrite')} />
  }

  if (view === 'rewrite') {
    return <RewritePage />
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setView('home')}
          style={{
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            border: '1px solid var(--border)', background: 'var(--card)', fontSize: 14,
          }}
        >
          ← 返回首页
        </button>
        <h2 style={{ margin: 0, fontSize: 20 }}>简历匹配分析</h2>
        {loading ? (
          <button
            onClick={stop}
            style={{
              marginLeft: 'auto', padding: '8px 20px', borderRadius: 8,
              border: '1px solid #ef4444', background: '#fff', color: '#ef4444',
              cursor: 'pointer', fontSize: 14,
            }}
          >
            ■ 停止生成
          </button>
        ) : (
          <button
            onClick={handleAnalyze}
            style={{
              marginLeft: 'auto', padding: '8px 20px', borderRadius: 8,
              border: 'none', cursor: 'pointer',
              background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 500,
            }}
          >
            开始分析匹配度
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Panel title="① 简历">
          <ResumeEditor value={resumeText} onChange={setResumeText} />
        </Panel>
        <Panel title="② 岗位 JD">
          <JdEditor value={jdText} onChange={setJdText} />
        </Panel>
        <Panel title="③ AI 结果">
          <ResultPanel result={result} />
        </Panel>
      </div>
    </div>
  )
}

export default App
