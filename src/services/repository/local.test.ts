import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocalJdRepository, LocalResumeRepository } from './local'
import { RepositoryError } from './types'

/** 内存版 Storage，直接 stub globalThis.localStorage，不依赖 jsdom */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key) {
      return map.get(key) ?? null
    },
    key(index) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key) {
      map.delete(key)
    },
    setItem(key, value) {
      map.set(key, value)
    },
  }
}

const META_KEY = 'jz.v2.meta'
const RESUMES_KEY = 'jz.v2.resumes'
const JDS_KEY = 'jz.v2.jds'

let storage: Storage

beforeEach(() => {
  storage = createMemoryStorage()
  vi.stubGlobal('localStorage', storage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('v1 → v2 迁移', () => {
  it('无 updatedAt 的 v1 裸数组迁移后字段完整，meta 升到 v2', async () => {
    // 模拟 v1：无 meta、无 updatedAt（旧数据甚至无 id / requireSkills）
    storage.setItem(RESUMES_KEY, JSON.stringify([
      { title: '旧简历', rawContent: 'v1 内容', createTime: 1700000000000 },
    ]))
    storage.setItem(JDS_KEY, JSON.stringify([
      { title: '旧JD', company: '旧公司', rawText: 'v1 JD', createTime: 1700000000001 },
    ]))

    const resumes = await new LocalResumeRepository().list()
    const jds = await new LocalJdRepository().list()

    expect(resumes).toHaveLength(1)
    const resume = resumes[0]!
    expect(resume.title).toBe('旧简历')
    expect(resume.rawContent).toBe('v1 内容')
    expect(resume.createTime).toBe(1700000000000)
    expect(resume.updatedAt).toBe(1700000000000)
    expect(resume.id).toEqual(expect.any(String))

    expect(jds).toHaveLength(1)
    const jd = jds[0]!
    expect(jd.updatedAt).toBe(1700000000001)
    expect(jd.id).toEqual(expect.any(String))
    expect(jd.requireSkills).toEqual([])

    expect(JSON.parse(storage.getItem(META_KEY)!)).toEqual({ schemaVersion: 2 })
  })

  it('已是 v2 的数据不重复迁移，原记录保留', async () => {
    storage.setItem(META_KEY, JSON.stringify({ schemaVersion: 2 }))
    storage.setItem(RESUMES_KEY, JSON.stringify([
      { id: 'r1', title: '新简历', rawContent: '内容', createTime: 1700000000000, updatedAt: 1700000009999 },
    ]))

    const resumes = await new LocalResumeRepository().list()
    expect(resumes[0]).toEqual({
      id: 'r1', title: '新简历', rawContent: '内容', createTime: 1700000000000, updatedAt: 1700000009999,
    })
  })
})

describe('ResumeRepository 全链路', () => {
  it('create → list → get → update → remove', async () => {
    const repo = new LocalResumeRepository()

    const created = await repo.create({ title: '前端实习简历', rawContent: '内容' })
    expect(created.id).toEqual(expect.any(String))
    expect(created.updatedAt).toBe(created.createTime)

    // list 按创建时间倒序
    const second = await repo.create({ title: '第二份', rawContent: 'x' })
    const list = await repo.list()
    expect(list.map((r) => r.id)).toEqual([second.id, created.id])

    // get
    const fetched = await repo.get(created.id)
    expect(fetched).toEqual(created)
    expect(await repo.get('not-exist')).toBeNull()

    // update
    const updated = await repo.update(created.id, { title: '改后标题', modifiedContent: '改写内容' })
    expect(updated.title).toBe('改后标题')
    expect(updated.modifiedContent).toBe('改写内容')
    expect(updated.updatedAt).toBeGreaterThanOrEqual(updated.createTime)
    expect((await repo.get(created.id))?.title).toBe('改后标题')

    // update 不存在 → NOT_FOUND
    await expect(repo.update('not-exist', { title: 'x' })).rejects.toMatchObject({
      name: 'RepositoryError',
      code: 'NOT_FOUND',
    })

    // remove + 幂等
    await repo.remove(created.id)
    expect(await repo.get(created.id)).toBeNull()
    await expect(repo.remove(created.id)).resolves.toBeUndefined()
  })
})

describe('JdRepository 全链路', () => {
  it('create（requireSkills 缺省补空数组）→ get → update → remove', async () => {
    const repo = new LocalJdRepository()

    const created = await repo.create({ title: '前端实习', company: '某厂', rawText: '岗位职责…' })
    expect(created.requireSkills).toEqual([])

    const withSkills = await repo.create({ title: '后端实习', company: '另一厂', rawText: '…', requireSkills: ['Go'] })
    expect(withSkills.requireSkills).toEqual(['Go'])

    const updated = await repo.update(created.id, { title: '前端实习（改）' })
    expect((await repo.get(created.id))?.title).toBe('前端实习（改）')
    expect(updated.updatedAt).toBeGreaterThanOrEqual(created.createTime)

    await expect(repo.update('not-exist', { title: 'x' })).rejects.toBeInstanceOf(RepositoryError)

    await repo.remove(created.id)
    expect(await repo.get(created.id)).toBeNull()
  })
})

describe('quota 超限', () => {
  it('setItem 抛 QuotaExceededError 时包装为 RepositoryError(QUOTA_EXCEEDED)', async () => {
    const repo = new LocalResumeRepository()
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })

    await expect(repo.create({ title: 'x', rawContent: 'y' })).rejects.toMatchObject({
      name: 'RepositoryError',
      code: 'QUOTA_EXCEEDED',
    })
  })

  it('其他 setItem 错误原样透传，不误标为 quota', async () => {
    const repo = new LocalResumeRepository()
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new TypeError('boom')
    })

    await expect(repo.create({ title: 'x', rawContent: 'y' })).rejects.toBeInstanceOf(TypeError)
  })
})
