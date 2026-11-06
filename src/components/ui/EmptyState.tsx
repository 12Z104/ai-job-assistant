import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import s from './ui.module.css'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  desc?: string
  action?: ReactNode
}

/** 空状态：图标 + 一句话 + 可选动作。所有列表/结果区必配。 */
export function EmptyState({ icon: Icon = Inbox, title, desc, action }: EmptyStateProps) {
  return (
    <div className={s.empty}>
      <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
      <p className={s.emptyTitle}>{title}</p>
      {desc && <p className={s.emptyDesc}>{desc}</p>}
      {action && <div className={s.emptyAction}>{action}</div>}
    </div>
  )
}
