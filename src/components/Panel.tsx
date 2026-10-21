import type { ReactNode, CSSProperties } from 'react'

interface PanelProps {
  title: string
  children: ReactNode
  style?: CSSProperties
}

export default function Panel({ title, children, style }: PanelProps) {
  return (
    <div style={{
      border: '1px solid #d0d7de',
      borderRadius: 8,
      padding: 16,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}>
      <h3 style={{ margin: '0 0 12px' }}>{title}</h3>
      {children}
    </div>
  )
}
