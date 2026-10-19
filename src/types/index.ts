export interface Resume {
  id: string
  title: string
  rawContent: string
  modifiedContent?: string
  suggestNotes?: string
  createTime: number
}

export interface JobJD {
  id: string
  title: string
  company: string
  rawText: string
  requireSkills: string[]
  createTime: number
}

export interface LLMMessage {
  role: 'user' | 'agent'
  content: string
  thinkChain?: string
}
