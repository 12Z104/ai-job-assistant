// SSE 编码器：按统一事件合同输出 data: {...}\n\n
// 前后端唯一约定（ARCHITECTURE 5.3）：
//   meta(requestId/model/promptVersion) → delta(text)*N → done(usage/finishReason[/result]) 或 error(code/message)
// 首事件必须是 meta

// 开始流式响应：设置 SSE 必需的响应头
export function initSse(res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
}

// 写一个统一事件。event 必须带 type 字段
export function writeEvent(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`)
}
