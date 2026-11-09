/**
 * HTTP 请求封装：全站唯一的 /api 直连出口（Owner Map）。
 * 页面与 feature 禁止出现 fetch('/api/...')；流式请求经 postStream 拿到
 * Response 交给 src/services/sse.ts 解析，非流式请求走 postJson。
 */
import type { ApiEnvelope, ApiErrorBody } from '../types'

/** 类型化 HTTP 错误：携带后端错误合同中的 code，供页面按码分流展示 */
export class HttpError extends Error {
  readonly code: string
  readonly requestId?: string
  readonly details?: unknown

  constructor(code: string, message: string, options?: { requestId?: string; details?: unknown }) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.requestId = options?.requestId
    this.details = options?.details
  }
}

/** 客户端默认超时：docs/ARCHITECTURE.md 5.3（上游 30s，客户端 20s + abort） */
const DEFAULT_TIMEOUT_MS = 20_000

/**
 * 合并外部 signal 与超时计时为一个内部 controller：
 * - 外部 signal 中止 → 内部立即中止
 * - 超时先到 → 以 TIMEOUT 原因中止
 * 清理函数解除监听并停表，避免句柄泄漏。
 */
function linkSignal(external: AbortSignal | undefined, timeoutMs: number): {
  signal: AbortSignal
  dispose: () => void
} {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(new DOMException('请求超时', 'TimeoutError')), timeoutMs)
  const onExternalAbort = () => controller.abort(external?.reason)
  if (external) {
    if (external.aborted) {
      onExternalAbort()
    } else {
      external.addEventListener('abort', onExternalAbort, { once: true })
    }
  }
  return {
    signal: controller.signal,
    dispose: () => {
      window.clearTimeout(timer)
      external?.removeEventListener('abort', onExternalAbort)
    },
  }
}

/** 统一解析失败响应体 {error:{code,message,details}, requestId} 并抛类型化错误 */
async function throwHttpError(response: Response): Promise<never> {
  let code = `HTTP_${response.status}`
  let message = response.statusText || '请求失败'
  let requestId: string | undefined
  let details: unknown
  try {
    const body = (await response.json()) as { error?: ApiErrorBody; requestId?: string }
    if (body.error) {
      code = body.error.code
      message = body.error.message
      details = body.error.details
    }
    requestId = body.requestId
  } catch {
    // 响应体不是 JSON（如网关 502 HTML），保留状态码兜底错误
  }
  throw new HttpError(code, message, { requestId, details })
}

/** 公共请求头：JSON + 游客限流分桶用的设备标识 */
function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', 'x-device-id': getDeviceId() }
}

/* ------------------------------------------------------------------ *
 * 设备标识（deviceId）：仅为游客限流分桶（x-device-id 头），前端生成、
 * 本地持久化；后端缺省按 IP 分桶。绝不作为授权依据（docs/ARCHITECTURE.md 5.4）。
 * ------------------------------------------------------------------ */
const DEVICE_ID_KEY = 'jz.deviceId'

/** 存储不可用（隐私模式等）时的会话级兜底：只活到页面刷新 */
let memoryDeviceId: string | null = null

/** 生成设备标识；非安全上下文没有 crypto.randomUUID 时退化为时间戳随机串（仅用于限流分桶，无安全语义） */
function newDeviceId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}

function getDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    const created = newDeviceId()
    window.localStorage.setItem(DEVICE_ID_KEY, created)
    return created
  } catch {
    memoryDeviceId ??= newDeviceId()
    return memoryDeviceId
  }
}

/**
 * 非流式 POST：成功解析 {data,meta}，失败抛 HttpError。
 * 本期业务端点均为 SSE，此封装服务于健康检查等普通接口与未来非流式场景。
 */
export async function postJson<T>(
  path: string,
  body: unknown,
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<ApiEnvelope<T>> {
  const link = linkSignal(options?.signal, options?.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(body),
      signal: link.signal,
    })
    if (!response.ok) {
      await throwHttpError(response)
    }
    return (await response.json()) as ApiEnvelope<T>
  } catch (err) {
    throw normalizeNetworkError(err)
  } finally {
    link.dispose()
  }
}

/**
 * 流式 POST：发起 SSE 请求，校验非 OK 响应（此时是 JSON 错误体），
 * 成功时把原始 Response 交给上层（useStreaming → sse.ts 解析）。
 */
export async function postStream(
  path: string,
  body: unknown,
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<Response> {
  const link = linkSignal(options?.signal, options?.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(body),
      signal: link.signal,
    })
    if (!response.ok) {
      await throwHttpError(response)
    }
    return response
  } catch (err) {
    link.dispose()
    throw normalizeNetworkError(err)
  }
}

/** 网络层错误归一：超时/中止/断网统一变成带 code 的 HttpError，页面无需感知 DOMException */
function normalizeNetworkError(err: unknown): Error {
  if (err instanceof HttpError) return err
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return new HttpError('TIMEOUT', '请求超时，请稍后重试')
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return err // 用户主动中止：由调用方按取消处理，不当错误
  }
  return new HttpError('NETWORK_ERROR', err instanceof Error ? err.message : '网络异常，请检查连接')
}
