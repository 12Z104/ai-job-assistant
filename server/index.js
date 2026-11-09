// 后端入口：装配 app 并 listen(3001)
import { createApp } from './app.js'

// 启动闸门：LLM_API_KEY 缺失直接崩溃（合同：启动时崩溃，请求时兜底 INTERNAL）
if (!process.env.LLM_API_KEY) {
  console.error('[fatal] 缺少 LLM_API_KEY 环境变量，请检查 server/.env')
  process.exit(1)
}

// 端口可由环境覆盖（P7 托管平台动态分配 PORT），本地默认 3001
const PORT = Number(process.env.PORT) || 3001
createApp().listen(PORT, () => {
  console.log(`后端已启动: http://localhost:${PORT}`)
})
