/**
 * features/rewrite 唯一对外出口。
 * 其他域与 pages 只允许从这里 import，禁止深路径。
 */
export { DiffHighlight } from './DiffHighlight'
export type { DiffSegment, RewriteParagraph, RewriteTone } from './DiffHighlight'
