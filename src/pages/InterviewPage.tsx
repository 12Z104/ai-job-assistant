import { useEffect, useRef, useState } from 'react'
import { PageHeader, SplitPane } from '../components/layout'
import { Button, Card, EmptyState, Tag } from '../components/ui'
import { InterviewComposer, MessageBubble } from '../features/interview'
import type { InterviewMessage } from '../features/interview'
import s from './InterviewPage.module.css'

/* ------------------------------------------------------------------ *
 * 面试问题为静态示例：P4 接 SSE 后改为
 * 「开始面试 → POST /api/interview/start 拉首题」「每轮回答 → useStreaming
 * 订阅 /api/interview/answer 的追问流」。此处只用定时器模拟追问节奏，
 * 不伪造任何接口调用。
 * ------------------------------------------------------------------ */
const DIRECTIONS = ['前端开发', '后端开发', '算法工程', '产品经理'] as const
type Direction = (typeof DIRECTIONS)[number]

const LEVELS = ['初级', '中级', '高级'] as const
type Level = (typeof LEVELS)[number]

const OPENING_QUESTION =
  '你好，我是本次的面试官。先做个自我介绍吧：挑一段你最有成就感的项目经历，说清背景、你的动作和最终结果。'

/* 三条预置追问，按轮次轮流取用 */
const FOLLOW_UPS: readonly string[] = [
  '这个项目里最大的技术难点是什么？你是怎么定位并解决的？',
  '如果让你重做一次，你会改动哪一步？为什么？',
  '你提到的优化有前后指标对比吗？具体是怎么测出来的？',
]
const FALLBACK_PROBE = '能再具体说说你在这个环节的做法吗？'

/** 追问模拟延迟：P4 换成流式首 token 到达时间 */
const REPLY_DELAY_MS = 800

/* 结果条评分为静态示例，P4 由真实点评接口返回 */
const RESULT_SCORES = [
  { label: '表达清晰', value: 76 },
  { label: '项目深度', value: 72 },
  { label: '岗位匹配', value: 78 },
]
const RESULT_SUMMARY =
  '回答结构清晰，项目背景与个人动作交代到位；对指标和取舍的追问准备不足，建议补齐量化结果与复盘。'

type PageStatus = 'idle' | 'active' | 'finished'

function pickFollowUp(index: number): string {
  return FOLLOW_UPS[index % FOLLOW_UPS.length] ?? FALLBACK_PROBE
}

/**
 * AI 模拟面试页：左 面试设置 | 主区 对话流 + 输入区。
 * 三态：未开始（EmptyState）/ 进行中（消息流 + 输入区）/ 已结束（结果条 + 只读历史）。
 * 页面只做组装与本地状态编排，不落库、不接真实接口（P4）。
 */
export default function InterviewPage() {
  const [direction, setDirection] = useState<Direction>(DIRECTIONS[0])
  const [level, setLevel] = useState<Level>(LEVELS[1])
  const [status, setStatus] = useState<PageStatus>('idle')
  const [messages, setMessages] = useState<InterviewMessage[]>([])
  const [sending, setSending] = useState(false)

  /** 追问模拟定时器：卸载与重新开始时统一清理 */
  const timersRef = useRef<number[]>([])
  /** 追问轮次游标 */
  const followUpRef = useRef(0)
  /** 消息自增序号：只保证会话内唯一，不参与持久化 */
  const seqRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  /* 新消息 / 追问提示出现后滚到底部（用户上滑时不做反向抢滚动） */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, sending])

  function nextId(): string {
    seqRef.current += 1
    return `msg-${seqRef.current}`
  }

  function clearTimers() {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }

  function handleStart() {
    clearTimers()
    followUpRef.current = 0
    setSending(false)
    setMessages([{ id: nextId(), role: 'assistant', content: OPENING_QUESTION }])
    setStatus('active')
  }

  function handleSend(content: string) {
    if (status !== 'active' || sending) return
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', content }])
    setSending(true)

    const timer = window.setTimeout(() => {
      const question = pickFollowUp(followUpRef.current)
      followUpRef.current += 1
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: question }])
      setSending(false)
    }, REPLY_DELAY_MS)
    timersRef.current.push(timer)
  }

  function handleFinish() {
    clearTimers()
    setSending(false)
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
                  : 'P4 接入后，岗位方向与难度将作为出题参数'}
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
                      以上评分为静态示例，P4 接入真实点评后由接口返回。
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
                    {sending && <li className={s.pendingRow}>面试官正在追问…</li>}
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
