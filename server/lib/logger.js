// 结构化日志：每请求输出一行 JSON，方便后续接日志平台做检索
// 行格式：{ time, level, requestId, route, method, status, ms, errorCode, promptVersion, aborted }

function emit(entry) {
  console.log(JSON.stringify({ time: new Date().toISOString(), ...entry }))
}

// 每请求一行：requestId / 端点 / 耗时 / 状态码 / promptVersion / 错误码 / 是否客户端中断
export function logRequest({ requestId, route, method, status, ms, errorCode, promptVersion, aborted }) {
  emit({
    level: 'info',
    kind: 'request',
    requestId,
    route,
    method,
    status,
    ms,
    ...(promptVersion ? { promptVersion } : {}),
    ...(errorCode ? { errorCode } : {}),
    ...(aborted ? { aborted: true } : {}),
  })
}

// 事件级日志：analyze schema 降级记 raw、上游异常等，用 requestId 与请求行关联
export function logEvent({ requestId, event, level = 'warn', raw, message }) {
  emit({
    level,
    kind: 'event',
    requestId,
    event,
    ...(message ? { message } : {}),
    ...(raw !== undefined ? { raw: String(raw).slice(0, 2000) } : {}),
  })
}
