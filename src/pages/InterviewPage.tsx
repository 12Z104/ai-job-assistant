import { useEffect, useRef, useState } from 'react'
import { PageHeader, SplitPane } from '../components/layout'
import { Button, Card, EmptyState, Tag, useToast } from '../components/ui'
import { InterviewComposer, MessageBubble } from '../features/interview'
import type { InterviewMessage } from '../features/interview'
import { useStreaming } from '../hooks/useStreaming'
import s from './InterviewPage.module.css'

const DIRECTIONS = ['前端开发', '后端开发', '算法工程', '产品经理'] as const
type Direction = (typeof DIRECTIONS)[number]

const LEVELS = ['初级', '中级', '高级'] as const
type Level = (typeof LEVELS)[number]

/* 结果条评分为静态示例（/api/ai/interview/summary 不在本期合同范围） */
const RESULT_SCORES = [
  { label: '表达清晰', value: 76 },
  { label: '项目深度', value: 72 },
  { label: '岗位匹配', value: 78 },
]
const RESULT_SUMMARY =
  '回答结构清晰，项目背景与个人动作交代到位；对指标和取舍的追问准备不足，建议补齐量化结果与复盘。'

type PageStatus = 'idle' | 'active' | 'finished'

/**
 * AI 模拟面试页：左 面试设置 | 主区 对话流 + 输入区。
 * 每轮回答走 useStreaming + POST /api/ai/interview/turn：携带全部历史
 * messages（role/content），delta 文本实时渲染为面试官气泡，done 后落为正式消息。
 * 三态：未开始（EmptyState）/ 进行中（消息流 + 输入区）/ 已结束（结果条 + 只读历史）。
 */
