// check-supabase.mjs · Supabase 连通性与 schema 自检
// 用法：node --env-file=server/.env scripts/check-supabase.mjs
// 检查项：环境变量 → 网络连通 → 9 张表是否可查 → RLS 是否开启（通过 service key 侧写探针不可行，仅列表存在性）
import { createClient } from '@supabase/supabase-js'

const TABLES = [
  'profiles',
  'resumes',
  'resume_versions',
  'job_jds',
  'match_results',
  'interview_sessions',
  'interview_messages',
  'ai_usage',
  'jd_library',
]

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY

if (!url || !key) {
  console.error('✗ 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_KEY（检查 server/.env）')
  process.exit(1)
}
console.log(`· Project: ${url}`)
console.log(`· Key 类型: ${key.startsWith('sb_secret_') || key.length > 200 ? 'service_role（长密钥）' : '疑似 anon'}`)

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

let failed = 0
for (const table of TABLES) {
  // head + count：只取 1 行不拉数据，验证表存在与读权限
  const { error, count } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1)
  if (error) {
    console.error(`✗ ${table.padEnd(20)} ${error.code ?? ''} ${error.message}`)
    if (error.code === '42P01') console.error(`  → 表不存在：先执行 supabase/migrations/0001_init.sql`)
    failed++
  } else {
    console.log(`✓ ${table.padEnd(20)} rows=${count ?? 0}`)
  }
}

if (failed > 0) {
  console.error(`\n✗ ${failed} 张表检查失败`)
  process.exit(1)
}
console.log('\n✓ 全部 9 张表就绪，Supabase 可用了')
