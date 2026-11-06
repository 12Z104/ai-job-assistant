import { useState } from 'react'
import { Button, Textarea } from '../../components/ui'
import s from './interview.module.css'

/** 单条回答上界：超出不写入，避免无界增长 */
const ANSWER_MAX = 2_000

interface InterviewComposerProps {
  /** 等待面试官追问中：发送按钮进 loading，避免重复提交 */
  sending?: boolean
  onSend: (content: string) => void
}

/**
 * L3 领域件：面试输入区。
 * Enter 发送 / Shift + Enter 换行；输入法组合态（isComposing）按 Enter 只选词，不发送。
 * 草稿留在本组件内，页面只消费 onSend 的最终文本。
 */
export function InterviewComposer({ sending = false, onSend }: InterviewComposerProps) {
  const [draft, setDraft] = useState('')
  const canSend = draft.trim().length > 0 && !sending

  function submit() {
    if (!canSend) return
    onSend(draft.trim())
    setDraft('')
  }

  return (
    <div className={s.composer}>
      <Textarea
        value={draft}
        autoSize={{ minRows: 2, maxRows: 5 }}
        maxLength={ANSWER_MAX}
        placeholder="输入你的回答，Enter 发送，Shift + Enter 换行"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          // 组合态 Enter 属于选词确认，交给输入法处理
          if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
          event.preventDefault()
          submit()
        }}
      />
      <div className={s.composerBar}>
        <span className={`${s.composerCount} num`}>
          {draft.length}/{ANSWER_MAX}
        </span>
        <Button type="primary" size="small" loading={sending} disabled={!canSend} onClick={submit}>
          发送
        </Button>
      </div>
    </div>
  )
}
