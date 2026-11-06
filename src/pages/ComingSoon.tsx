import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui'

interface ComingSoonProps {
  title: string
  desc: string
  stage: string
}

/**
 * P1 占位页骨架：P3 迁移真实业务前的统一占位。
 * 只陈述事实与去向，不写假数据。
 */
export function ComingSoon({ title, desc, stage }: ComingSoonProps) {
  return (
    <div className="rise" style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: 'var(--space-6) var(--space-5) var(--space-7)' }}>
      <PageHeader title={title} desc={desc} />
      <EmptyState
        title="功能迁移中"
        desc={`此页面将在后续阶段迁入新骨架（${stage}）。当前为 P1 应用壳占位，数据与交互未接入。`}
      />
    </div>
  )
}
