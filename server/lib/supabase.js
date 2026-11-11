// Supabase 服务端客户端：全仓库唯一创建 service 客户端的地方
// 安全约束（ARCHITECTURE §6.3）：service key 绕过 RLS，只允许出现在服务端；
// 所有写库操作必须自带 user_id 条件，代码评审重点。
import { createClient } from '@supabase/supabase-js'
import { fail, ERROR_CODES } from './errors.js'

/** 是否配置了 Supabase（未配置时数据层回退内存实现，本地开发零依赖） */
export function hasSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
}

let client = null

/** 单例客户端：persistSession 关闭（服务端无浏览器会话概念） */
export function getSupabase() {
  if (!hasSupabase()) {
    throw fail(ERROR_CODES.INTERNAL, '未配置 SUPABASE_URL / SUPABASE_SERVICE_KEY')
  }
  client ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}
