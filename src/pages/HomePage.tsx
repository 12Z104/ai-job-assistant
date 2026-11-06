import { Link } from 'react-router-dom'
import { BarChart3, Bot, Mic, PenLine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import s from './HomePage.module.css'

interface FeatureCard {
  to: string
  icon: LucideIcon
  title: string
  desc: string
  hint: string
}

const features: FeatureCard[] = [
  {
    to: '/match',
    icon: BarChart3,
    title: '简历匹配分析',
    desc: '贴简历 + JD，看结构化打分、亮点与差距',
    hint: '30 秒出结果',
  },
  {
    to: '/rewrite',
    icon: PenLine,
    title: '智能改写',
    desc: 'AI 改写简历，绿标润色、黄标建议补充',
    hint: '逐条可采纳',
  },
  {
    to: '/agent',
    icon: Bot,
    title: '优化 Agent',
    desc: '解析 JD → 提取素材 → 识别短板 → 修改方案',
    hint: '四步推理',
  },
  {
    to: '/interview',
    icon: Mic,
    title: '模拟面试',
    desc: '基于简历与 JD 多轮追问，结束给综合点评',
    hint: '睡前 10 分钟一轮',
  },
]

/** 首页：项目入口与功能导航，静态内容，不接接口。 */
export default function HomePage() {
  return (
    <div className={s.home}>
      <section className={`rise ${s.hero}`}>
        <p className={s.eyebrow}>RESUME × JD · 结构化匹配</p>
        <h1 className={s.heroTitle}>把简历改成岗位真正想要的样子</h1>
        <p className={s.heroDesc}>
          贴一份简历、一段 JD，拿到匹配分、差距清单和可采纳的改写句——
          改完再测一次，看分数怎么变。
        </p>
        <Link className={s.heroCta} to="/match">
          开始匹配分析
        </Link>
      </section>

      <section className={s.grid} aria-label="功能入口">
        {features.map((feature, index) => (
          <Link key={feature.to} to={feature.to} className={`rise rise-${index + 1} ${s.card}`}>
            <feature.icon size={22} strokeWidth={1.5} aria-hidden="true" />
            <h3 className={s.cardTitle}>{feature.title}</h3>
            <p className={s.cardDesc}>{feature.desc}</p>
            <span className={s.cardHint}>{feature.hint}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
