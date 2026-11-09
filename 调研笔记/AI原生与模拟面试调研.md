# AI 原生 / 新锐产品 + AI 模拟面试类 竞品调研笔记

> 调研范围：用 LLM 做简历匹配 / 模拟面试 / 求职副驾的新锐产品，重点为"模拟面试"环节。
> 时间基准：2026-10（以当前可打开页面为准）。
> 查证状态标注：**已查证** = 实际打开官网/官方文档读到；**一方称** = 官网自述但无法独立验证；**转述** = 第三方评测。
> 与 Jobscan / Rezi / Teal / Sonara / Simplify / Careerflow（他人负责）不重复。

---

## 一、逐个产品小节

### 1. Google Interview Warmup（Google 官方）
- 来源：https://grow.google/certificates/interview-warmup/ （**已查证**，2026-10 仍在线）
- 目标人群：Google Career Certificate 学员为主，开放给所有人；面向面试新手的"低压力开口练习"。英文为主，无中文面试。
- 核心功能：
  - 选一个领域（数据分析、电商、IT 支持、项目管理、UX 设计、通用职业），回答专家设计的题目。
  - **语音**回答，实时语音转写；也可文本输入。
  - 反馈是"洞察"而非打分：列出你用到的职业相关术语、最常用词、覆盖的 talking points、语速/用词/清晰度。
  - **明确不生成题目**（题目由行业专家编写）、**不基于简历/JD 出题**、**不批改答案对错**。
  - 无逐题点评、无多轮追问、无结束总结报告、无匹配/改写/导出闭环。
- AI 实现：仅用于语音转写 + 词频/话题分析；页面明示"AI 不用于生成面试题"。
- 商业模式：完全免费，无需注册，不保存音频/转写（可手动下载全文 transcript）。
- 平台形态：Web 浏览器工具。
- 与五步闭环差异：最浅的"开口暖身"，只覆盖模拟面试的极简版，且不基于简历/JD、不打分、不闭环。

### 2. Yoodli（yoodli.ai）
- 来源：https://yoodli.ai/pricing （**已查证**）；https://yoodli.ai/faq
- 目标人群：个人沟通/面试/演讲练习者 + 企业销售/沟通培训；英文为主。
- 核心功能：
  - Live AI roleplay（实时 AI 对练，可模拟面试、销售异议、pitch 等）。
  - 对上传录音/录像给反馈（语速、填充词、用词等口才维度）。
  - 模拟面试是"口才教练"取向，**不强调基于简历/JD 出题**，也没有匹配打分/简历改写/导出闭环。
- AI 实现：官网未公开具体模型；roleplay 计数制（>30 秒算一次）。
- 定价（已查证）：
  - Starter $0：终身共 5 次 roleplay。
  - Pro $8/月（年付，约省 40%）：每周最多 10 次 roleplay。
  - Advanced $20/月（年付）：无限 roleplay、数据不入训练。
  - Team/Enterprise 按席位定制（SOC2 Type 2）。
- 平台形态：Web（个人）+ 企业版。
- 与五步闭环差异：偏"公开演讲/口才"通用对练，不是"简历+JD→匹配→改写→面试"的求职闭环。

### 3. Final Round AI（finalroundai.com）
- 来源：https://www.finalroundai.com/en （**已查证**）；https://www.finalroundai.com/blog/final-round-ai-pricing
- 目标人群：正在技术/产品/数据岗面试中的求职者（80+ 国家，自述 1000 万+用户）。多语言：每会话可设回答语言与代码语言（含中文界面 https://www.finalroundai.com/zh/）。
- 核心功能（与本项目最接近，且更深）：
  - **Goal（一个岗位一张卡）**：录入 role、company、JD（可选粘贴）、resume、materials、准备的轮次——这一步等价于"粘贴简历+JD"。
  - **Practice Interview**：AI 面试官已知你的 role/company/resume/materials；8 种场景（通用、Coding、系统设计、行为、产品 Case、数据/ML、薪资谈判、HR 初筛）；**Re-drill 自动重练上次 debrief 标出的薄弱点**。
  - **Live Interview CoPilot**：听真实面试实时出答案（属于"面试中辅助"品类，伦理上有争议）。
  - **Interview Debrief**：会话结束自动生成复盘，多维度打分（页面示例 Clarity/Structure/Depth/Signals/Follow-up，总分 82），给出"哪里好/哪里改/准备度"，并回流到下一轮。
  - 覆盖：JD 解析与准备清单（匹配的雏形）、practice 面试、自动复盘；**不做简历改写前后对比高亮，不导出 PDF/Word**。
