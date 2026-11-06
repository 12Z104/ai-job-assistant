import { useEffect, useRef, useState } from 'react'
import { PageHeader, SplitPane } from '../components/layout'
import { Button, Card, EmptyState, ErrorState, Field, Skeleton, Textarea } from '../components/ui'
import { StepTimeline } from '../features/agent'
import type { AgentStep } from '../features/agent'
import s from './AgentPage.module.css'

/* ------------------------------------------------------------------ *
 * 修改方案静态示例：P4 接 SSE 流式接口后替换为真实输出。
 * 本区块为纯展示示例，不伪造接口调用。
 * ------------------------------------------------------------------ */
const SAMPLE_ADVICE = [
  {
    title: '项目一补充量化指标',
    desc: '订单中心项目只写了职责，建议补充 QPS、响应时间、崩溃率等可度量成果。',
  },
  {
    title: '技能栏对齐 JD 关键词',
    desc: 'JD 要求 TypeScript 与单元测试，技能栏目前均未出现，建议补充实战证据。',
  },
  {
    title: '自我评价压缩为一行',
    desc: '现有自我评价 5 行偏长，建议压缩为一行，保留「前端 + 性能优化」核心标签。',
  },
]

const INITIAL_STEPS: AgentStep[] = [
  { id: 'parse-jd', label: '解析 JD', status: 'pending' },
  { id: 'extract', label: '提取素材', status: 'pending' },
  { id: 'gaps', label: '识别短板', status: 'pending' },
  { id: 'plan', label: '输出修改方案', status: 'pending' },
]

/** 每步推进间隔（交互模拟节奏） */
const STEP_MS = 700
/** mock 失败注入：识别短板一步按小概率失败，驱动真实错误态（时间线 failed + 右栏 ErrorState） */
const FAIL_STEP_INDEX = 2
const FAIL_RATE = 0.15

const RESUME_MAX = 4_000
const JD_MAX = 4_000

type RunStatus = 'idle' | 'running' | 'done' | 'failed'

/**
 * 简历优化 Agent 页：左 输入（简历 + JD 摘要）| 中 步骤时间线 | 右 方案输出。
 *
 * 注意：四步推进是 P4 接 SSE 之前的交互模拟——用 setTimeout 依次推进时间线状态，
 * 不伪造任何接口调用；P4 将由 useStreaming + /api/optimize 的真实事件驱动同一时间线。
 */
export default function AgentPage() {
  const [resumeSummary, setResumeSummary] = useState('')
  const [jdSummary, setJdSummary] = useState('')
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_STEPS)
  const [status, setStatus] = useState<RunStatus>('idle')

  /* 模拟定时器：卸载时统一清理，避免泄漏 */
  const timersRef = useRef<number[]>([])
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  function handleStart() {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
    setStatus('running')
    setSteps(INITIAL_STEPS.map((step) => ({ ...step, status: 'pending' as const })))

    /** 依次推进第 index 步：active → (700ms) → done/failed，再推进下一步 */
    const advance = (index: number) => {
      setSteps((prev) =>
        prev.map((step, i) => (i === index ? { ...step, status: 'active' as const } : step)),
      )
      const timer = window.setTimeout(() => {
        if (index === FAIL_STEP_INDEX && Math.random() < FAIL_RATE) {
          setSteps((prev) =>
            prev.map((step, i) => (i === index ? { ...step, status: 'failed' as const } : step)),
          )
          setStatus('failed')
          return
        }
        const durationMs = 500 + Math.round(Math.random() * 700)
        setSteps((prev) =>
          prev.map((step, i) =>
            i === index ? { ...step, status: 'done' as const, durationMs } : step,
          ),
        )
        if (index + 1 < INITIAL_STEPS.length) {
          advance(index + 1)
        } else {
          setStatus('done')
        }
      }, STEP_MS)
      timersRef.current.push(timer)
    }
    advance(0)
  }

  const canStart = status !== 'running'

  return (
    <div className={`rise ${s.page}`}>
      <PageHeader
        title="简历优化 Agent"
        desc="简历 + JD，Agent 依次解析、提取、诊断，输出修改方案"
      />

      <SplitPane
        left={
          <Card title="输入">
            <div className={s.leftStack}>
              <Field label="简历摘要" hint={`${resumeSummary.length}/${RESUME_MAX}`}>
                <Textarea
                  rows={7}
                  value={resumeSummary}
                  maxLength={RESUME_MAX}
                  placeholder="粘贴简历关键内容（项目经历、技能、自我评价）…"
                  onChange={(event) => setResumeSummary(event.target.value)}
                />
              </Field>
              <Field label="JD 摘要" hint={`${jdSummary.length}/${JD_MAX}`}>
                <Textarea
                  rows={7}
                  value={jdSummary}
                  maxLength={JD_MAX}
                  placeholder="粘贴目标职位 JD 的核心要求…"
                  onChange={(event) => setJdSummary(event.target.value)}
                />
              </Field>
              <div className={s.leftActions}>
                <Button type="primary" disabled={!canStart} onClick={handleStart}>
                  {status === 'running' ? '优化进行中…' : '开始优化'}
                </Button>
                <span className={s.hint}>四步依次执行，完成后输出修改方案</span>
              </div>
            </div>
          </Card>
        }
        center={
          <Card title="执行进度">
            <StepTimeline steps={steps} />
          </Card>
        }
        right={
          <Card title="修改方案">
            {/* ---- 三态：空（尚未开始） ---- */}
            {status === 'idle' && (
              <EmptyState
                title="还没有优化方案"
                desc="在左侧填入简历与 JD 摘要，点击「开始优化」。"
              />
            )}
            {/* ---- 三态：加载（时间线推进中） ---- */}
            {status === 'running' && <Skeleton active title paragraph={{ rows: 4 }} />}
            {/* ---- 三态：错误（mock 步骤失败 → 真实进入此分支） ---- */}
            {status === 'failed' && (
              <ErrorState
                title="优化中断"
                desc="「识别短板」一步执行失败，可重试。"
                onRetry={handleStart}
              />
            )}
            {status === 'done' && (
              <ul className={s.adviceList}>
                {SAMPLE_ADVICE.map((advice) => (
                  <li key={advice.title} className={s.adviceItem}>
                    <span className={s.adviceTitle}>{advice.title}</span>
                    <span className={s.adviceDesc}>{advice.desc}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        }
      />
    </div>
  )
}
