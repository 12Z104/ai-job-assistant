import { Link } from 'react-router-dom'

interface CardDef {
  to: string
  emoji: string
  title: string
  desc: string
  tag: string
  tagColor: string
  tagBg: string
  hoverColor: string
}

const cards: CardDef[] = [
  {
    to: '/analyze', emoji: '📊', title: '简历匹配分析',
    desc: '贴简历 + JD，AI 分析匹配点、差距和修改建议',
    tag: '已上线', tagColor: 'var(--primary)', tagBg: 'var(--primary-light)',
    hoverColor: 'rgba(79,110,247,0.18)',
  },
  {
    to: '/rewrite', emoji: '✍️', title: '简历智能改写',
    desc: 'AI 改写简历，绿标润色、黄标建议',
    tag: '已上线', tagColor: 'var(--primary)', tagBg: 'var(--primary-light)',
    hoverColor: 'rgba(124,58,237,0.18)',
  },
  {
    to: '/agent', emoji: '🧠', title: '简历优化 Agent',
    desc: '多步推理：解析JD → 提取素材 → 识别短板 → 修改方案',
    tag: '已上线', tagColor: '#059669', tagBg: '#d1fae5',
    hoverColor: 'rgba(16,185,129,0.18)',
  },
  {
    to: '/interview', emoji: '🎤', title: 'AI 模拟面试',
    desc: '根据简历和 JD 模拟面试官连环追问，结束后综合点评',
    tag: '已上线', tagColor: '#d97706', tagBg: '#fef3c7',
    hoverColor: 'rgba(245,158,11,0.18)',
  },
]

export default function Home() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
      <div className="fade-in">
        <h1 style={{ fontSize: 32, margin: '0 0 8px', letterSpacing: '-0.5px' }}>AI 求职助手</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 40px' }}>
          把简历和 JD 喂给 AI，拿到匹配分析、改写建议和模拟面试
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="fade-in"
            style={{
              background: 'var(--card)', borderRadius: 16, padding: 24,
              textDecoration: 'none', color: 'inherit',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 12px 28px ${card.hoverColor}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>{card.emoji}</div>
            <h3 style={{ margin: '0 0 6px' }}>{card.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
              {card.desc}
            </p>
            <span style={{
              fontSize: 12, color: card.tagColor, background: card.tagBg,
              padding: '3px 12px', borderRadius: 20,
            }}>{card.tag}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
