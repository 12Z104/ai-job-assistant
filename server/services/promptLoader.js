// Prompt 文件加载：模块加载时同步读一次并缓存，运行时零 IO
// prompt 文件头是 <!-- ... --> 元数据块（task/version/updatedAt/期望输出结构），发给模型时剥掉
import { readFileSync } from 'node:fs'

const cache = new Map()

export function loadPrompt(name) {
  if (cache.has(name)) return cache.get(name)
  const url = new URL(`../prompts/${name}.md`, import.meta.url)
  const content = readFileSync(url, 'utf8')
  // 剥掉文件头元数据注释块
  const body = content.replace(/^<!--[\s\S]*?-->\s*/, '').trim()
  cache.set(name, body)
  return body
}
