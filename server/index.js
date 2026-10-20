import express from 'express'

const app = express()
const PORT = 3001

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// 单轮 AI 分析：前端把简历和 JD 发来，后端拼好问题转给 DeepSeek
app.post('/api/chat', async (req, res) => {
  try {
    const { resume, jd } = req.body
    if (!resume || !jd) {
      return res.status(400).json({ error: '简历和 JD 都不能为空' })
    }

    const apiKey = process.env.LLM_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: '后端没配 LLM_API_KEY，请检查 server/.env' })
    }

    const baseUrl = process.env.LLM_BASE_URL || 'https://api.deepseek.com'

    // 真调 DeepSeek（OpenAI 兼容格式）
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个求职助手。根据用户给的简历和岗位JD，分析匹配度：1）匹配点 2）差距 3）3条具体修改建议。用中文回答，简洁分段。',
          },
          {
            role: 'user',
            content: `【简历】\n${resume}\n\n【岗位JD】\n${jd}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(response.status).json({ error: `DeepSeek 报错: ${errText}` })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || '（AI 没有返回内容）'
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: '服务器出错: ' + err.message })
  }
})

// 模块4：简历智能改写
app.post('/api/rewrite', async (req, res) => {
  try {
    const { resume } = req.body
    if (!resume) return res.status(400).json({ error: '简历不能为空' })

    const apiKey = process.env.LLM_API_KEY
    if (!apiKey) return res.status(500).json({ error: '后端没配 LLM_API_KEY' })
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.deepseek.com'

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是简历优化专家。根据用户给的简历原文，输出改写后的完整版本。严格遵守：
1. 对原文做的润色改写，用【改】...【/改】包裹（绿底标记）
2. 建议新增补充的内容（如缺少的技能、量化成果），用【补】...【/补】包裹（黄底标记）
3. 不要输出任何解释文字，只输出包裹好的完整简历文本`,
          },
          { role: 'user', content: resume },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(response.status).json({ error: `DeepSeek 报错: ${errText}` })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || '（AI 没有返回内容）'
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: '服务器出错: ' + err.message })
  }
})

// 模块5：SSE 流式接口——AI 边想边吐字，不是等完才返回
app.post('/api/chat-stream', async (req, res) => {
  try {
    const { resume, jd } = req.body
    if (!resume || !jd) return res.status(400).json({ error: '简历和 JD 都不能为空' })

    const apiKey = process.env.LLM_API_KEY
    if (!apiKey) return res.status(500).json({ error: '后端没配 LLM_API_KEY' })
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.deepseek.com'

    // 告诉前端：这是 SSE 流
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,   // ★ 关键：让 DeepSeek 流式返回
        messages: [
          {
            role: 'system',
            content: '你是一个求职助手。根据简历和JD分析匹配度：1）匹配点 2）差距 3）3条修改建议。用中文分段回答。',
          },
          { role: 'user', content: `【简历】\n${resume}\n\n【岗位JD】\n${jd}` },
        ],
      }),
    })

    if (!upstream.ok || !upstream.body) {
      res.write(`data: ${JSON.stringify({ error: 'DeepSeek 连接失败' })}\n\n`)
      return res.end()
    }

    // 把 DeepSeek 的流原样转发给前端
    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(decoder.decode(value, { stream: true }))
    }
    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

// 模块6：Agent 多步推理流式接口——分步骤思考，前端展示思考链
app.post('/api/agent-stream', async (req, res) => {
  try {
    const { resume, jd } = req.body
    if (!resume || !jd) return res.status(400).json({ error: '简历和 JD 都不能为空' })

    const apiKey = process.env.LLM_API_KEY
    if (!apiKey) return res.status(500).json({ error: '后端没配 LLM_API_KEY' })
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.deepseek.com'

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `你是一个简历优化 Agent。请严格按 4 步输出，每步用【步骤N:标题】内容【/步骤】包裹，一步都不能少：
【步骤1:解析JD】这个岗位的核心要求是什么？列 3-5 条
【步骤2:提取素材】从用户简历中提取与JD相关的已有素材
【步骤3:识别短板】对比JD要求，指出简历缺了什么、弱在哪
【步骤4:修改方案】给出 3-5 条具体、可执行的简历改写建议`,
          },
          { role: 'user', content: `【简历】\n${resume}\n\n【岗位JD】\n${jd}` },
        ],
      }),
    })

    if (!upstream.ok || !upstream.body) {
      res.write(`data: ${JSON.stringify({ error: 'DeepSeek 连接失败' })}\n\n`)
      return res.end()
    }

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(decoder.decode(value, { stream: true }))
    }
    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

// 模块7：AI 模拟面试流式接口——多轮对话
app.post('/api/interview-stream', async (req, res) => {
  try {
    const { resume, jd, messages } = req.body
    if (!resume || !jd || !Array.isArray(messages)) {
      return res.status(400).json({ error: '参数不完整' })
    }
    const apiKey = process.env.LLM_API_KEY
    if (!apiKey) return res.status(500).json({ error: '后端没配 LLM_API_KEY' })
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.deepseek.com'

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `你是一个严格但友好的前端面试官。根据候选人简历和岗位JD进行模拟面试。
规则：
1. 每次只问一个问题，不要一次问多个
2. 根据候选人的回答追问细节，像真实面试一样
3. 如果候选人回答得很肤浅，要求他举具体例子
4. 面试大约5-8个问题后，候选人说"结束"时，输出【面试结束】然后给出综合点评（优点/不足/改进建议）
候选人简历：${resume}
岗位JD：${jd}`,
          },
          ...messages,
        ],
      }),
    })

    if (!upstream.ok || !upstream.body) {
      res.write(`data: ${JSON.stringify({ error: 'DeepSeek 连接失败' })}\n\n`)
      return res.end()
    }
    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(decoder.decode(value, { stream: true }))
    }
    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

app.listen(PORT, () => {
  console.log(`后端已启动: http://localhost:${PORT}`)
})
