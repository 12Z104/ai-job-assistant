# AI 求职助手

基于 Vite + React 19 + TypeScript + Express 的 AI 求职辅助工具，接入 DeepSeek 大模型 API。

## 功能

| 功能 | 说明 |
|---|---|
| 📊 简历匹配分析 | 贴简历 + JD，流式输出匹配点、差距和修改建议 |
| ✍️ 简历智能改写 | AI 改写简历，绿标润色、黄标建议补充 |
| 🧠 简历优化 Agent | 多步推理：解析JD → 提取素材 → 识别短板 → 修改方案，思考链可视化 |
| 🎤 AI 模拟面试 | 根据简历和 JD 多轮模拟面试，结束后综合点评 |

## 技术栈

- **前端**：React 19 + TypeScript + Vite
- **后端**：Express（Node.js 22）
- **AI**：DeepSeek Chat API（SSE 流式输出）
- **状态**：localStorage 本地持久化
- **部署**：本地运行，后端保护 API Key

## 本地运行

```bash
# 安装依赖
npm install

# 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env，填入 LLM_API_KEY（在 platform.deepseek.com 申请）

# 启动后端（端口 3001）
npm run server

# 启动前端（端口 5173）
npm run dev
```

打开 http://localhost:5173

## 项目结构

```
src/
  components/     # 公共组件（Panel）
  pages/          # 页面（Home/Analyze/Rewrite/Agent/Interview）
  hooks/          # 自定义 Hook（useStreaming）
  services/       # API 请求 + localStorage
server/
  index.js        # Express 后端，SSE 流式转发
```

## 架构

```
浏览器 (React)
  ↓ fetch /api/*
Express 后端 (3001)
  ↓ fetch + Bearer Key
DeepSeek API
```

后端中转保护了 API Key，前端不直接暴露密钥。SSE 流式输出实现打字机效果和 AbortController 中途取消。
