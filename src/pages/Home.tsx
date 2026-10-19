interface HomeProps {
  onOpenAnalyze: () => void
  onOpenRewrite: () => void
}

// 首页：功能卡片矩阵，点卡片进入对应功能（类似 BOSS 直聘工作台）
export default function Home({ onOpenAnalyze, onOpenRewrite }: HomeProps) {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
      <div className="fade-in">
        <h1 style={{ fontSize: 32, margin: '0 0 8px', letterSpacing: '-0.5px' }}>AI 求职助手</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 40px' }}>
          把简历和 JD 喂给 AI，拿到匹配分析和改写建议
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {/* 卡片1：简历匹配分析（已上线） */}
        <div
          onClick={onOpenAnalyze}
          className="fade-in"
          style={{
            background: 'var(--card)', borderRadius: 16, padding: 24,
            cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(79,110,247,0.18)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <h3 style={{ margin: '0 0 6px' }}>简历匹配分析</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
            贴简历 + 岗位 JD，AI 分析匹配点、差距和修改建议
          </p>
          <span style={{
            fontSize: 12, color: 'var(--primary)', background: 'var(--primary-light)',
            padding: '3px 12px', borderRadius: 20,
          }}>已上线</span>
        </div>

        {/* 卡片2：简历智能改写（已上线） */}
        <div
          onClick={onOpenRewrite}
          className="fade-in"
          style={{
            background: 'var(--card)', borderRadius: 16, padding: 24,
            cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(124,58,237,0.18)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>✍️</div>
          <h3 style={{ margin: '0 0 6px' }}>简历智能改写</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
            AI 改写简历，绿标润色、黄标建议，一眼看出改了哪
          </p>
          <span style={{
            fontSize: 12, color: 'var(--primary)', background: 'var(--primary-light)',
            padding: '3px 12px', borderRadius: 20,
          }}>已上线</span>
        </div>

        {/* 卡片3：模拟面试（即将上线） */}
        <div className="fade-in" style={{
          background: 'var(--card)', borderRadius: 16, padding: 24, opacity: 0.55,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎤</div>
          <h3 style={{ margin: '0 0 6px' }}>AI 模拟面试</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
            针对你的简历和 JD，模拟面试官连环追问，结束给点评
          </p>
          <span style={{
            fontSize: 12, color: 'var(--text-secondary)', background: '#f1f5f9',
            padding: '3px 12px', borderRadius: 20,
          }}>即将上线</span>
        </div>
      </div>
    </div>
  )
}
