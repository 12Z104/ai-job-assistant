import type { ReactNode } from 'react'
import s from './layout.module.css'

interface SplitPaneProps {
  left: ReactNode
  center: ReactNode
  right?: ReactNode
}

/**
 * L2 结构件：三栏工作台（280 / 弹性 / 320）。
 * 传 right 即三栏；不传即两栏；<1024px 自动折叠单栏。
 * 栏间距由组件管理，内容内边距由卡片自己负责。
 */
export function SplitPane({ left, center, right }: SplitPaneProps) {
  const variant = right ? s.split : `${s.split} ${s.splitTwo}`
  return (
    <div className={variant}>
      <div>{left}</div>
      <div>{center}</div>
      {right && <div>{right}</div>}
    </div>
  )
}