- AI 实现：未公开具体模型；实时流式输出答案（"seconds after the question"）；桌面端采集屏幕/音频。
- 定价（已查证）：
  - Free $0：无限 Goal、简历与材料、JD 解析、准备清单、桌面 App。
  - Pro $25/月（年付 $300/年预付）；月付 $90/月（官网博客）。解锁 live CoPilot、Stealth、全部面试类型、practice interviews、自动 debrief。
- 平台形态：**桌面 App（macOS 14.4+ / Windows）**，非纯 Web。
- 与五步闭环差异：模拟面试深度远超本项目（多轮、按简历/JD 出题、自动多维度打分复盘、薄弱点重练），但缺"匹配打分→简历改写高亮→导出"这条线，且形态是桌面端 + 主打 live 辅助。

### 4. InterviewBuddy（interviewbuddy.net）
- 来源：https://interviewbuddy.net/niche/ai （**已查证**）；https://interviewbuddy.net/
- 目标人群：想低成本无限次练习的求职者；英文为主。注意：另有同名 Chrome 扩展 interviewbuddy.expert（实时辅助类，$1.99/周起）和澳洲站 interviewbuddy.com.au，**与本次清单的 interviewbuddy.net 不是同一产品**。
- 核心功能：
  - 两条线：①专家真人 1:1 模拟面试（约 $39.99/场，ex-Google/McKinsey 等）；②**AI 模拟面试 $5.99**：无限次练习、即时 AI 反馈报告、情感/语气分析、按角色/行业/经验定制。
  - AI 线：题目按角色/方向（AI/ML、PM、技术等 niche 页）组织；强调即时反馈报告，但页面未明确"基于个人简历+JD 多轮追问"。
- AI 实现：未公开模型。
- 定价（已查证）：AI 无限练习 $5.99；真人 1:1 约 $39.99/场。
- 平台形态：Web。
- 与五步闭环差异：AI 线是"题库 + 即时反馈报告"，深度介于 Warmup 与 Final Round 之间；不含匹配/改写/导出闭环。

### 5. Jobright（jobright.ai）
- 来源：https://jobright.ai/ （官网自述，**一方称**）；价格为第三方转述：https://resumeup.ai/blog/jobright-alternatives 、https://jobsaicopilot.com/jobright-review/
- 目标人群：主动海投的求职者；英文为主。
- 核心功能：AI 岗位匹配、简历针对 JD 改写（tailored resume）、申请表自动填写（autofill）、AI 助手 "Orion"、内部人邮件、求职追踪。
- 模拟面试：**未查到 Jobright 提供模拟面试功能**——它是"匹配+改写+自动投递"取向，不做面试对练。
- 商业模式：免费计划（每日约 2 credits、基础匹配）；付费 Turbo。
- 定价（**转述**，各第三方数字不一致，官网未公开求职者价格页）：约 $17.99/周、$39.99/月、约 $90/季；无免费试用、无退款。
- 平台形态：Web + 浏览器扩展。
- 与五步闭环差异：覆盖"匹配+改写"且延伸到自动投递，但**完全不做模拟面试**，正好是本项目差异化的空缺点。

### 6. Huntr（huntr.co）
- 来源：https://huntr.co/pricing 、https://help.huntr.co/en/articles/10714568-plan-types-and-pricing 、https://huntr.co/ （**已查证**）
- 目标人群：用 CRM 方式管理求职全流程的人；英文为主。
- 核心功能：
  - 求职追踪器（Job Tracker）+ 联系人管理。
  - AI 简历生成、**粘贴 JD→AI 自动 tailored resume**、AI 求职信、JD 关键词提取、**简历-JD 匹配打分（job match score）**。
  - **不做模拟面试**（无 AI 面试官、无对练）。
  - 有 PDF 导出（免费计划含基础 PDF 导出）。
