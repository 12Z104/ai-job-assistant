// 右栏：AI 结果展示区（现在还没接后端，先占位）
interface ResultPanelProps {
  result: string
}

export default function ResultPanel({ result }: ResultPanelProps) {
  return (
    <div style={{
      flex: 1,
      background: '#f6f8fa',
      padding: 12,
      borderRadius: 4,
      minHeight: 320,
      whiteSpace: 'pre-wrap',
    }}>
      {result || 'AI 分析结果会显示在这里（模块3 才接通后端）'}
    </div>
  )
}
