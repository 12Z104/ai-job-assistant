import s from './agent.module.css'

export type AgentStepStatus = 'pending' | 'active' | 'done' | 'failed'

export interface AgentStep {
  id: string
  label: string
  status: AgentStepStatus
  /** done 时显示的耗时（毫秒），渲染为如 1.2s */
  durationMs?: number
}

interface StepTimelineProps {
  steps: AgentStep[]
}

const STATUS_TEXT: Record<AgentStepStatus, string> = {
  pending: '等待中',
  active: '进行中',
  done: '已完成',
  failed: '失败',
}

/**
 * L3 领域件：优化 Agent 的步骤时间线（纯展示，无状态）。
 * active 步骤渲染细进度条（width 动画，prefers-reduced-motion 下由 global.css
 * 归零动画时长、直接呈现终值）；done 步骤显示耗时；failed 步骤红色标记。
 */
export function StepTimeline({ steps }: StepTimelineProps) {
  return (
    <ol className={s.timeline}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const markerClass =
          step.status === 'done'
            ? `${s.stepMarker} ${s.stepMarkerDone}`
            : step.status === 'failed'
              ? `${s.stepMarker} ${s.stepMarkerFailed}`
              : step.status === 'active'
                ? `${s.stepMarker} ${s.stepMarkerActive}`
                : s.stepMarker
        const metaClass =
          step.status === 'done'
            ? `${s.stepMeta} ${s.stepMetaDone}`
            : step.status === 'failed'
              ? `${s.stepMeta} ${s.stepMetaFailed}`
              : s.stepMeta
        const durationText =
          step.durationMs !== undefined ? `${(step.durationMs / 1000).toFixed(1)}s` : undefined
        return (
          <li key={step.id} className={`${s.stepRow} ${step.status === 'pending' ? s.stepPending : ''}`}>
            <div className={s.stepMarkerWrap} aria-hidden="true">
              <span className={markerClass} />
              {!isLast && <span className={s.stepLine} />}
            </div>
            <div className={s.stepMain}>
              <div className={s.stepHeader}>
                <span className={s.stepLabel}>{step.label}</span>
                <span className={`${metaClass} num`}>
                  {step.status === 'done' && durationText ? durationText : STATUS_TEXT[step.status]}
                </span>
              </div>
              {step.status === 'active' && (
                <span className={s.stepProgressTrack} aria-hidden="true">
                  <span className={s.stepProgressFill} />
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