- AI 实现：未公开模型；关键词提取 + 匹配打分 + 简历生成。
- 定价（已查证）：
  - Basic $0：无限基础简历、2 份 tailored resume、基础 PDF 导出、基础匹配/打分、追踪 ≤100 个岗位。
  - Pro $40/月（季付 $90 ≈ $30/月）：无限 AI 简历/tailored/求职信、高级匹配打分、无限追踪。
- 平台形态：Web + Chrome 扩展。
- 与五步闭环差异：把"匹配打分 + 简历改写 + 导出 + 投递追踪"做得很完整，但**唯独缺模拟面试**——再次印证"匹配/改写强、面试弱"是这类工具的普遍空档。

### 7. LazyApply（lazyapply.com）
- 来源：第三方评测 https://jobcopilot.com/de/jobcopilot-vs-lazyapply/ 、https://www.toolbit.ai/ai-tool/lazyapply （**转述**）；官网 lazyapply.com 未直接抓取价格页。
- 目标人群：想一键海投 LinkedIn/Indeed/ZipRecruiter 等 20+ 平台的人；英文为主。
- 核心功能：自动填写并批量投递、自动生成求职信、投递状态看板；**不做匹配打分、不做简历改写高亮、不做模拟面试**。
- 定价（转述）：Basic $99/年、Premium $149/年、Ultimate $999/年（各档有每日投递上限）；历史上有过 $97 终身买断的说法。
- 平台形态：浏览器扩展。
- 与五步闭环差异：纯"自动投递"工具，与五步闭环几乎无功能重叠，仅作背景参照。

### 8. Huru（huru.ai）—— 高度相关，免费
- 来源：https://huru.ai/ （**已查证**）
- 目标人群：面试前练习者；242+ 职业角色、5 种语言（**未明确含中文**）。
- 核心功能（与本项目第④步高度对标）：
  - **两种模式**：①Live 对话式 AI 面试官（会听、会**追问 follow-up**、自适应）；②逐题模式。
  - 可**粘贴 JD**，或选角色库，或自写题目。
  - 可选面试官人设（Maya/Daniel/Sofia）、压力档（Supportive/Standard/Demanding）、时长 5/10/15/20 分钟；视频或纯语音。
  - **Huru 自研打分模型**逐题按 relevance/structure/specificity/impact/articulation 打分（示例 88/100），并告诉"下一步改什么"；结束出 debrief 与准备度趋势。
  - 同时提供：简历针对 JD 的 tailoring（按 ATS/recruiter/career fit 打分、关键词覆盖、建议改写），改完可直接就同一岗位做模拟面试。
- AI 实现：自称"own scoring model"；未公开底层大模型。
- 定价：**对所有人免费**（页面标语 Free for everyone）。
- 平台形态：Web（视频/语音）。
- 与五步闭环差异：是最接近"粘贴 JD→模拟面试→打分复盘"的免费产品，且打通了"先 tailoring 简历再面同一岗"；但**不做改写前后对比高亮、不导出 PDF/Word**，中文支持未见。

### 9. Qcard（qcardai.com）—— 高度相关，面向应届生
- 来源：https://qcardai.com/ （**已查证**）
- 目标人群：**应届生（new grad）**，技术/PM/咨询/金融/安全/编码面试；英文为主（未明确中文）。
- 核心功能（与本项目第④步对标）：
  - **Mock Interview 由 JD 生成**：粘贴 JD、写公司名、选行为/技术方向；AI 面试官按岗位真实要求出题，并**对含糊回答自适应追问（追数字、追人名）**，每场出新题。
  - Resume-grounded：建议/题目都基于你粘贴的简历，防幻觉。
  - Practice Mode：1–10 分打分 + 具体反馈（强项/改进项），可跟踪进度。
  - Voice Delivery Coach：语速 wpm、填充词（um/like）、回答时长，手机端免登录即用。
  - 另含：面试 Timeline 追踪、感谢信生成、准备清单、live 时辅助（第二屏/手机，争议品类）。
  - 低延迟流式建议（WebSocket，<1s）。
- AI 实现：未公开模型；强调 resume-locked、子秒级流式。
- 定价（已查证）：Free $0（每月 5 分钟面试时长、基础建议、简历上传解析）；Pro $21.50/月（无限会话、Mock+Practice、Coach、题库、学习路径/分析）。
- 平台形态：Web（Full/Mini/Phone 三模式）。
- 与五步闭环差异：JD 驱动 + 自适应追问 + 逐题打分 + 应届生定位，模拟面试很深；但**不做匹配结构化打分、不做简历改写高亮、不导出 PDF/Word**。

