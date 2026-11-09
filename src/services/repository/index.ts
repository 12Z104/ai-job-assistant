import type { JdRepository, ResumeRepository } from './types'
import { LocalJdRepository, LocalResumeRepository } from './local'
import { RemoteJdRepository, RemoteResumeRepository } from './remote'

/** 数据源聚合入口，页面/feature 只 import 这一个对象 */
export interface Repository {
  resumes: ResumeRepository
  jds: JdRepository
}

const dataSource: string = import.meta.env.VITE_DATA_SOURCE ?? 'local'

function createRepository(): Repository {
  if (dataSource === 'remote') {
    // P5：BFF 内存存储 / Supabase 由后端切换，前端只认同一套 HTTP 合同
    return { resumes: new RemoteResumeRepository(), jds: new RemoteJdRepository() }
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
