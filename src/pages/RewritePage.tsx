import { useMemo, useState } from 'react'
import { PageHeader, SplitPane } from '../components/layout'
import { Button, Card, EmptyState, ErrorState, Field, Skeleton, Tag, Textarea } from '../components/ui'
import { DiffHighlight } from '../features/rewrite'
import type { RewriteParagraph, RewriteTone } from '../features/rewrite'
import s from './RewritePage.module.css'

/* ------------------------------------------------------------------ *
 * 改写结果静态示例：P4 接 /api/rewrite 后替换为真实返回。
 * 本区块为纯展示示例，不伪造接口调用。
 * ------------------------------------------------------------------ */
const SAMPLE_ITEMS: { id: string; tone: RewriteTone; title: string; desc: string }[] = [
  {
    id: 'item-quantify',
    tone: 'polish',
    title: '量化项目成果',
    desc: '把职责式描述改为可度量指标，突出个人贡献。',
  },
  {
    id: 'item-add-ts',
    tone: 'suggest',
    title: '补充 TypeScript 关键词',
    desc: 'JD 明确要求 TypeScript，建议在技能描述中补充实战经验。',
  },
  {
    id: 'item-tighten',
    tone: 'polish',
    title: '压缩自我评价',
    desc: '自我评价偏长，压缩为一行并保留核心标签。',
  },
]

const SAMPLE_PARAGRAPHS: RewriteParagraph[] = [
  {
    id: 'p-1',
    segments: [
      { text: '负责订单中心模块开发，', tone: 'plain' },
      {
        text: '主导 3 个核心模块的设计与落地，接口平均响应时间由 800ms 优化至 200ms',
        tone: 'polish',
        itemId: 'item-quantify',
      },
      { text: '。', tone: 'plain' },
    ],
  },
  {
    id: 'p-2',
    segments: [
      { text: '熟悉 React 与 Node.js，', tone: 'plain' },
      {
        text: '掌握 TypeScript 并有中大型项目的工程化落地经验（建议补充 JD 关键词）',
        tone: 'suggest',
        itemId: 'item-add-ts',
      },
      { text: '。', tone: 'plain' },
    ],
  },
  {
    id: 'p-3',
    segments: [
      { text: '自我评价：', tone: 'plain' },
      {
        text: '学习能力强的全栈型前端，擅长性能优化与工程化建设',
        tone: 'polish',
        itemId: 'item-tighten',
      },
      { text: '。', tone: 'plain' },
    ],
  },
]

/* ---- 改写强度：切换只改变本地选中态，P4 接口后才作为参数影响生成 ---- */
const INTENSITY_LEVELS = [
  { value: 'conservative', label: '保守' },
  { value: 'balanced', label: '均衡' },
  { value: 'aggressive', label: '激进' },
] as const
type IntensityValue = (typeof INTENSITY_LEVELS)[number]['value']

const SOURCE_MAX = 8_000
/** mock 生成延迟 */
const GENERATE_DELAY_MS = 900
/** mock 失败概率：错误态由 mock 真实抛错触发（try/catch），不是手动画出来的 */
const MOCK_FAIL_RATE = 0.2

type PageStatus = 'idle' | 'loading' | 'done' | 'error'

/** P4 前的 mock 生成函数：正常成功，按小概率抛错以驱动真实错误态 */
async function mockGenerateRewrite(): Promise<RewriteParagraph[]> {
  await new Promise((resolve) => setTimeout(resolve, GENERATE_DELAY_MS))
  if (Math.random() < MOCK_FAIL_RATE) {
    throw new Error('改写服务暂时不可用，请重试')
  }
  return SAMPLE_PARAGRAPHS
}

/**
 * 智能改写页：左原文编辑 | 右改写结果（行内高亮 + 逐条采纳）。
 * 页面只做组装与本地状态编排，不落库、不接真实接口（P4）。
 */
