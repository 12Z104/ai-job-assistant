import { useState } from 'react'
import { PageHeader, SplitPane } from '../components/layout'
import { Button, Card, EmptyState, ErrorState, Field, Spinner, Textarea } from '../components/ui'
import { StepTimeline } from '../features/agent'
import type { AgentStep, AgentStepStatus } from '../features/agent'
import { useStreaming } from '../hooks/useStreaming'
import s from './AgentPage.module.css'

const INITIAL_STEPS: AgentStep[] = [
  { id: 'parse-jd', label: '解析 JD', status: 'pending' },
  { id: 'extract', label: '提取素材', status: 'pending' },
  { id: 'gaps', label: '识别短板', status: 'pending' },
  { id: 'plan', label: '输出修改方案', status: 'pending' },
]

/* 流生命周期 → 时间线状态：渲染期派生，不落地成 state（真实事件驱动，无定时器模拟） */
const STATUS_BY_STREAM: Record<string, AgentStepStatus> = {
  idle: 'pending',
  streaming: 'active',
  done: 'done',
  error: 'failed',
}

const RESUME_MAX = 4_000
const JD_MAX = 4_000

/**
 * 简历优化 Agent 页：左 输入（简历 + JD 摘要）| 中 步骤时间线 | 右 方案输出。
 * 生成走 useStreaming + POST /api/ai/agent：流式推进整体驱动时间线
 * （合同暂无分步事件，四步作为单一执行阶段整体 active → done，见报告遗留项）。
 */
export default function AgentPage() {
  const [resumeSummary, setResumeSummary] = useState('')
  const [jdSummary, setJdSummary] = useState('')
  const agent = useStreaming('/api/ai/agent')

  const running = agent.status === 'streaming'
  /* 时间线状态直接由流状态派生：无需 setState-in-effect */
  const timelineStatus = STATUS_BY_STREAM[agent.status] ?? 'pending'
  const steps: AgentStep[] = INITIAL_STEPS.map((step) => ({ ...step, status: timelineStatus }))

  function handleStart() {
    if (running) return
    void agent.start({ resumeText: resumeSummary, jdText: jdSummary })
  }

  const canStart =
    resumeSummary.trim().length > 0 && jdSummary.trim().length > 0 && !running

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
                <Button type="primary" disabled={!canStart} loading={running} onClick={handleStart}>
                  {running ? '优化进行中…' : '开始优化'}
                </Button>
                <span className={s.hint}>填写简历与 JD 摘要后开始，完成后输出修改方案</span>
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
            {agent.status === 'idle' && (
              <EmptyState
                title="还没有优化方案"
                desc="在左侧填入简历与 JD 摘要，点击「开始优化」。"
              />
            )}
            {/* ---- 三态：流式推进中（无增量时先给 Spinner） ---- */}
            {running &&
              (agent.text ? (
                <p className={s.streamText}>{agent.text}</p>
              ) : (
                <Spinner label="正在等待模型响应" />
              ))}
            {/* ---- 三态：错误（SSE error 事件 / 网络失败 → code + message + 重试） ---- */}
            {agent.status === 'error' && agent.error && (
              <ErrorState
                title="优化中断"
                desc={`错误码 ${agent.error.code}：${agent.error.message}`}
                onRetry={handleStart}
              />
            )}
            {/* ---- 三态：完成（流式方案文本） ---- */}
            {agent.status === 'done' && <p className={s.streamText}>{agent.text}</p>}
          </Card>
        }
      />
    </div>
  )
}
