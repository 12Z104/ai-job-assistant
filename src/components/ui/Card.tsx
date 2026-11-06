import { Card as AntCard } from 'antd'
import type { CardProps } from 'antd'

/**
 * L1 基础件：白卡 + 1px 细线 + 2px 圆角，无阴影。
 * 标题走全局 .section-title（小号加字距），头/身左内边距统一 16px。
 */
export function Card({ title, style, styles, ...rest }: CardProps) {
  const headTitle =
    typeof title === 'string' ? <span className="section-title">{title}</span> : title

  return (
    <AntCard
      {...rest}
      title={headTitle}
      style={{ borderRadius: 'var(--radius-md)', ...style }}
      styles={{
        header: {
          minHeight: 'var(--control-h-lg)',
          padding: '0 var(--space-4)',
          borderBottom: '1px solid var(--color-line)',
        },
        body: { padding: 'var(--space-4)' },
        ...styles,
      }}
    />
  )
}
