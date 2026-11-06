import type { JdRepository, ResumeRepository } from './types'
import { RepositoryError } from './types'
import { LocalJdRepository, LocalResumeRepository } from './local'

/** 数据源聚合入口，页面/feature 只 import 这一个对象 */
export interface Repository {
  resumes: ResumeRepository
  jds: JdRepository
}

const dataSource: string = import.meta.env.VITE_DATA_SOURCE ?? 'local'

/**
 * remote 桩实现（P5 接 Supabase 前占位）：
 * VITE_DATA_SOURCE=remote 时不允许页面静默拿到空数据，每个方法直接抛错暴露问题。
 */
function createRemoteStub(): Repository {
  const notImplemented = (): never => {
    throw new RepositoryError('NOT_IMPLEMENTED', 'remote 数据源尚未实现（P5 接入 Supabase），请使用 VITE_DATA_SOURCE=local')
  }
  const stubRepository = {
    list: notImplemented,
    get: notImplemented,
    create: notImplemented,
    update: notImplemented,
    remove: notImplemented,
  }
  return { resumes: stubRepository, jds: stubRepository }
}

function createRepository(): Repository {
  if (dataSource === 'remote') {
    return createRemoteStub()
  }
  return {
    resumes: new LocalResumeRepository(),
    jds: new LocalJdRepository(),
  }
}

/** 全局唯一实例：类型上只暴露 types.ts 的接口，外部无法触达 LocalRepository 具体类 */
export const repository: Repository = createRepository()

export type { ResumeRepository, JdRepository, CreateResumeInput, CreateJdInput, ResumePatch, JdPatch } from './types'
export { RepositoryError } from './types'
