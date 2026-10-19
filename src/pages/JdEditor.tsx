// 中栏：岗位 JD 粘贴区（和简历区长得一样，但职责不同，分开写方便以后改）
interface JdEditorProps {
  value: string
  onChange: (v: string) => void
}

export default function JdEditor({ value, onChange }: JdEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="在这里粘贴招聘 JD（岗位描述）..."
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
