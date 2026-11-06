import { PageHeader, SplitPane } from '../components/layout'
import { Card, EmptyState } from '../components/ui'

/**
 * 匹配分析页（P1 占位）：验证三栏工作台骨架可用。
 * 左：简历列表（P2 接 repository）；中：简历/JD 输入（P3 迁入）；右：匹配结果（P3 迁入）。
 */
export default function MatchPage() {
  return (
    <div
      className="rise"
      style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: 'var(--space-6) var(--space-5) var(--space-7)' }}
    >
      <PageHeader
        title="简历匹配分析"
        desc="贴简历 + JD，AI 输出结构化打分、亮点、差距与建议"
      />
      <SplitPane
        left={
          <Card title="我的简历">
            <EmptyState title="简历列表" desc="多份简历管理将在 P2 随 repository 数据层接入（issue #36）。" />
          </Card>
        }
        center={
          <Card title="简历与 JD">
            <EmptyState title="输入区" desc="简历与 JD 的粘贴、选择与校验将在 P3 迁入（issue #37）。" />
          </Card>
        }
        right={
          <Card title="匹配结果">
            <EmptyState title="分析结果" desc="结构化打分与 ScoreRing 可视化将在 P3 迁入（issue #37）。" />
          </Card>
        }
      />
    </div>
  )
}
