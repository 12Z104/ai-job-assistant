interface HomeProps {
  onOpenAnalyze: () => void
  onOpenRewrite: () => void
  onOpenAgent: () => void
  onOpenInterview: () => void
}

export default function Home({ onOpenAnalyze, onOpenRewrite, onOpenAgent, onOpenInterview }: HomeProps) {
  const cardStyle = (clickable: boolean) => ({
    background: 'var(--card)', borderRadius: 16, padding: 24,
    cursor: clickable ? 'pointer' : 'default',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    opacity: clickable ? 1 : 0.55,
  })

  const onEnter = (e: React.MouseEvent<HTMLDivElement>, color: string) => {
    e.currentTarget.style.transform = 'translateY(-4px)'
    e.currentTarget.style.boxShadow = `0 12px 28px ${color}`
  }
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = ''
    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
      <div className="fade-in">
        <h1 style={{ fontSize: 32, margin: '0 0 8px', letterSpacing: '-0.5px' }}>AI 求职助手</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 40px' }}>
          把简历和 JD 喂给 AI，拿到匹配分析、改写建议和模拟面试
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        <div onClick={onOpenAnalyze} className="fade-in" style={cardStyle(true)}
          onMouseEnter={(e) => onEnter(e, 'rgba(79,110,247,0.18)')} onMouseLeave={onLeave}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <h3 style={{ margin: '0 0 6px' }}>简历匹配分析</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
            贴简历 + JD，AI 分析匹配点、差距和修改建议
          </p>
          <span style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 12px', borderRadius: 20 }}>已上线</span>
        </div>

        <div onClick={onOpenRewrite} className="fade-in" style={cardStyle(true)}
          onMouseEnter={(e) => onEnter(e, 'rgba(124,58,237,0.18)')} onMouseLeave={onLeave}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✍️</div>
          <h3 style={{ margin: '0 0 6px' }}>简历智能改写</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
            AI 改写简历，绿标润色、黄标建议
          </p>
          <span style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 12px', borderRadius: 20 }}>已上线</span>
        </div>

        <div onClick={onOpenAgent} className="fade-in" style={cardStyle(true)}
          onMouseEnter={(e) => onEnter(e, 'rgba(16,185,129,0.18)')} onMouseLeave={onLeave}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
          <h3 style={{ margin: '0 0 6px' }}>简历优化 Agent</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
            多步推理：解析JD → 提取素材 → 识别短板 → 修改方案
          </p>
          <span style={{ fontSize: 12, color: '#059669', background: '#d1fae5', padding: '3px 12px', borderRadius: 20 }}>已上线</span>
        </div>

        <div onClick={onOpenInterview} className="fade-in" style={cardStyle(true)}
          onMouseEnter={(e) => onEnter(e, 'rgba(245,158,11,0.18)')} onMouseLeave={onLeave}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎤</div>
          <h3 style={{ margin: '0 0 6px' }}>AI 模拟面试</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
            根据简历和 JD 模拟面试官连环追问，结束后综合点评
          </p>
          <span style={{ fontSize: 12, color: '#d97706', background: '#fef3c7', padding: '3px 12px', borderRadius: 20 }}>已上线</span>
        </div>
      </div>
    </div>
  )
}
