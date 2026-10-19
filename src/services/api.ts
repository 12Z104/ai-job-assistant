// 前端调后端的统一入口。以后所有请求都从这里走，不直接写 fetch
export async function analyzeMatch(resume: string, jd: string): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, jd }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `请求失败 (${res.status})`)
  }

  const data = await res.json()
  return data.reply
}

// 模块4：简历智能改写
export async function rewriteResume(resume: string): Promise<string> {
  const res = await fetch('/api/rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `请求失败 (${res.status})`)
  }
  const data = await res.json()
  return data.reply
}
