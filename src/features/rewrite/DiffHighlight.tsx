import s from './rewrite.module.css'

/** 改写语气：polish = 润色（绿），suggest = 建议补充（黄）。 */
export type RewriteTone = 'polish' | 'suggest'

/** 段落内的最小渲染单元：普通文本或带改写标记的片段。 */
export interface DiffSegment {
  text: string
  tone: 'plain' | RewriteTone
  /** 所属改写项 id；该 id 被采纳后片段降级为普通文本 */
  itemId?: string
}

/** 改写结果的一段（同一段内两种语气可混排）。 */
export interface RewriteParagraph {
  id: string
  segments: DiffSegment[]
}

interface DiffHighlightProps {
  paragraphs: RewriteParagraph[]
  /** 已处理（采纳或忽略）的改写项 id：对应片段一律按普通文本渲染，避免"拒绝了却还留着高亮" */
  resolvedIds: ReadonlySet<string>
}

/**
 * L3 领域件：把带标记的段落渲染成行内高亮（纯展示，无状态）。
 * polish → --mark-polish（绿，润色）；suggest → --mark-suggest（黄，建议补充）；
 * 高亮 = 行内底色 + 细下划线，采纳后片段降级为普通文本。
 */
export function DiffHighlight({ paragraphs, resolvedIds }: DiffHighlightProps) {
  return (
    <div className={s.diffBody}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.id} className={s.diffParagraph}>
          {paragraph.segments.map((segment, index) => {
            if (segment.tone === 'plain' || !segment.itemId || resolvedIds.has(segment.itemId)) {
              return <span key={index}>{segment.text}</span>
            }
            return (
              <mark
                key={index}
                className={segment.tone === 'polish' ? s.markPolish : s.markSuggest}
              >
                {segment.text}
              </mark>
            )
          })}
        </p>
      ))}
    </div>
  )
}
