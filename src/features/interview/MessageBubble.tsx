import s from './interview.module.css'

export type MessageRole = 'user' | 'assistant'

export interface InterviewMessage {
  id: string
  role: MessageRole
  content: string
}

const ROLE_LABEL: Record<MessageRole, string> = {
  user: '我',
  assistant: '面试官',
}

interface MessageBubbleProps {
  role: MessageRole
  content: string
}

/**
 * L3 领域件：面试对话气泡（纯展示，无状态）。
 * user 右对齐 + 浅墨绿底，assistant 左对齐 + 白底细线；圆角 2px、静止态无阴影，
 * 长文本（含长 URL）自动换行由 .bubble 的 overflow-wrap 兜住。
 */
export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user'
  return (
    <div className={`${s.messageRow} ${isUser ? s.messageRowUser : ''}`}>
      <div className={s.messageMain}>
        <span className={s.messageRole}>{ROLE_LABEL[role]}</span>
        <p className={`${s.bubble} ${isUser ? s.bubbleUser : s.bubbleAssistant}`}>{content}</p>
      </div>
    </div>
  )
}
