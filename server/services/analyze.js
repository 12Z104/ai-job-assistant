// 分析任务编排：读 prompt → 拼 messages → 流式调 LLM → 对输出做 schema 校验
// 合同特有：模型按要求输出 JSON；合法则 done 事件附加 result；不合法降级为纯文本 delta，raw 记日志
import { loadPrompt } from './promptLoader.js'
import { runStream } from './streamPipeline.js'
import { logEvent } from '../lib/logger.js'

export const PROMPT_VERSION = 'analyze.v1'

// 从模型输出中提取 JSON（容忍 ```json 围栏和前后杂文字）
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const endIdx = raw.lastIndexOf('}')
  if (start < 0 || endIdx <= start) return null
  try {
    return JSON.parse(raw.slice(start, endIdx + 1))
  } catch {
    return null
  }
}

// schema 校验：score 是数字、三个数组齐全且非空、dimensions 元素带 name/score
function isValidResult(result) {
  return (
    result &&
    typeof result === 'object' &&
    Number.isFinite(result.score) &&
    Array.isArray(result.dimensions) &&
    result.dimensions.length > 0 &&
    result.dimensions.every((d) => d && typeof d.name === 'string' && Number.isFinite(d.score)) &&
    Array.isArray(result.strengths) &&
    Array.isArray(result.gaps) &&
    Array.isArray(result.suggestions) &&
    result.suggestions.length > 0
  )
}

export async function runAnalyze({ resumeText, jdText, requestId, signal, writeEvent }) {
  const system = loadPrompt('analyze.v1')
    .replace('{{resumeText}}', resumeText)
    .replace('{{jdText}}', jdText)

  const outcome = await runStream({
    messages: [{ role: 'system', content: system }],
    signal,
    requestId,
    promptVersion: PROMPT_VERSION,
    // 先缓冲全文：analyze 要先校验 JSON，合法就不该有裸 delta
    bufferText: true,
    writeEvent,
  })
  if (!outcome) return

  const { full, done } = outcome
  const result = extractJson(full)
  if (isValidResult(result)) {
    // 合同：done 事件附加 result 字段（仅 analyze）
    writeEvent({ ...done, result })
  } else {
    // 降级：把原始输出当纯文本 delta 吐给前端，raw 记日志（requestId 关联）以便修 prompt
    logEvent({ requestId, event: 'analyze_schema_invalid', raw: full })
    writeEvent({ type: 'delta', text: full })
    writeEvent(done)
  }
}
