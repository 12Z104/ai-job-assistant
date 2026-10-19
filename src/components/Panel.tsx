import type { ReactNode } from 'react'

// 公共面板：所有"卡片"共用一个外壳，避免三个区重复写边框样式
interface PanelProps {
  title: string        // 卡片标题，比如"① 简历"
  children: ReactNode  // 卡片里的内容（文本框/结果区）
}

export default function Panel({ title, children }: PanelProps) {
  return (
    <div style={{
      border: '1px solid #d0d7de',
      borderRadius: 8,
      padding: 16,
      flex: 1,                 // 三栏等宽的关键
      display: 'flex',
      flexDirection: 'column',
    }}>
      <h3 style={{ margin: '0 0 12px' }}>{title}</h3>
      {children}
    </div>
  )
}
