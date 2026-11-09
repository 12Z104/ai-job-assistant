import { useState } from 'react'
import { PageHeader, SplitPane } from '../components/layout'
import { Button, Card, EmptyState, ErrorState, Field, Spinner, Tag, Textarea } from '../components/ui'
import { useStreaming } from '../hooks/useStreaming'
import s from './RewritePage.module.css'

/* ---- 改写强度：切换只改变本地选中态；/api/ai/rewrite 冻结合同暂无 intensity 参数，待合同扩展后接入 ---- */
const INTENSITY_LEVELS = [
  { value: 'conservative', label: '保守' },
  { value: 'balanced', label: '均衡' },
  { value: 'aggressive', label: '激进' },
] as const
type IntensityValue = (typeof INTENSITY_LEVELS)[number]['value']

const SOURCE_MAX = 8_000

/**
 * 智能改写页：左原文编辑 | 右改写结果（流式渲染）。
 * 生成走 useStreaming + POST /api/ai/rewrite（delta.text 累积），
 * 页面只做组装与状态编排，不写 fetch。
 */
export default function RewritePage() {
  const [source, setSource] = useState('')
  const [intensity, setIntensity] = useState<IntensityValue>('balanced')
  const rewrite = useStreaming('/api/ai/rewrite')

  const generating = rewrite.status === 'streaming'
  const hasSource = source.trim().length > 0

  function handleGenerate() {
    if (!hasSource || generating) return
    void rewrite.start({ resumeText: source })
  }

  return (
    <div className={`rise ${s.page}`}>
      <PageHeader title="智能改写" desc="贴入原文，AI 流式输出改写建议" />

      {/* 改写强度：合同尚未定义该参数，本轮仅切换本地选中态 */}
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
                disabled={!hasSource || generating}
                loading={generating}
                onClick={handleGenerate}
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
            {rewrite.status === 'idle' && (
              <EmptyState
                title="还没有改写结果"
                desc={hasSource ? '原文已就绪，点击「生成改写」开始。' : '先在左侧粘贴原文，再生成改写。'}
              />
            )}
            {/* ---- 三态：流式推进中（无增量时先给 Spinner） ---- */}
            {generating &&
              (rewrite.text ? (
                <p className={s.streamText}>{rewrite.text}</p>
              ) : (
                <Spinner label="正在等待模型响应" />
              ))}
            {/* ---- 三态：错误（SSE error 事件 / 网络失败 → code + message + 重试） ---- */}
            {rewrite.status === 'error' && rewrite.error && (
              <ErrorState
                title="改写失败"
                desc={`错误码 ${rewrite.error.code}：${rewrite.error.message}`}
                onRetry={handleGenerate}
              />
            )}
            {/* ---- 三态：完成（纯文本结果；结构化改写项待合同扩展） ---- */}
            {rewrite.status === 'done' && <p className={s.streamText}>{rewrite.text}</p>}
          </Card>
        }
      />
    </div>
  )
}