export default function InterviewPage() {
  const toast = useToast()
  const [direction, setDirection] = useState<Direction>(DIRECTIONS[0])
  const [level, setLevel] = useState<Level>(LEVELS[1])
  const [status, setStatus] = useState<PageStatus>('idle')
  const [messages, setMessages] = useState<InterviewMessage[]>([])

  const interview = useStreaming('/api/ai/interview/turn')
  const sending = interview.status === 'streaming'

  /** 本轮回答是否待落袋：done 后把累积文本固化为一条 assistant 消息 */
  const turnPendingRef = useRef(false)
  /** 消息自增序号：只保证会话内唯一，不参与持久化 */
  const seqRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  /* 新消息 / 流式增量出现后滚到底部（用户上滑时不做反向抢滚动） */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, interview.text])

  /* 回合终态收口：done → 追加面试官消息；error → toast 提示，不落半截消息 */
  useEffect(() => {
    if (!turnPendingRef.current) return
    if (interview.status === 'done') {
      turnPendingRef.current = false
      if (interview.text) {
        seqRef.current += 1
        const content = interview.text
        setMessages((prev) => [...prev, { id: `msg-${seqRef.current}`, role: 'assistant', content }])
      }
    } else if (interview.status === 'error' && interview.error) {
      turnPendingRef.current = false
      toast.error(`错误码 ${interview.error.code}：${interview.error.message}`)
    }
  }, [interview.status, interview.text, interview.error, toast])

  function nextId(): string {
    seqRef.current += 1
    return `msg-${seqRef.current}`
  }

  /** 开始面试：messages 为空发起首轮，AI 流式输出开场问题 */
  function handleStart() {
    setMessages([])
    setStatus('active')
    turnPendingRef.current = true
    void interview.start({ resumeText: '', jdText: '', messages: [] })
  }

  /** 回答并请求下一轮追问：携带全部历史 messages，保持多轮上下文 */
  function handleSend(content: string) {
    if (status !== 'active' || sending) return
    const userMessage: InterviewMessage = { id: nextId(), role: 'user', content }
    const history = [...messages, userMessage]
    setMessages(history)
    turnPendingRef.current = true
    void interview.start({
      resumeText: '',
      jdText: '',
      messages: history.map((message) => ({ role: message.role, content: message.content })),
    })
  }

  function handleFinish() {
    if (sending) interview.stop()
    turnPendingRef.current = false
    setStatus('finished')
  }

  /* 进行中锁定设置：方向/难度是出题参数，中途改动会让历史问题语义错位 */
  const locked = status === 'active'

  return (
    <div className={`rise ${s.page}`}>
      <PageHeader title="AI 模拟面试" desc="选定岗位方向与难度，多轮追问，结束后输出综合点评" />

      <SplitPane
        left={
          <Card title="面试设置">
            <div className={s.settingStack}>
              <div className={s.settingGroup}>
                <span className={s.settingLabel}>岗位方向</span>
                <div className={s.tagWrap}>
                  {DIRECTIONS.map((item) => (
                    <Tag
                      key={item}
                      tone={direction === item ? 'polish' : 'neutral'}
                      onClick={() => {
                        if (!locked) setDirection(item)
                      }}
                    >
                      {item}
                    </Tag>
                  ))}
                </div>
              </div>

              <div className={s.settingGroup}>
                <span className={s.settingLabel}>难度</span>
                <div className={s.tagWrap}>
                  {LEVELS.map((item) => (
                    <Tag
                      key={item}
                      tone={level === item ? 'polish' : 'neutral'}
                      onClick={() => {
                        if (!locked) setLevel(item)
                      }}
                    >
                      {item}
                    </Tag>
                  ))}
                </div>
              </div>

              <div className={s.settingActions}>
                <Button type="primary" disabled={locked} onClick={handleStart}>
                  {status === 'finished' ? '重新开始' : '开始面试'}
                </Button>
                <Button disabled={!locked} onClick={handleFinish}>
                  结束面试
                </Button>
              </div>

              <span className={s.hint}>
                {locked
                  ? `进行中：${direction} · ${level}，设置已锁定`
                  : '岗位方向与难度暂未进入请求合同，扩展后作为出题参数'}
              </span>
            </div>
          </Card>
        }
        center={
          <Card title="面试对话">
            {/* ---- 三态：未开始 ---- */}
            {status === 'idle' && (
              <EmptyState
                title="还没有开始面试"
                desc="在左侧选好岗位方向与难度，点击「开始面试」。"
              />
            )}

            {/* ---- 三态：进行中 / 已结束 ---- */}
            {status !== 'idle' && (
              <div className={s.chatStack}>
                {status === 'finished' && (
                  <div className={s.resultBar}>
                    <div className={s.scoreRow}>
                      {RESULT_SCORES.map((item) => (
                        <div key={item.label} className={s.scoreItem}>
                          <span className={`${s.scoreValue} num`}>{item.value}</span>
                          <span className={s.scoreLabel}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className={s.resultSummary}>{RESULT_SUMMARY}</p>
                    <span className={s.resultNote}>
                      以上评分为静态示例，综合点评接口（interview/summary）待后续接入。
                    </span>
                  </div>
                )}

                <div className={s.chatScroll} ref={scrollRef}>
                  <ol className={s.messageList}>
                    {messages.map((message) => (
                      <li key={message.id}>
                        <MessageBubble role={message.role} content={message.content} />
                      </li>
                    ))}
                    {/* 流式回合：增量文本实时渲染为面试官气泡；首 token 未到先给占位 */}
                    {sending && interview.text && (
                      <li>
                        <MessageBubble role="assistant" content={interview.text} />
                      </li>
                    )}
                    {sending && !interview.text && <li className={s.pendingRow}>面试官正在思考…</li>}
                  </ol>
                </div>

                {status === 'active' ? (
                  <InterviewComposer sending={sending} onSend={handleSend} />
                ) : (
                  <span className={s.closedHint}>面试已结束，可在左侧重新开始一轮。</span>
                )}
              </div>
            )}
          </Card>
        }
      />
    </div>
  )
}
