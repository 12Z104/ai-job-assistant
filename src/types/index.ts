export interface Resume {
  id: string
  title: string
  rawContent: string
  modifiedContent?: string
  suggestNotes?: string
  createTime: number
  /** 最近一次写入时间（数据层迁移与多份记录排序用；issue #42 补充，创建时 = createTime） */
  updatedAt: number
}

export interface JobJD {
  id: string
  title: string
  company: string
  rawText: string
  requireSkills: string[]
  createTime: number
  /** 最近一次写入时间（数据层迁移与多份记录排序用；issue #42 补充，创建时 = createTime） */
  updatedAt: number
}

export interface LLMMessage {
  role: 'user' | 'agent'
  content: string
  thinkChain?: string
}

/* ------------------------------------------------------------------ *
 * AI 接口合同（docs/ARCHITECTURE.md 5.3，P0 冻结）
 * 前端只认 type，不感知模型供应商协议。
 * ------------------------------------------------------------------ */

/** HTTP 失败响应体（非 SSE 阶段，如 429/400） */
export interface ApiErrorBody {
  code: string
  message: string
  details?: unknown
}

/** HTTP 成功响应包裹层 */
export interface ApiEnvelope<T> {
  data: T
  meta: { requestId: string }
}

/** SSE meta 事件：请求追踪信息 */
export interface AiMetaEvent {
  type: 'meta'
  requestId: string
  model: string
  promptVersion: string
}

/** SSE delta 事件：增量文本片段 */
export interface AiDeltaEvent {
  type: 'delta'
  text: string
}

/** token 用量 */
export interface AiUsage {
  prompt: number
  completion: number
}

/** SSE done 事件：result 仅 analyze 端点可能携带（模型输出不合法时后端降级为纯文本流，无 result） */
export interface AiDoneEvent<TResult = unknown> {
  type: 'done'
  usage?: AiUsage
  finishReason?: string
  result?: TResult
}

/** SSE error 事件：流中途失败（上游超时、上游错误等） */
export interface AiErrorEvent {
  type: 'error'
  code: string
  message: string
}

/** SSE 统一事件联合（每行 data: {JSON}） */
export type AiEvent<TResult = unknown> =
  | AiMetaEvent
  | AiDeltaEvent
  | AiDoneEvent<TResult>
  | AiErrorEvent

/** 分析端点结构化结果（done.result；后端 schema 校验通过才携带） */
export interface AnalyzeResult {
  score: number
  dimensions: { name: string; score: number }[]
  strengths: string[]
  gaps: string[]
  suggestions: string[]
}
