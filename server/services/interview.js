// 模拟面试编排：turn（多轮追问）与 summary（面试结束综合点评）
import { loadPrompt } from './promptLoader.js'
import { runStream } from './streamPipeline.js'

export const PROMPT_VERSION_TURN = 'interview-turn.v1'
export const PROMPT_VERSION_SUMMARY = 'interview-summary.v1'

// 面试单轮：历史 messages 已通过校验（role ∈ user/assistant），拼上简历/JD 系统提示
// resumeText/jdText 允许空串（面试页无输入源）：空值注入兜底文案，避免面试官对着空素材胡编
export async function runInterviewTurn({ resumeText, jdText, messages, requestId, signal, writeEvent }) {
  const system = loadPrompt('interview-turn.v1')
    .replace('{{resumeText}}', resumeText || '（候选人未提供简历，请从通用前端基础问题开始）')
    .replace('{{jdText}}', jdText || '（未提供岗位JD，可按通用前端开发岗位考察）')

  const outcome = await runStream({
    messages: [{ role: 'system', content: system }, ...messages],
    signal,
    requestId,
    promptVersion: PROMPT_VERSION_TURN,
    writeEvent,
  })
  if (!outcome) return
  writeEvent(outcome.done)
}

// 面试总结：只有对话记录，输出综合点评
export async function runInterviewSummary({ messages, requestId, signal, writeEvent }) {
  const transcript = messages.map((m) => `${m.role === 'user' ? '候选人' : '面试官'}: ${m.content}`).join('\n\n')
  const system = loadPrompt('interview-summary.v1').replace('{{transcript}}', transcript)

  const outcome = await runStream({
    messages: [{ role: 'system', content: system }],
    signal,
    requestId,
    promptVersion: PROMPT_VERSION_SUMMARY,
    writeEvent,
  })
  if (!outcome) return
  writeEvent(outcome.done)
}
