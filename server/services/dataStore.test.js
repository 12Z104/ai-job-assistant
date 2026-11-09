// dataStore.test.js · 内存存储语义单测（与前端 repository/types.ts 合同对齐）
import { describe, it, expect, beforeEach } from 'vitest'
import store, { listSort, resetDataStore } from './dataStore.js'
import { ERROR_CODES } from '../lib/errors.js'

const resumeA = { id: 'r-a', title: 'A', rawContent: '...', createTime: 1000, updatedAt: 1000 }
const resumeB = { id: 'r-b', title: 'B', rawContent: '...', createTime: 2000, updatedAt: 2000 }

beforeEach(() => resetDataStore())

describe('dataStore 内存实现', () => {
  it('create/get/list 语义完整', () => {
    store.create('resumes', resumeA)
    store.create('resumes', resumeB)
    expect(store.get('resumes', 'r-a')).toEqual(resumeA)
    expect(store.get('resumes', 'missing')).toBeNull() // get 不存在返回 null
    expect(store.list('resumes')).toHaveLength(2)
  })

  it('listSort 创建时间倒序', () => {
    expect([resumeA, resumeB].sort(listSort).map((r) => r.id)).toEqual(['r-b', 'r-a'])
  })

  it('update 局部更新并刷新 updatedAt；目标不存在抛 NOT_FOUND', () => {
    store.create('resumes', resumeA)
    const updated = store.update('resumes', 'r-a', { title: 'A2' })
    expect(updated.title).toBe('A2')
    expect(updated.updatedAt).toBeGreaterThanOrEqual(updated.createTime)
    expect(() => store.update('resumes', 'missing', { title: 'x' })).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.NOT_FOUND }),
    )
  })

  it('remove 幂等：删除不存在的记录不报错', () => {
    store.create('resumes', resumeA)
    store.remove('resumes', 'r-a')
    store.remove('resumes', 'r-a')
    expect(store.get('resumes', 'r-a')).toBeNull()
  })

  it('resumes 与 jds 表互不串数据', () => {
    store.create('resumes', resumeA)
    store.create('jds', { id: 'jd-1', title: 'JD', rawText: '...', createTime: 1, updatedAt: 1 })
    expect(store.list('jds')).toHaveLength(1)
    expect(store.get('resumes', 'jd-1')).toBeNull()
  })
})
