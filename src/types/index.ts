export interface Resume {
  id: string
  title: string
  rawContent: string
  modifiedContent?: string
  suggestNotes?: string
  createTime: number
  /** 最近一次写入时间（数据层迁移与多份记录排序用；issue #42 补充，创建时 = createTime） */
  updatedAt: number
}

export interface JobJD {
  id: string
  title: string
  company: string
  rawText: string
  requireSkills: string[]
  createTime: number
  /** 最近一次写入时间（数据层迁移与多份记录排序用；issue #42 补充，创建时 = createTime） */
  updatedAt: number
}

export interface LLMMessage {
  role: 'user' | 'agent'
  content: string
  thinkChain?: string
}
