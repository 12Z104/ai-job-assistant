import { useState, useEffect } from 'react'
import Panel from '../components/Panel'
import ResumeEditor from './ResumeEditor'
import JdEditor from './JdEditor'
import ResultPanel from './ResultPanel'
import { useStreaming } from '../hooks/useStreaming'
import { storage } from '../services/storage'

export default function AnalyzePage() {
  const [resumeText, setResumeText] = useState(() => storage.loadResume())
  const [jdText, setJdText] = useState(() => storage.loadJd())
  const { result, loading, start, stop } = useStreaming()

  // 模块8：自动保存到 localStorage
  useEffect(() => { storage.saveResume(resumeText) }, [resumeText])
  useEffect(() => { storage.saveJd(jdText) }, [jdText])

  function handleAnalyze() {
    if (!resumeText.trim() || !jdText.trim()) { alert('请先把简历和 JD 都贴进去'); return }
    start({ resume: resumeText, jd: jdText })
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>简历匹配分析</h2>
        {loading ? (
          <button onClick={stop} style={{
            marginLeft: 'auto', padding: '8px 20px', borderRadius: 8,
            border: '1px solid #ef4444', background: '#fff', color: '#ef4444', cursor: 'pointer',
          }}>■ 停止生成</button>
        ) : (
          <button onClick={handleAnalyze} style={{
            marginLeft: 'auto', padding: '8px 20px', borderRadius: 8, border: 'none',
            cursor: 'pointer', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 500,
          }}>开始分析匹配度</button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Panel title="① 简历"><ResumeEditor value={resumeText} onChange={setResumeText} /></Panel>
        <Panel title="② 岗位 JD"><JdEditor value={jdText} onChange={setJdText} /></Panel>
        <Panel title="③ AI 结果"><ResultPanel result={result} /></Panel>
      </div>
    </div>
  )
}
