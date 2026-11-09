/**
 * remote 数据适配器：BFF HTTP 实现（Owner Map：repository 唯一走网络读写数据的出口）。
 * 依赖 http.ts 的统一封装与错误合同，把 HttpError 翻译成 RepositoryError，
 * 页面/feature 不感知传输层（与 local 适配器同一套接口，VITE_DATA_SOURCE 切换）。
 * P6 接入认证后，鉴权头由 http.ts 注入，本层无需改动。
 */
import type { JdRepository, ResumeRepository, CreateResumeInput, CreateJdInput, ResumePatch, JdPatch } from './types'
import { RepositoryError } from './types'
import type { Resume, JobJD } from '../../types'
import { getJson, postJson, patchJson, deleteJson, HttpError } from '../http'

/** HttpError → RepositoryError：仅翻译，不吞错 */
function toRepositoryError(err: unknown): RepositoryError {
  if (err instanceof HttpError) {
    if (err.code === 'NOT_FOUND') {
      return new RepositoryError('NOT_FOUND', err.message, { cause: err })
    }
    return new RepositoryError('REQUEST_FAILED', err.message, { cause: err })
  }
  return new RepositoryError('REQUEST_FAILED', err instanceof Error ? err.message : '数据请求失败', { cause: err })
}

export class RemoteResumeRepository implements ResumeRepository {
  async list(): Promise<Resume[]> {
    try {
      return (await getJson<Resume[]>('/api/resumes')).data
    } catch (err) {
      throw toRepositoryError(err)
    }
  }

  async get(id: string): Promise<Resume | null> {
    try {
      return (await getJson<Resume | null>(`/api/resumes/${id}`)).data
    } catch (err) {
      throw toRepositoryError(err)
    }
  }

  async create(input: CreateResumeInput): Promise<Resume> {
    try {
      return (await postJson<Resume>('/api/resumes', input)).data
    } catch (err) {
      throw toRepositoryError(err)
    }
  }

  async update(id: string, patch: ResumePatch): Promise<Resume> {
    try {
      return (await patchJson<Resume>(`/api/resumes/${id}`, patch)).data
    } catch (err) {
      throw toRepositoryError(err)
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await deleteJson(`/api/resumes/${id}`)
    } catch (err) {
      throw toRepositoryError(err)
    }
  }
}

export class RemoteJdRepository implements JdRepository {
  async list(): Promise<JobJD[]> {
    try {
      return (await getJson<JobJD[]>('/api/jds')).data
    } catch (err) {
      throw toRepositoryError(err)
    }
  }

  async get(id: string): Promise<JobJD | null> {
    try {
      return (await getJson<JobJD | null>(`/api/jds/${id}`)).data
    } catch (err) {
      throw toRepositoryError(err)
    }
  }

  async create(input: CreateJdInput): Promise<JobJD> {
    try {
      return (await postJson<JobJD>('/api/jds', input)).data
    } catch (err) {
      throw toRepositoryError(err)
    }
  }

  async update(id: string, patch: JdPatch): Promise<JobJD> {
    try {
      return (await patchJson<JobJD>(`/api/jds/${id}`, patch)).data
    } catch (err) {
      throw toRepositoryError(err)
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await deleteJson(`/api/jds/${id}`)
    } catch (err) {
      throw toRepositoryError(err)
    }
  }
}
