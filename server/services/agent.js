// 优化 Agent 编排：读 prompt → 拼 messages → 流式转发（前端展示 4 步思考链）
import { loadPrompt } from './promptLoader.js'
import { runStream } from './streamPipeline.js'

export const PROMPT_VERSION = 'agent.v1'

export async function runAgent({ resumeText, jdText, requestId, signal, writeEvent }) {
  const system = loadPrompt('agent.v1')
    .replace('{{resumeText}}', resumeText)
    .replace('{{jdText}}', jdText)

  const outcome = await runStream({
    messages: [{ role: 'system', content: system }, { role: 'user', content: '请开始分析' }],
    signal,
    requestId,
    promptVersion: PROMPT_VERSION,
    writeEvent,
  })
  if (!outcome) return
  writeEvent(outcome.done)
}
