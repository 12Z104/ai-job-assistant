import { describe, expect, it } from 'vitest'
import { consumeSseStream } from './sse'

/** 把字符串编码为 Uint8Array，构造 ReadableStream 模拟服务端下发 */
function streamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
}

/** 收集四类事件的简易记录器 */
function createRecorder() {
  const events: { kind: string; payload: unknown }[] = []
  return {
    events,
    handlers: {
      onMeta: (e: unknown) => events.push({ kind: 'meta', payload: e }),
      onDelta: (e: { text: string }) => events.push({ kind: 'delta', payload: e }),
      onDone: (e: unknown) => events.push({ kind: 'done', payload: e }),
      onError: (e: unknown) => events.push({ kind: 'error', payload: e }),
    },
  }
}

describe('consumeSseStream（SSE 解析合同）', () => {
  it('正常完整流：meta/delta/done 依次分发，delta 文本按序拼接', async () => {
    const { events, handlers } = createRecorder()
    const stream = streamFromChunks([
      'data: {"type":"meta","requestId":"r-1","model":"deepseek-chat","promptVersion":"analyze.v1"}\n',
      'data: {"type":"delta","text":"匹配"}\n',
      'data: {"type":"delta","text":"度良好"}\n',
      'data: {"type":"done","usage":{"prompt":812,"completion":430},"finishReason":"stop"}\n',
    ])

    await consumeSseStream(stream, handlers)

    expect(events.map((e) => e.kind)).toEqual(['meta', 'delta', 'delta', 'done'])
    const deltas = events.filter((e) => e.kind === 'delta') as { payload: { text: string } }[]
    expect(deltas.map((e) => e.payload.text).join('')).toBe('匹配度良好')
    const done = events[3]!.payload as { usage: { prompt: number } }
    expect(done.usage.prompt).toBe(812)
  })

  it('跨 chunk 切割：一个事件被切在两个 chunk 中间也能完整解析', async () => {
    const { events, handlers } = createRecorder()
    // 同一行 data 事件被拦腰切开，甚至把 JSON 的中文字符也切开
    const stream = streamFromChunks([
      'data: {"type":"delta","te',
      'xt":"匹',
      '配"}\ndata: {"type":"error","code":"UPSTREAM_TIMEOUT","message":"模型响应超时"}\n',
    ])

    await consumeSseStream(stream, handlers)

    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ kind: 'delta', payload: { text: '匹配' } })
    expect(events[1]).toMatchObject({ kind: 'error', payload: { code: 'UPSTREAM_TIMEOUT' } })
  })

  it('error 事件分发 onError；done.result 透传给调用方', async () => {
    const { events, handlers } = createRecorder()
    const result = { score: 78, dimensions: [], strengths: [], gaps: [], suggestions: [] }
    const stream = streamFromChunks([
      'data: {"type":"error","code":"UPSTREAM_ERROR","message":"上游异常"}\n',
      '',
      'data: {"type":"done","finishReason":"stop","result":' + JSON.stringify(result) + '}\n',
    ])

    await consumeSseStream(stream, handlers)

    expect(events[0]).toMatchObject({ kind: 'error', payload: { code: 'UPSTREAM_ERROR' } })
    expect(events[1]).toMatchObject({ kind: 'done', payload: { result: result } })
  })

  it('防御性：坏 JSON 行与未知 type 被跳过，不中断后续事件；[DONE] 哨兵忽略', async () => {
    const { events, handlers } = createRecorder()
    const stream = streamFromChunks([
      'data: {oops\n',
      'data: [DONE]\n',
      ': keep-alive comment\n',
      'data: {"type":"future-event","x":1}\n',
      'data: {"type":"delta","text":"仍可用"}\n',
    ])

    await consumeSseStream(stream, handlers)

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ kind: 'delta', payload: { text: '仍可用' } })
  })
})
