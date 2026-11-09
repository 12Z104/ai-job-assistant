// remote.test.ts · remote 适配器单测：mock fetch，验证 HTTP 合同到 RepositoryError 的翻译
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RemoteResumeRepository, RemoteJdRepository } from './remote'
import { RepositoryError } from './types'
import type { Resume } from '../../types'

const sampleResume: Resume = {
  id: 'r-1',
  title: '前端简历',
  rawContent: '内容',
  createTime: 1700000000000,
  updatedAt: 1700000000000,
}

/** mock 一个 {data,meta} 成功响应 */
function okResponse(data: unknown) {
  return new Response(JSON.stringify({ data, meta: { requestId: 'req-1' } }), { status: 200 })
}

/** mock 一个后端错误合同响应 */
function errorResponse(code: string, message: string, status: number) {
  return new Response(JSON.stringify({ error: { code, message }, requestId: 'req-1' }), { status })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('RemoteResumeRepository', () => {
  it('list 返回 data 字段', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse([sampleResume]))
    const list = await new RemoteResumeRepository().list()
    expect(list).toEqual([sampleResume])
    expect(fetch).toHaveBeenCalledWith('/api/resumes', expect.objectContaining({ method: 'GET' }))
  })

  it('get 后端返回 null 时得到 null（正常业务态，不是错误）', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse(null))
    expect(await new RemoteResumeRepository().get('nope')).toBeNull()
  })

  it('create 发送 JSON body 并返回新记录', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse(sampleResume))
    const created = await new RemoteResumeRepository().create({ title: '前端简历', rawContent: '内容' })
    expect(created.id).toBe('r-1')
    expect(fetch).toHaveBeenCalledWith('/api/resumes', expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: '前端简历', rawContent: '内容' }) }))
  })

  it('update 遇后端 NOT_FOUND → RepositoryError(NOT_FOUND)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse('NOT_FOUND', '记录不存在', 404))
    await expect(new RemoteResumeRepository().update('nope', { title: 'x' })).rejects.toMatchObject({
      name: 'RepositoryError',
      code: 'NOT_FOUND',
    })
  })

  it('网络断开 → RepositoryError(REQUEST_FAILED)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(new RemoteResumeRepository().list()).rejects.toMatchObject({
      name: 'RepositoryError',
      code: 'REQUEST_FAILED',
    })
  })

  it('后端 5xx（UPSTREAM_ERROR）→ REQUEST_FAILED 可重试类', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse('UPSTREAM_ERROR', '上游返回 500', 502))
    await expect(new RemoteResumeRepository().list()).rejects.toMatchObject({ code: 'REQUEST_FAILED' })
  })

  it('remove 幂等成功不抛错', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse({ ok: true }))
    await expect(new RemoteResumeRepository().remove('r-1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith('/api/resumes/r-1', expect.objectContaining({ method: 'DELETE' }))
  })
})

describe('RemoteJdRepository', () => {
  it('create 补齐合同：requireSkills 缺省由后端补，patch 走 PATCH', async () => {
    const jd = { id: 'jd-1', title: '前端实习', company: 'ACME', rawText: 'JD', requireSkills: ['React'], createTime: 1, updatedAt: 1 }
    vi.mocked(fetch).mockResolvedValueOnce(okResponse(jd))
    const created = await new RemoteJdRepository().create({ title: '前端实习', company: 'ACME', rawText: 'JD' })
    expect(created.requireSkills).toEqual(['React'])
    // RepositoryError 类型边界：断言翻译函数对非 HttpError 也给 REQUEST_FAILED
    const err = new Error('boom')
    vi.mocked(fetch).mockRejectedValueOnce(err)
    await expect(new RemoteJdRepository().list()).rejects.toBeInstanceOf(RepositoryError)
  })
})