export default function RewritePage() {
  const [source, setSource] = useState('')
  const [intensity, setIntensity] = useState<IntensityValue>('balanced')
  const [status, setStatus] = useState<PageStatus>('idle')
  const [paragraphs, setParagraphs] = useState<RewriteParagraph[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [acceptedIds, setAcceptedIds] = useState<ReadonlySet<string>>(new Set())
  const [ignoredIds, setIgnoredIds] = useState<ReadonlySet<string>>(new Set())

  const hasSource = source.trim().length > 0
  /* 已处理集合 = 采纳 ∪ 忽略：两类操作都让对应高亮降级，避免拒绝后仍留标记 */
  const resolvedIds = useMemo(
    () => new Set<string>([...acceptedIds, ...ignoredIds]),
    [acceptedIds, ignoredIds],
  )
  const pendingItems = SAMPLE_ITEMS.filter(
    (item) => !acceptedIds.has(item.id) && !ignoredIds.has(item.id),
  )

  async function handleGenerate() {
    if (!hasSource) return
    setStatus('loading')
    setError(null)
    setParagraphs(null)
    setAcceptedIds(new Set())
    setIgnoredIds(new Set())
    try {
      const result = await mockGenerateRewrite()
      setParagraphs(result)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
      setStatus('error')
    }
  }

  function handleAccept(id: string) {
    // 采纳：该改写项对应的高亮片段降级为普通文本（纯本地态，不落库）
    setAcceptedIds((prev) => new Set(prev).add(id))
  }

  function handleIgnore(id: string) {
    setIgnoredIds((prev) => new Set(prev).add(id))
  }

  return (
    <div className={`rise ${s.page}`}>
      <PageHeader title="智能改写" desc="贴入原文，AI 输出绿标润色与黄标建议，逐条采纳" />

      {/* 改写强度：本轮仅切换选中态，不触发任何请求 */}
      <div className={s.toolbar}>
        <span className={s.toolbarLabel}>改写强度</span>
        <div className={s.toolbarTags}>
          {INTENSITY_LEVELS.map((level) => (
            <Tag
              key={level.value}
              tone={intensity === level.value ? 'polish' : 'neutral'}
              onClick={() => setIntensity(level.value)}
            >
              {level.label}
            </Tag>
          ))}
        </div>
      </div>

      <SplitPane
        left={
          <Card title="原文">
            <Field label="待改写文本" hint={`${source.length}/${SOURCE_MAX}`}>
              <Textarea
                rows={12}
                value={source}
                maxLength={SOURCE_MAX}
                placeholder="粘贴需要改写的简历段落或自我评价…"
                onChange={(event) => setSource(event.target.value)}
              />
            </Field>
            <div className={s.editorActions}>
              <Button
                type="primary"
                disabled={!hasSource}
                loading={status === 'loading'}
                onClick={() => void handleGenerate()}
              >
                生成改写
              </Button>
              {!hasSource && <span className={s.resolvedHint}>先在上方粘贴原文</span>}
            </div>
          </Card>
        }
        center={
          <Card title="改写结果">
            {/* ---- 三态：空（无原文 / 尚未生成） ---- */}
            {status === 'idle' && (
              <EmptyState
                title="还没有改写结果"
                desc={hasSource ? '原文已就绪，点击「生成改写」开始。' : '先在左侧粘贴原文，再生成改写。'}
              />
            )}
            {/* ---- 三态：加载（mock 生成中） ---- */}
            {status === 'loading' && <Skeleton active title paragraph={{ rows: 6 }} />}
            {/* ---- 三态：错误（mock 抛错 → try/catch 真实进入此分支） ---- */}
            {status === 'error' && (
              <ErrorState
                title="改写失败"
                desc={error ?? undefined}
                onRetry={() => void handleGenerate()}
              />
            )}
            {status === 'done' && paragraphs && (
              <>
                <div className={s.legend}>
                  <span className={s.legendItem}>
                    <span className={`${s.legendSwatch} ${s.legendSwatchPolish}`} aria-hidden="true" />
                    绿标 = 润色
                  </span>
                  <span className={s.legendItem}>
                    <span className={`${s.legendSwatch} ${s.legendSwatchSuggest}`} aria-hidden="true" />
                    黄标 = 建议补充
                  </span>
                </div>
                <DiffHighlight paragraphs={paragraphs} resolvedIds={resolvedIds} />
                <div className={s.divider} />
                <span className="section-title">改写项（{pendingItems.length}）</span>
                <div className={s.itemsStack}>
                  {pendingItems.map((item) => (
                    <div key={item.id} className={s.itemRow}>
                      <span
                        className={`${s.itemDot} ${item.tone === 'polish' ? s.itemDotPolish : s.itemDotSuggest}`}
                        aria-hidden="true"
                      />
                      <div className={s.itemMain}>
                        <span className={s.itemTitle}>{item.title}</span>
                        <span className={s.itemDesc}>{item.desc}</span>
                      </div>
                      <div className={s.itemActions}>
                        <Button size="small" type="primary" onClick={() => handleAccept(item.id)}>
                          采纳
                        </Button>
                        <Button size="small" onClick={() => handleIgnore(item.id)}>
                          忽略
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingItems.length === 0 && (
                    <span className={s.resolvedHint}>所有改写项已处理完毕。</span>
                  )}
                </div>
              </>
            )}
          </Card>
        }
      />
    </div>
  )
}
