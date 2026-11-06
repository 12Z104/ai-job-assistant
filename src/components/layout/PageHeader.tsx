import type { ReactNode } from 'react'
import s from './layout.module.css'

interface PageHeaderProps {
  title: string
  desc?: string
  actions?: ReactNode
}

/** L2 结构件：页面标题 + 说明 + 右侧动作区。 */
export function PageHeader({ title, desc, actions }: PageHeaderProps) {
  return (
    <div className={s.pageHeader}>
      <div>
        <h2 className={s.pageTitle}>{title}</h2>
        {desc && <p className={s.pageDesc}>{desc}</p>}
      </div>
      {actions && <div className={s.pageActions}>{actions}</div>}
    </div>
  )
}
