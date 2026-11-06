import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Bot, Home, Mic, PenLine, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import s from './layout.module.css'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/match', label: '匹配分析', icon: BarChart3, end: false },
  { to: '/rewrite', label: '智能改写', icon: PenLine, end: false },
  { to: '/agent', label: '优化 Agent', icon: Bot, end: false },
  { to: '/interview', label: '模拟面试', icon: Mic, end: false },
  { to: '/settings', label: '设置', icon: Settings, end: false },
]

/**
 * L2 结构件：顶栏 + 导航 + 内容区。不含业务数据，页面经 <Outlet> 注入。
 */
export function AppShell() {
  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <div className={s.topbarInner}>
          <NavLink to="/" className={s.brand}>
            <span className={s.brandMark} aria-hidden="true" />
            AI 求职助手
          </NavLink>
          <nav className={s.nav} aria-label="主导航">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `${s.navItem} ${isActive ? s.navItemActive : ''}`
                }
              >
                <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className={s.main}>
        <Outlet />
      </main>
    </div>
  )
}
