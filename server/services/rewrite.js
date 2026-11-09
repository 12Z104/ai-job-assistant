// 改写任务编排：读 prompt → 拼 messages → 流式转发
import { loadPrompt } from './promptLoader.js'
import { runStream } from './streamPipeline.js'

export const PROMPT_VERSION = 'rewrite.v1'

export async function runRewrite({ resumeText, jdText, requestId, signal, writeEvent }) {
  let system = loadPrompt('rewrite.v1').replace('{{resumeText}}', resumeText)
  if (jdText) system = system.replace('{{#jd}}', '').replace('{{/jd}}', '').replace('{{jdText}}', jdText)
  else system = system.replace(/\{\{#jd\}\}[\s\S]*?\{\{\/jd\}\}/, '')

  const outcome = await runStream({
    messages: [{ role: 'system', content: system }, { role: 'user', content: '请输出改写后的完整简历' }],
    signal,
    requestId,
    promptVersion: PROMPT_VERSION,
    writeEvent,
  })
  if (!outcome) return
  writeEvent(outcome.done)
}
