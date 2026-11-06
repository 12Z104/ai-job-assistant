import type { JobJD, Resume } from '../../types'
import type { CreateJdInput, CreateResumeInput, JdPatch, JdRepository, ResumePatch, ResumeRepository } from './types'
import { RepositoryError } from './types'

/** v2 数据键：每条记录 = 完整的 Resume / JobJD（含 id、createTime、updatedAt） */
const RESUMES_KEY = 'jz.v2.resumes'
const JDS_KEY = 'jz.v2.jds'
/** schema 版本元信息，格式 { schemaVersion: number } */
const META_KEY = 'jz.v2.meta'
const SCHEMA_VERSION = 2

interface StorageMeta {
  schemaVersion: number
}

function getStorage(): Storage {
  const storage = globalThis.localStorage
  if (!storage) {
    throw new RepositoryError('STORAGE_CORRUPTED', 'localStorage 不可用（浏览器隐私模式或非浏览器环境）')
  }
  return storage
}

function parseArray(raw: string, key: string): unknown[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new RepositoryError('STORAGE_CORRUPTED', `键 ${key} 的数据无法按 JSON 解析`, { cause: error })
  }
  if (!Array.isArray(parsed)) {
    throw new RepositoryError('STORAGE_CORRUPTED', `键 ${key} 的数据不是数组，已拒绝读取以防止覆盖损坏`)
  }
  return parsed
}

function throwWrapQuota(error: unknown): never {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    throw new RepositoryError('QUOTA_EXCEEDED', '本地存储空间不足，请删除部分旧简历或 JD 后重试', { cause: error })
  }
  throw error
}

function setItemSafe(key: string, value: string): void {
  try {
    getStorage().setItem(key, value)
  } catch (error) {
    throwWrapQuota(error)
  }
}

function writeMeta(): void {
  setItemSafe(META_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION } satisfies StorageMeta))
}

/** v1 → v2：旧数据是"无 updatedAt 字段的裸数组"，补齐缺失字段 */
function migrateRecord(item: unknown): unknown {
  if (typeof item !== 'object' || item === null) return item
  const record = item as Record<string, unknown>
  const migrated: Record<string, unknown> = {
    ...record,
    id: typeof record.id === 'string' ? record.id : crypto.randomUUID(),
    updatedAt:
      typeof record.updatedAt === 'number'
        ? record.updatedAt
        : typeof record.createTime === 'number'
          ? record.createTime
          : Date.now(),
  }
  // JD 旧数据可能没有 requireSkills（以 rawText 区分 JD 与简历）
  if ('rawText' in record && !Array.isArray(record.requireSkills)) {
    migrated.requireSkills = []
  }
  return migrated
}

/**
 * schema 迁移闸：每次读写前调用。
 * - 全新安装（无 meta 无数据键）→ 只写入 meta；
 * - meta 不存在但已有数据键，或版本低于当前 → 视为 v1 执行迁移并升版本；
 * - 已是当前版本 → 直接返回。
 */
function ensureSchema(): void {
  const storage = getStorage()
  const metaRaw = storage.getItem(META_KEY)
  if (metaRaw !== null) {
    let version = 0
    try {
      const meta = JSON.parse(metaRaw) as StorageMeta
      version = typeof meta?.schemaVersion === 'number' ? meta.schemaVersion : 0
    } catch {
      version = 0
    }
    if (version >= SCHEMA_VERSION) return
  } else if (storage.getItem(RESUMES_KEY) === null && storage.getItem(JDS_KEY) === null) {
    writeMeta()
    return
  }
  for (const key of [RESUMES_KEY, JDS_KEY]) {
    const raw = storage.getItem(key)
    if (raw === null) continue
    setItemSafe(key, JSON.stringify(parseArray(raw, key).map(migrateRecord)))
  }
  writeMeta()
}

function readRecords<T>(key: string): T[] {
  ensureSchema()
  const raw = getStorage().getItem(key)
  return raw === null ? [] : (parseArray(raw, key) as T[])
}

function writeRecords<T>(key: string, records: T[]): void {
  ensureSchema()
  setItemSafe(key, JSON.stringify(records))
}

/**
 * localStorage 适配器（P0–P4 游客模式唯一实现）。
 * 页面/feature 通过 index.ts 导出的 repository 单例使用，禁止直接实例化或触碰 localStorage。
 */
export class LocalResumeRepository implements ResumeRepository {
  async list(): Promise<Resume[]> {
    return readRecords<Resume>(RESUMES_KEY).sort((a, b) => b.createTime - a.createTime)
  }

  async get(id: string): Promise<Resume | null> {
    return readRecords<Resume>(RESUMES_KEY).find((record) => record.id === id) ?? null
  }

  async create(input: CreateResumeInput): Promise<Resume> {
    const now = Date.now()
    const record: Resume = { ...input, id: crypto.randomUUID(), createTime: now, updatedAt: now }
    writeRecords(RESUMES_KEY, [record, ...readRecords<Resume>(RESUMES_KEY)])
    return record
  }

  async update(id: string, patch: ResumePatch): Promise<Resume> {
    const records = readRecords<Resume>(RESUMES_KEY)
    const target = records.find((record) => record.id === id)
    if (!target) {
      throw new RepositoryError('NOT_FOUND', `简历 ${id} 不存在`)
    }
    const updated: Resume = { ...target, ...patch, updatedAt: Date.now() }
    writeRecords(RESUMES_KEY, records.map((record) => (record.id === id ? updated : record)))
    return updated
  }

  async remove(id: string): Promise<void> {
    const records = readRecords<Resume>(RESUMES_KEY)
    writeRecords(RESUMES_KEY, records.filter((record) => record.id !== id))
  }
}

export class LocalJdRepository implements JdRepository {
  async list(): Promise<JobJD[]> {
    return readRecords<JobJD>(JDS_KEY).sort((a, b) => b.createTime - a.createTime)
  }

  async get(id: string): Promise<JobJD | null> {
    return readRecords<JobJD>(JDS_KEY).find((record) => record.id === id) ?? null
  }

  async create(input: CreateJdInput): Promise<JobJD> {
    const now = Date.now()
    const record: JobJD = {
      ...input,
      requireSkills: input.requireSkills ?? [],
      id: crypto.randomUUID(),
      createTime: now,
      updatedAt: now,
    }
    writeRecords(JDS_KEY, [record, ...readRecords<JobJD>(JDS_KEY)])
    return record
  }

  async update(id: string, patch: JdPatch): Promise<JobJD> {
    const records = readRecords<JobJD>(JDS_KEY)
    const target = records.find((record) => record.id === id)
    if (!target) {
      throw new RepositoryError('NOT_FOUND', `JD ${id} 不存在`)
    }
    const updated: JobJD = { ...target, ...patch, updatedAt: Date.now() }
    writeRecords(JDS_KEY, records.map((record) => (record.id === id ? updated : record)))
    return updated
  }

  async remove(id: string): Promise<void> {
    const records = readRecords<JobJD>(JDS_KEY)
    writeRecords(JDS_KEY, records.filter((record) => record.id !== id))
  }
}