### 10. 牛面 niumianoffer.com（中文，技术向）
- 来源：https://niumianoffer.com/ （**一方称**）
- 目标人群：程序员/技术岗求职者（字节、阿里、腾讯等大厂方向）；中文。
- 核心功能：基于 10 万+大厂真题训练的 AI 技术面试对练；提供完整面试数据报告（多维度分析、题目拆解、改进建议清单），由资深面试官参与调优。
- 定价：官网片段未明确价格，**未查到**。
- 平台形态：Web（自述）。
- 与五步闭环差异：中文技术面试对练 + 报告，是本项目"中文技术实习面试"最直接的同类；但未体现"简历+JD 匹配→改写高亮→导出"闭环。

### 11. 面灵AI mianlingai.com（中文）
- 来源：https://www.mianlingai.com/doc/faq/ （**一方称**）
- 目标人群：中文求职者（含笔试/面试）。
- 核心功能：AI 模拟面试/笔试助手；按时长计费。
- 定价（一方称 FAQ）：新用户注册送 30 分钟 + 1 次模拟面试；时长包 60 分钟 29 元 / 240 分钟 89 元 / 600 分钟 199 元；笔试助手按截图扣时长。
- 平台形态：Web/工具。
- 与五步闭环差异：中文、按时长计费的面试/笔试对练工具，不做简历匹配改写闭环。

### 12. Nika AI（nikaai.app，补充发现）
- 来源：https://www.nikaai.app/ （**一方称**）
- 核心功能：行为+技术面试对练、可复用场景、能力维度进度追踪、可导出给导师看的报告。
- 定价（一方称）：Plus $45.99 一次性（8 小时练习）、Advanced $65.99 一次性（13 小时、可协作）。
- 与五步闭环差异：一次性买断的面试对练 + 导出报告，不做匹配/改写。

---

## 二、总对比表

