import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { to: '/analyze', label: '📊 匹配分析' },
  { to: '/rewrite', label: '✍️ 简历改写' },
  { to: '/agent', label: '🧠 优化 Agent' },
  { to: '/interview', label: '🎤 模拟面试' },
]

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--card)', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 56, display: 'flex', alignItems: 'center', gap: 24,
        }}>
          <NavLink to="/" style={{
            fontSize: 17, fontWeight: 700, color: 'var(--primary)',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            AI 求职助手
          </NavLink>
          <nav style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  padding: '6px 12px', borderRadius: 8, fontSize: 14,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background 0.2s, color 0.2s',
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  )
}
