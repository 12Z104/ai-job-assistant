// 左栏：简历编辑区（受控文本框）
interface ResumeEditorProps {
  value: string                 // 当前简历文本（由 App 传入）
  onChange: (v: string) => void // 改了之后通知 App
}

export default function ResumeEditor({ value, onChange }: ResumeEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="在这里粘贴你的简历全文..."
      style={{
        width: '100%',
        flex: 1,
        minHeight: 320,
        resize: 'vertical',
        padding: 8,
        boxSizing: 'border-box',
        fontFamily: 'inherit',
      }}
    />
  )
}
