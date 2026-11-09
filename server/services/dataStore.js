// 内存数据存储：resumes / jds 的本地开发实现
// P5 接 Supabase 时按同接口替换为远程实现（server key 直连库，带 user_id 条件，§6.3 警告）；
// 语义与前端 repository/types.ts 对齐：get 不存在返回 null，update 不存在抛 NOT_FOUND，remove 幂等。
// 注意：P6 接入认证后，路由层必须按 req.user.id 过滤数据——本层不感知用户。
import { fail, ERROR_CODES } from '../lib/errors.js'

const tables = {
  resumes: new Map(),
  jds: new Map(),
}

function list(table) {
  return [...tables[table].values()]
}

function listSort(a, b) {
  return b.createTime - a.createTime // 创建时间倒序，新记录在前
}

function get(table, id) {
  return tables[table].get(id) ?? null
}

function create(table, record) {
  tables[table].set(record.id, record)
  return record
}

function update(table, id, patch) {
  const existing = tables[table].get(id)
  if (!existing) throw fail(ERROR_CODES.NOT_FOUND, `记录不存在: ${id}`)
  const updated = { ...existing, ...patch, updatedAt: Date.now() }
  tables[table].set(id, updated)
  return updated
}

function remove(table, id) {
  tables[table].delete(id) // 幂等：不存在也正常返回
}

export default { list, listSort, get, create, update, remove }
export { listSort }
export function resetDataStore() {
  for (const map of Object.values(tables)) map.clear() // 仅测试用
}
