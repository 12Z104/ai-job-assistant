import type { Resume, JobJD } from '../../types'

/**
 * 数据访问层错误。
 *
 * 所有 repository 实现的确定性失败都必须抛本错误（禁止静默吞错），
 * 调用方（feature hooks / 页面三态）按 code 分支处理，不感知底层存储细节。
 */
export class RepositoryError extends Error {
  /** 机器可读错误码，语义见 RepositoryErrorCode */
  readonly code: RepositoryErrorCode

  constructor(code: RepositoryErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'RepositoryError'
    this.code = code
  }
}

export type RepositoryErrorCode =
  /** localStorage 写入失败且剩余空间不足：提示用户清理数据（删除旧简历/JD）后重试 */
  | 'QUOTA_EXCEEDED'
  /** 该方法尚未实现（remote 适配器在 P5 接 Supabase 前的占位桩） */
  | 'NOT_IMPLEMENTED'
  /** 按 id 查找的目标记录不存在（仅 update 抛出；get 返回 null，remove 幂等静默） */
  | 'NOT_FOUND'
  /** 存储里的数据无法按 JSON 解析：数据已损坏，不覆盖写回，向上抛给错误边界 */
  | 'STORAGE_CORRUPTED'

/**
 * 简历数据访问接口。
 *
 * 调用方：features/resume 的 hooks（useResumes / useActiveResume）与匹配/改写页面。
 * 错误语义：
 * - list/create/update/remove 失败抛 RepositoryError；
 * - get 找不到返回 null（"没有这份简历"是正常业务态，不是错误）；
 * - update 目标不存在抛 NOT_FOUND；
 * - remove 幂等：目标不存在也正常 resolve。
 */
export interface ResumeRepository {
  /** 全量列表，按创建时间倒序（新简历在前） */
  list(): Promise<Resume[]>
  /** 按 id 取单份；不存在返回 null */
  get(id: string): Promise<Resume | null>
  /** 新建，id / createTime / updatedAt 由实现层生成，input 不含主键 */
  create(input: CreateResumeInput): Promise<Resume>
  /** 局部更新并返回更新后的完整记录；目标不存在抛 NOT_FOUND */
  update(id: string, patch: ResumePatch): Promise<Resume>
  /** 删除；幂等，目标不存在不报错 */
  remove(id: string): Promise<void>
}

/**
 * JD 数据访问接口。调用方与错误语义同 ResumeRepository。
 */
export interface JdRepository {
  /** 全量列表，按创建时间倒序 */
  list(): Promise<JobJD[]>
  /** 按 id 取单条；不存在返回 null */
  get(id: string): Promise<JobJD | null>
  /** 新建，id / createTime / updatedAt 由实现层生成 */
  create(input: CreateJdInput): Promise<JobJD>
  /** 局部更新并返回更新后的完整记录；目标不存在抛 NOT_FOUND */
  update(id: string, patch: JdPatch): Promise<JobJD>
  /** 删除；幂等，目标不存在不报错 */
  remove(id: string): Promise<void>
}

export interface CreateResumeInput {
  title: string
  rawContent: string
}

/** 允许更新的字段 = 业务上可编辑的字段（id/createTime 不可变） */
export type ResumePatch = Partial<Pick<Resume, 'title' | 'rawContent' | 'modifiedContent' | 'suggestNotes'>>

export interface CreateJdInput {
  title: string
  company: string
  rawText: string
  /** 缺省视为空数组（由实现层补齐） */
  requireSkills?: string[]
}

export type JdPatch = Partial<Pick<JobJD, 'title' | 'company' | 'rawText' | 'requireSkills'>>