| 产品 | 来源链接 | 目标人群 | 核心功能（覆盖环节；模拟面试：文本/语音、多轮、点评） | AI 实现 | 定价 | 平台 | 查证状态 | 与五步闭环差异点 |
|---|---|---|---|---|---|---|---|---|
| Google Interview Warmup | https://grow.google/certificates/interview-warmup/ | 面试新手、英文 | 模拟面试（语音为主，可文本；**单题、无多轮追问、不打分**，仅词频/术语洞察）；不做匹配/改写/导出 | 仅语音转写+词频分析，不用 AI 出题 | 完全免费、免注册 | Web | 已查证 | 最浅的开口暖身，不基于简历/JD、不打分不闭环 |
| Yoodli | https://yoodli.ai/pricing | 沟通/面试练习、企业培训、英文 | Live AI roleplay 对练（语音；口才维度反馈）；不强调简历/JD 出题；不做匹配/改写/导出 | 未公开模型，roleplay 计数制 | Starter $0(5次)；Pro $8/月年付；Advanced $20/月年付 | Web | 已查证 | 通用口才对练，非求职闭环 |
| Final Round AI | https://www.finalroundai.com/en | 技术/产品/数据岗面试者、多语言含中文界面 | 匹配雏形(Goal+JD解析)＋**模拟面试(语音、按简历/JD、8场景、多轮、自动debrief多维度打分、薄弱点重练)**；不做改写高亮/导出 | 未公开模型，实时流式 | Free $0；Pro $25/月(年付$300)、月付$90 | 桌面 App(mac/Win) | 已查证 | 模拟面试最深，但缺改写高亮与导出，且主打 live 辅助、桌面端 |
| InterviewBuddy | https://interviewbuddy.net/niche/ai | 低成本练习者、英文 | 模拟面试（AI $5.99 无限次+即时反馈报告/情感分析；真人1:1约$39.99）；不做匹配/改写/导出 | 未公开模型 | AI 线 $5.99；真人 $39.99/场 | Web | 已查证 | 题库+即时报告，深度中等，无闭环 |
| Jobright | https://jobright.ai/ ；价格转述 | 海投者、英文 | 匹配＋简历 tailoring＋自动填表/投递＋AI 助手 Orion；**无模拟面试** | 未公开模型 | Free；Turbo 约 $17.99/周、$39.99/月（转述） | Web+扩展 | 一方称+转述 | 匹配/改写强、投递自动化，完全不做面试 |
| Huntr | https://huntr.co/pricing | 求职全流程管理者、英文 | **匹配打分＋简历 tailored＋求职信＋PDF导出＋投递追踪**；**无模拟面试** | 未公开模型，关键词提取+匹配打分 | Basic $0；Pro $40/月(季付≈$30/月) | Web+Chrome扩展 | 已查证 | 匹配/改写/导出完整，唯独缺模拟面试 |
| LazyApply | https://lazyapply.com/ （价格转述） | 一键海投者、英文 | 自动批量投递＋求职信；**无匹配打分/改写/模拟面试** | 未公开 | Basic $99/年、Premium $149/年、Ultimate $999/年（转述） | 浏览器扩展 | 转述 | 纯自动投递，与闭环几乎无重叠 |
| Huru | https://huru.ai/ | 面试前练习、242角色/5语言 | **模拟面试(语音/视频、可粘JD、live追问多轮、自研模型逐题打分、debrief)**；并含简历 tailoring；不做改写高亮/导出 | 自称自研打分模型，底层未公开 | 免费 | Web | 已查证 | 最接近"粘JD→面试→打分"且免费，但无高亮改写、无导出、中文未见 |
| Qcard | https://qcardai.com/ | 应届生、英文 | **模拟面试(粘JD出题、自适应追问多轮、1–10打分、Voice coach)＋简历解析**；不做匹配结构化/改写高亮/导出 | 未公开模型，WebSocket 子秒流式 | Free $0(5分钟/月)；Pro $21.50/月 | Web | 已查证 | JD驱动+追问+打分很深、面向应届生，但无匹配打分/高亮改写/导出 |
| 牛面 | https://niumianoffer.com/ | 中文技术岗求职者 | AI 技术面试对练＋多维报告/题目拆解/改进清单；未体现匹配/改写/导出 | 基于10万+真题训练（一方称） | 未查到 | Web | 一方称 | 中文技术面试最直接同类，闭环待证 |
| 面灵AI | https://www.mianlingai.com/doc/faq/ | 中文求职者 | AI 模拟面试/笔试，按时长计费；不做匹配/改写闭环 | 未公开 | 送30分钟+1次模拟；29/89/199元时长包（一方称） | Web | 一方称 | 中文按时长计费对练工具 |
| Nika AI | https://www.nikaai.app/ | 需面试对练者 | 行为+技术对练、能力维度追踪、可导出给导师的报告 | 未公开 | Plus $45.99、Advanced $65.99 一次性（一方称） | Web | 一方称 | 一次性买断对练+导出报告，不做匹配/改写 |

---

## 三、对本项目（五步闭环：粘简历+JD→匹配打分→改写高亮→模拟面试→导出）的关键结论

1. **"匹配打分 + 简历改写 + 导出"这条线**：Huntr、Jobright 已做得很完整（甚至延伸到自动投递），但**几乎都不做模拟面试**。
2. **"模拟面试"这条线**：Final Round AI、Huru、Qcard、牛面做得最深——共性是**基于简历/JD 出题、语音/多轮追问、结束自动打分复盘**；但它们**普遍不做"匹配结构化打分"和"改写前后对比高亮"，也不把导出 PDF/Word 当卖点**。
3. **市场空档 = 把两端接成闭环**：既没有一个产品同时做"①匹配打分 → ③简历改写高亮 → ④基于该简历/JD 的多轮模拟面试+点评 → ⑤导出"。Final Round 最接近但缺③⑤且要桌面端；Huru/Qcard 免费且面试深但缺②③⑤。
4. **中文支持**：英文产品普遍未明确中文面试；中文侧（牛面、面灵AI）以技术对练为主，未见到"匹配→改写→面试→导出"完整闭环。这是本项目（面向中文技术实习求职者）的差异化空间。
5. **伦理注意**：Final Round AI / Qcard / interviewbuddy.expert 等都带"真实面试中实时辅助（live copilot / steath）"功能；本项目定位为**考前练习**，应与"面试中作弊辅助"品类明确切割。
