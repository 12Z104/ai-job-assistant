# AI 求职助手 · 架构总纲（v1.1）

> 状态：**风格已定稿（A · 纸感极简，2026-11-06）**；C1/C2/C4 三项决策仍待确认（见第 12 章），确认前不动业务代码。
> 定位：回答"这个项目接下来怎么长，才不会长歪"。前端骨架 → 后端骨架 → 数据库 → 上线，四段推进，但**合同先冻结**。
> 真源优先级：当前代码 > 本文 > issue。风格参考样片：`docs/design/style-preview.html?style=paper`。

---

## 0. 一句话结论

**顺序照你说的走（前端 → 后端 → 数据库 → 上线），但有一件事必须提前到第 0 天：把"前后端合同 + 数据访问接口"冻结。**
否则前端写完再改后端，等于把 4 个页面重写一遍——这才是"崩盘"的真正来源，不是技术选型。

---

## 1. 现状体检（基于当前代码，775 行）

### 1.1 家底（事实）

| 项 | 现状 |
|---|---|
| 前端 | React 19 + TS strict + Vite 8 + react-router-dom 7，5 个路由 |
| 样式 | `index.css` 只有 7 个 CSS 变量；组件 100% 内联 style |
| 组件 | 只有 `Panel`、`Layout` 两个；`ResumeEditor`/`JdEditor`/`ResultPanel` 错放在 `pages/` 下 |
| 状态 | 全部 `useState` + `localStorage` 直读直写，无数据层抽象 |
| 后端 | 单文件 `server/index.js` 278 行，4 个端点，业务逻辑与 HTTP、prompt、fetch 混在一起 |
| 数据 | `localStorage` 三个 key（`resume`/`jd`/`interview-history`），单份，无 id |
| 类型 | `src/types/index.ts` 23 行，`MatchResult`/`InterviewSession` 只在文档里，代码里没有 |
| 测试 | 0 |
| CI | 0 |

### 1.2 六个会崩盘的点（按严重度）

| # | 问题 | 后果 | 级别 |
|---|---|---|---|
| 1 | **前端解析的是 DeepSeek 原始协议**（`choices[0].delta.content`） | 换模型/换供应商 = 前端全改；后端形同虚设 | 阻断 |
| 2 | **SSE 按 chunk 切行解析**，跨 chunk 的半行被 `catch` 静默丢弃 | 流式输出偶发丢字，且无法复现 | 阻断 |
| 3 | 页面直接读写 `localStorage`（`AnalyzePage` 里两个 `useEffect`） | 接数据库时 4 个页面全改，且 localStorage 无 id、无多份能力 | 阻断 |
| 4 | 内联样式散落，颜色/间距硬编码（`#d0d7de`、`padding: 16`、emoji 当图标） | 页面越多越像 5 个产品；换主题/加暗色 = 全局返工 | 设计风险 |
| 5 | 后端 4 个端点 90% 重复（拼 prompt + fetch + 转发） | 加第 5 个功能要复制 50 行；改超时/重试要改 4 处 | 设计风险 |
| 6 | 用户点"停止"只掐断前端，后端上游请求仍在跑 | 白烧 token；无配额/无限流，公网暴露即被刷 | 设计风险 |

**结论：现在不是"要不要重构"，而是"下次加功能前必须先立骨架"，否则每加一个功能都在给这 6 个坑添土。**

---

## 2. 核心架构决策（ADR 摘要）

| # | 决策 | 结论 | 为什么不选另一条 |
|---|---|---|---|
| D1 | 推进顺序 | 前端骨架 → 后端骨架 → 数据库 → 上线，**但 P0 先冻结合同** | 纯串行 = 前端按 localStorage 写死，接后端时重写；纯并行 = 两头对不上 |
| D2 | 前端框架 | 保持 React 19 + TS strict + Vite 8 | Next.js 的 SSR 对"纯工具型 SPA"无收益，还引入服务端渲染心智负担 |
| D3 | UI 组件库 | **Ant Design 5 + ConfigProvider token 映射 + `components/ui` 薄封装** | Tailwind+shadcn：需手搓 20+ 组件、无升级保障，3 周内做不完；纯自研：重复造轮子 |
| D4 | 样式方案 | **CSS 变量 token 唯一来源 + CSS Modules 写布局 + antd 主题从 token 派生** | CSS-in-JS 运行时开销与两套心智；直接裸写内联 = 现状 |
| D5 | 状态管理 | 不引入 Redux/Zustand/TanStack Query；repository + 页面 hook + 一个 `WorkspaceContext` | 跨页共享只有"当前选中的简历/JD"，为它引全局 store 是过早抽象 |
| D6 | 数据访问 | `services/repository` 定义接口，`local` 与 `remote` 两套实现，靠 `VITE_DATA_SOURCE` 切换 | 页面直连 storage = 接库时全改；直连 supabase-js = 前端拿库凭证、绕过后端 |
| D7 | 后端形态 | **BFF 单入口**：Express 只做 AI 网关 + 鉴权 + 配额 + 数据编排，前端不直连数据库 | 前端直连 Supabase：权限逻辑分散两处、导出/配额无处安放 |
| D8 | 认证 | Supabase Auth 发 JWT（前端只做登录），所有数据请求走 Express 并验签 | 自研密码/会话：安全坑深、非本项目价值点 |
| D9 | 数据库 | Supabase Postgres + RLS（行级权限）+ SQL 迁移文件 | MongoDB：简历/JD/结果都是强结构 + 关系（session→messages），文档库在这里没优势 |
| D10 | 部署 | 前端 Vercel、后端 Render、库 Supabase；**P1 就打通 preview，不留到最后** | "最后统一部署"是最大崩盘点：CORS / SSE 缓冲 / 冷启动会一次性爆 |
| D11 | 图标 | lucide-react 统一线性图标，**禁用 emoji 当图标** | emoji 跨平台渲染不一致，且拉低专业感 |
| D12 | 文案 | 面向用户的文案集中 `src/locales/zh-CN.ts`，组件内不写中文字面量 | 不装 i18n 框架，只留"集中管理"这个最低成本的可选项 |

---

## 3. 前端骨架 · 7 件事先定标准

### ① 设计风格（已定稿：A · 纸感极简 / Paper）

**气质关键词**：安静、克制、像一份排版讲究的简历。靠留白和 1px 细线建立秩序，不用阴影和渐变撑场面；动效慢而轻，只做"内容浮现"，不做装饰性动画。

**色彩 token（唯一色值来源，`styles/tokens.css`）**

| Token | 值 | 用途 |
|---|---|---|
| `--color-bg` | `#F7F6F1` | 页面底（暖白纸面） |
| `--color-surface` | `#FFFFFF` | 卡片 |
| `--color-surface-2` | `#FCFBF8` | 输入框底 / 次级表面 |
| `--color-line` | `#E6E3D9` | 1px 细线（边框唯一来源） |
| `--color-line-strong` | `#D6D2C4` | 强调线 / hover 边框 |
| `--color-ink` | `#1A1A17` | 主文本（近墨黑，对白 16.4:1） |
| `--color-ink-2` | `#57544C` | 次要文本（对白 7.5:1） |
| `--color-ink-3` | `#767162` | 占位符 / 说明（对白 5.0:1，AA 下限之内） |
| `--color-accent` | `#2E5B4C` | 墨绿主色（按钮 / 激活态 / 分数环） |
| `--color-accent-hover` | `#254A3E` | 主色 hover |
| `--color-accent-soft` | `#E9EFEA` | 主色浅底（选中态 / 轻按钮） |
| `--mark-polish` | `#2F7D5B` | 改写标记：绿 = 润色 |
| `--mark-polish-soft` | `#EFF5F1` | 润色标记底色 |
| `--mark-suggest` | `#B7791F` | 改写标记：黄 = 建议补充 |
| `--mark-suggest-soft` | `#FAF3E6` | 补充标记底色 |
| `--color-danger` | `#B3403A` | 错误（暗红，不用亮红） |
| `--color-warning` | `#B7791F` | 警示 |
| `--color-info` | `#3E5F8A` | 中性提示 |

规则：语义色（danger/warning/info）是低饱和暗调，与主色同一气质；`--mark-polish` 独立命名，不许拿语义色顶替（改语义色不能影响改写高亮）。

**字体**

| 场景 | 规格 |
|---|---|
| 大标题 / 品牌 | `"Songti SC", Georgia, serif`，weight 400，`letter-spacing: .06em`（Windows 回退宋体，需在 P1 实机验证） |
| 正文 / UI | `system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif`，weight 400/500 |
| 数字 / 分数 | `Georgia, serif` + `font-variant-numeric: tabular-nums`（分数、时间、字数全部走它） |
| 字号阶梯 | 12 / 14 / 16 / 20 / 24 / 32（标题最大 32，落地页 hero 可到 38，只此一处例外） |
| 行高 | 标题 1.4 / 正文 1.6 / 长文本（简历正文）1.75 |

**几何与密度**

| Token | 值 |
|---|---|
| 圆角 | 控件与卡片 `2px`；大面板 `4px`；标签 `2px`；**禁止出现 8/12/16 圆角** |
| 边框 | 统一 `1px solid var(--color-line)`；禁止 2px 边框、禁止阴影替代边框 |
| 阴影 | 静止态**无阴影**；仅浮层（Modal/Popover）允许 `0 8px 24px rgba(46,91,76,.14)` |
| 间距 | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64（禁止 5/10/15/18） |
| 卡片内边距 | 16px；列表行高 44px；控件高度 sm 28 / md 36 / lg 44 |
| 分隔 | 卡片内部用细线分节，不用底色块；JD 引用块用 `border-left: 2px` |

**动效（慢、轻、有目的）**

| Token | 值 |
|---|---|
| 曲线 | `cubic-bezier(.22,.61,.36,1)`（缓出，纸感） |
| hover / 焦点 | 150–200ms |
| 内容入场 | 600–800ms，上浮 14px + 淡入，卡片错峰 80ms |
| 分数环 | 描边生长 1.15s（`stroke-dashoffset` 过渡，`stroke-linecap: butt`，线宽 4） |
| 维度条 | 宽度 900ms，错峰 90ms |
| 流式文本 | 打字机 + 光标闪烁（1s steps） |
| 禁止 | 弹跳、回弹、缩放入场、装饰性光斑 |
| 无障碍 | 必须实现 `prefers-reduced-motion` 降级（动效直接呈现终态） |

**落地规则**

1. 页面底加 4px 网格点阵纹理（`radial-gradient` 实现，opacity ≤ .5），只加在 `bg` 层，不进卡片。
2. 主按钮 = 墨绿实底白字，字距 `.08em`；次按钮 = 白底细线；轻按钮 = 主色浅底。
3. chip/标签 = 白底细线灰字，**不用彩色底**；彩色只属于语义色和改写标记。
4. 现有代码里的蓝白视觉、emoji 图标、`#d0d7de` 硬编码边框，全部在 P1/P3 按此表替换。

### ② 技术方案

| 项 | 标准 |
|---|---|
| 页面组织 | `pages/` 一个路由一个文件，只做组装，不写业务规则 |
| 路由 | react-router-dom 7，`createBrowserRouter` + 路由级 `ErrorBoundary` + 懒加载 `React.lazy`（首页不拆） |
| 启动 | `main.tsx` → Provider 树（Theme → Toast → Router）→ `App`，启动逻辑不超过 20 行 |
| 构建 | `npm run build` = `tsc -b && vite build`（硬门禁，0 error） |
| 环境变量 | 只允许 `VITE_` 前缀；`VITE_API_BASE`、`VITE_DATA_SOURCE=local|remote` |
| 请求 | 统一 `services/http.ts`：注入 baseURL、20s 超时、错误归一化成 `AppError`、带 `requestId` |
| 流式 | 统一 `services/sse.ts`：**带缓冲区解析**（跨 chunk 半行不能丢），单测覆盖 3 种切包场景 |
| 质量 | `npm run lint`（oxlint）0 告警；P2 起加 `vitest` 覆盖纯函数（sse 解析、diff 标记、分数计算） |
| 禁用 | 页面里出现 `fetch(`、`localStorage`、`alert(`、`window.confirm` —— 一律视为代码评审不通过 |

### ③ UI 组件库

**主线：Ant Design 5**（表单、弹窗、抽屉、上传、Tooltip、Message 这些"重交互件"自研成本极高）。

使用规则（三层，防止"组件库 + 自研"两套审美打架）：

| 层 | 位置 | 内容 | 规则 |
|---|---|---|---|
| L1 基础件 | `components/ui/` | Button / Input / Textarea / Card / Tag / Field / Modal / Drawer / Toast / Skeleton / EmptyState / ErrorState / Spinner | **从 antd 再导出并锁死默认 props**（size、圆角、阴影、无多余边框）。页面禁止直接 `import { Button } from 'antd'` |
| L2 结构件 | `components/layout/` | AppShell / PageHeader / SplitPane / Sidebar / Section | 组合 L1，**不含业务数据**，不许调接口 |
| L3 业务件 | `features/*/components/` | ScoreRing（分数环）、DiffHighlight（绿/黄标记）、StreamingText（打字机+光标）、StepTimeline（Agent 四步）、ChatBubble、ResumePicker | 可含业务语义，只被本域与 `pages/` 使用 |

必须自研、组件库给不了的 5 个（这是项目辨识度所在，也是面试能讲的点）：

1. `ScoreRing` —— 匹配分可视化（SVG 环形，分数 0-100，分段配色）
2. `DiffHighlight` —— 解析 `【改】/【补】` 标记 → 绿底/黄底 + 图例 + 逐条采纳
3. `StreamingText` —— 流式追加 + 光标 + 自动滚底 + 用户上滑时停止跟随
4. `StepTimeline` —— Agent 四步思考链，步骤状态 pending/running/done
5. `MatchRadar`/`DimensionBars` —— 维度分（技术匹配/经验匹配/表达匹配）

主题桥接：`styles/antd-theme.ts` 从 CSS token 生成 antd `ThemeConfig`（`colorPrimary`、`borderRadius`、`fontFamily`、`controlHeight`），**色值只写一次**。

### ④ 目录结构（目标态）

```
src/
  app/
    App.tsx              # Provider + Router 装配
    router.tsx           # 路由表 + 懒加载 + ErrorBoundary
    providers.tsx        # ConfigProvider(antd) / Toast / WorkspaceContext
  pages/
    HomePage.tsx
    MatchPage.tsx        # 匹配分析（三栏工作台）
    RewritePage.tsx      # 智能改写（diff 对比）
    InterviewPage.tsx    # 模拟面试（对话）
    AgentPage.tsx        # 优化 Agent（四步时间线）
    SettingsPage.tsx     # 数据管理 / 账号（P6）
    NotFoundPage.tsx
  features/
    resume/
      components/        # ResumePicker / ResumeCard / ResumeEditor
      hooks/             # useResumes / useActiveResume
      model.ts           # 领域纯函数（校验、摘要、字数统计）
      index.ts           # 唯一对外出口
    jd/  match/  rewrite/  interview/  export/   # 同构
  components/
    ui/                  # L1 基础件
    layout/              # L2 结构件
  services/
    http.ts
    sse.ts
    repository/
      types.ts           # ResumeRepository / JdRepository / ... 接口（唯一）
      local/             # localStorage 实现（P2）
      remote/            # HTTP 实现（P5 起）
      index.ts           # 按 VITE_DATA_SOURCE 选实现
  lib/                   # 无业务工具：id / format / debounce / assert / limits
  styles/
    tokens.css  global.css  antd-theme.ts
  locales/
    zh-CN.ts
  types/
    index.ts             # 跨域合同：Resume / JobJD / MatchResult / InterviewSession / API DTO
```

命名规则（写进 PR 检查清单）：

- 组件文件 `PascalCase.tsx`，一个文件一个导出组件
- hook `useXxx.ts`，返回对象而不是数组（可读性）
- 纯函数 `camelCase.ts`，同域放 `model.ts`，通用放 `lib/`
- 类型 `PascalCase`，一律进 `types/` 或 `features/*/model.ts`，**禁止文件内私有重复定义**
- 目录全小写，多词用连字符（`job-jd` 这种缩写不拆，保持 `jd`）
- 测试 `*.test.ts` 与被测文件同目录

### ⑤ 模块边界（谁拥有什么）

| 概念 | 唯一 owner | 禁止 |
|---|---|---|
| 路由与页面组装 | `src/app/router.tsx` + `src/pages/*` | 页面里写业务规则、写 fetch |
| 领域状态与领域组件 | `src/features/<domain>/` | A 域直接 import B 域内部文件（只能走 `index.ts`） |
| 通用 UI | `src/components/ui/*` | ui 组件里出现 `useNavigate` / 接口调用 / 业务字段名 |
| 结构布局 | `src/components/layout/*` | layout 里读数据 |
| 数据访问 | `src/services/repository/*` | 页面/feature 直接 `localStorage` 或 `fetch` |
| 跨域合同 | `src/types/index.ts` | 各域私自定义同名字段 |
| 样式常量 | `src/styles/tokens.css` | 组件内写 hex / 魔法 px |
| 文案 | `src/locales/zh-CN.ts` | 组件内写面向用户的中文长句 |
| 后端 HTTP / 校验 / 错误 | `server/routes` + `server/middleware` | service 层碰 `req`/`res` |
| Prompt | `server/prompts/*.md` | prompt 字符串写死在路由里 |
| 权限判定 | `server/middleware/auth.js` + RLS 策略 | 前端"藏按钮"当权限 |

**跨域通信铁律**：`features/a` 想用 `features/b` 的东西 → 要么 `b/index.ts` 导出，要么把共性上提到 `types/` 或 `lib/`，**不许深路径 import**。

### ⑥ 组件复用规则

1. **出现 ≥2 次才封装**（写第二遍时抽，不预判）。
2. **先找组件库，再在库上封装，最后才自研**；禁止 fork/魔改 antd 源码，禁止 `!important` 覆盖。
3. **一个组件只做一件事**：文件 > 200 行、props > 7 个、JSX 嵌套 > 3 层 → 必须拆。
4. **ui 组件必须闭环三态**：`default / loading / disabled`，容器类组件必须支持 `empty`。
5. **禁止把页面组件放进 `components/`**（当前 `pages/ResumeEditor.tsx`、`pages/ResultPanel.tsx` 就是错的，P2 迁到 `features/resume/components/`）。
6. **禁止复制粘贴改文案**：同结构不同文案 → 传 props；同结构不同数据 → 传数据。
7. 每个 L1/L2 组件有且只有一处定义样式，不允许多页面用 `style={{}}` 局部覆盖（只允许 `className` 变体 + CSS 变量）。

### ⑦ 样式系统

**三层，单向依赖：**

```
tokens.css（唯一色值/间距来源）
   ├── global.css + *.module.css（消费 var()）
   └── antd-theme.ts（读同名常量 → ThemeConfig）
```

- **token 命名**：`--color-primary-500`、`--color-text-secondary`、`--space-4`、`--radius-md`、`--shadow-md`、`--text-sm`、`--control-h-md`、`--duration-fast`。
- **禁令**：组件内禁止 `#` 开头的色值、禁止间距/字号/圆角写裸数字（`padding: 20px` 必须 `padding: var(--space-5)` 或 CSS Module 里映射）。
- **主题预留**：`[data-theme="dark"]` 只覆盖 token，不覆盖组件。本期只做 light，但结构必须支持（验收方式：手动加 `data-theme="dark"` 改 5 个变量，页面要能整体变暗而不花）。
- **多语言预留**：文案进 `locales/zh-CN.ts`，按域命名空间（`match.emptyHint`）；不装 i18n 库，但**组件里不出现中文字面量**。
- **响应式断点**：`sm 640 / md 768 / lg 1024 / xl 1280`；工作台 < lg 由三栏 → 单栏堆叠（输入在上、结果在下）。
- **可访问性底线**：所有可点击元素有 `:focus-visible` 环；对比度 ≥ 4.5:1；按钮用 `<button>` 不用 `<div onClick>`。

---

## 4. 数据访问抽象（防崩盘的核心 50 行）

```
页面/feature  →  useResumes()  →  repository.resumes.list()  →  localAdapter | remoteAdapter
```

```ts
// services/repository/types.ts —— 唯一接口，前后端都要认它
export interface ResumeRepository {
  list(): Promise<Resume[]>
  create(input: { title: string; rawContent: string }): Promise<Resume>
  update(id: string, patch: Partial<Pick<Resume, 'title' | 'rawContent'>>): Promise<Resume>
  remove(id: string): Promise<void>
}
```

- **P2**：只实现 `local/`（localStorage，带 schema 版本号 + 迁移函数）。
- **P5**：加 `remote/`（HTTP），页面与 feature **一行不改**，只改 `VITE_DATA_SOURCE`。
- 代价：约 50 行接口 + 2 个适配器。换来的是"接数据库不必重写 4 个页面"。

---

## 5. 后端骨架

### 5.1 分层与依赖方向

```
routes/（HTTP：解析、校验、状态码）
   ↓ 只能向下
services/（业务编排：组装 prompt、调 LLM、记账）
   ↓
llm/（provider 抽象：deepseek / 未来其他）
repositories/（P5 起：数据库访问）
   ↓
lib/（errors / logger / limits / guards）
```

铁律：**routes 不写 prompt，services 不碰 `req`/`res`，llm 不知道业务字段名**。

### 5.2 目标目录

```
server/
  index.js            # 只做 bootstrap：config 校验 → app → listen
  app.js              # 中间件装配顺序
  config.js           # env 校验，缺失直接启动失败（不许运行到一半才报 Key 缺失）
  routes/
    health.js  ai.js  resumes.js  jds.js  auth.js
  services/
    aiService.js      # 统一入口：任务类型 → prompt → provider → 记录用量
    matchService.js  rewriteService.js  interviewService.js
  llm/
    provider.js       # 接口：chat({ messages, stream, signal })
    deepseek.js
    stream.js         # 统一 SSE 事件编码器
  middleware/
    requestId.js  auth.js（P6）  validate.js  rateLimit.js  errorHandler.js  notFound.js
  repositories/       # P5 起
  prompts/
    analyze.v1.md  rewrite.v1.md  agent.v1.md  interview.v1.md  interview-summary.v1.md
  lib/
    errors.js  logger.js  limits.js  guards.js
```

### 5.3 接口合同（P0 冻结）

| 项 | 标准 |
|---|---|
| 前缀 | `/api` |
| 成功 | `200 { "data": ..., "meta": { "requestId": "..." } }` |
| 失败 | `4xx/5xx { "error": { "code": "VALIDATION_FAILED", "message": "人话", "details": [...] }, "requestId": "..." }` |
| 错误码 | `VALIDATION_FAILED` `UNAUTHENTICATED` `FORBIDDEN` `NOT_FOUND` `CONFLICT` `RATE_LIMITED` `UPSTREAM_TIMEOUT` `UPSTREAM_ERROR` `INTERNAL` |
| 超时 | 上游 30s；客户端 20s + abort |
| 取消 | 前端 abort → 后端监听 `req.on('close')` → abort 上游 `fetch`（**现在缺这一步**） |
| 上限 | 简历 ≤ 20k 字符、JD ≤ 8k、messages ≤ 40 条、body ≤ 256KB |

**AI 端点（全部 SSE）：**

```
POST /api/ai/analyze            { resumeText, jdText }
POST /api/ai/rewrite            { resumeText, jdText? }
POST /api/ai/agent              { resumeText, jdText }
POST /api/ai/interview/turn     { sessionId?, resumeText|resumeId, jdText|jdId, messages[] }
POST /api/ai/interview/summary  { sessionId? | messages[] }
```

**SSE 事件合同（前后端唯一约定，与模型供应商无关）：**

```
data: {"type":"meta","requestId":"...","model":"deepseek-chat","promptVersion":"analyze.v1"}
data: {"type":"delta","text":"匹配"}
data: {"type":"done","usage":{"prompt":812,"completion":430},"finishReason":"stop"}
data: {"type":"done","usage":{...},"finishReason":"stop","result":{...}}  ← 仅 analyze：result 为后端 schema 校验后的结构化结果 { score, dimensions[], strengths[], gaps[], suggestions[] }；校验不通过则降级为纯文本 delta 流，done 不带 result
data: {"type":"error","code":"UPSTREAM_TIMEOUT","message":"模型响应超时"}
```

> 这条是 D1 的核心价值：前端只认 `type`，换供应商（DeepSeek → 通义/Claude/自建）后端改一个文件，前端零改动。现在的代码把 `choices[0].delta.content` 写进 `useStreaming`，等于把供应商协议刻在前端。

### 5.4 权限边界

**身份三档：**

| 身份 | 标识 | 能力 | 备注 |
|---|---|---|---|
| 游客 guest | `deviceId`（前端生成，仅用于限流分桶） | 只用"无状态 AI 计算"：分析/改写/面试单轮；**不落库**；数据只在自己浏览器 | deviceId 可伪造 → **绝不能作为授权依据** |
| 用户 user | `userId`（Supabase Auth JWT 的 `sub`） | 上面全部 + 读写自己的简历/JD/结果/会话；查看自己的用量 | 所有资源强制 `ownerId` 校验 |
| 管理员 admin | `userId` + `profiles.role='admin'` | 维护 JD 示例库、模板库；看聚合用量（不看用户简历正文） | 本期可只留字段不建后台 |

**权限矩阵：**

| 资源 / 操作 | 游客 | 用户 | 管理员 |
|---|---|---|---|
| AI 分析 / 改写 / 面试 | ✅ 5 次/天/设备 | ✅ 50 次/天 | ✅ 不限（记日志） |
| 简历 / JD 增删改查 | ❌（仅本地） | ✅ 仅自己的 | ❌ |
| 匹配结果 / 面试记录 | ❌ | ✅ 仅自己的 | ❌ |
| JD 示例库 / 模板 | ✅ 只读 | ✅ 只读 | ✅ 读写 |
| 用量与配额 | ❌ | ✅ 自己的 | ✅ 全量聚合 |

**四条硬边界：**

1. **Key 边界**：`LLM_API_KEY`、`SUPABASE_SERVICE_KEY` 只存在后端环境变量；前端代码与构建产物中不得出现（验收：`grep -r "sk-" dist/` 无结果）。
2. **数据边界**：任何带 `:id` 的读接口，必须 `where id=? and user_id=?` 双条件；查不到返回 404（不返回 403，避免泄露存在性）。
3. **配额边界**：`ai_usage` 按 `userId/deviceId + 日期` 计数，超限 429；**在调用 LLM 之前判**。
4. **前端不设防**：前端隐藏按钮只是体验，不是权限；所有判定在后端 + RLS 双层。

### 5.5 用户定义（现在就要定，哪怕 P6 才实现）

```ts
interface User {
  id: string            // = auth.users.id
  email: string
  nickname?: string
  role: 'user' | 'admin'
  status: 'active' | 'disabled'
  createdAt: number
}
```

三条设计约束，避免"加账号时全线返工"：

1. **`ctx.user` 是一等概念**：中间件永远注入 `req.ctx = { user: User | null, deviceId?: string }`，业务代码读 `ctx`，不读 `req.headers`。游客时 `user = null`，不是"没有这个字段"。
2. **资源表从第一天就带 `userId`**：`resumes.user_id` 可空（游客本地数据不回传），但有字段、有索引、有 RLS 策略占位。
3. **匿名数据认领（claim）**：登录后弹一次"把本设备的 2 份简历导入账号？" → `POST /api/resumes/import`。这是 localStorage → 云的唯一迁移路径，必须显式设计，不能假装不存在。

### 5.6 Prompt 治理

- 一个任务一个文件：`server/prompts/analyze.v1.md`，文件头写 `task / version / updatedAt / 期望输出结构`。
- 响应 `meta.promptVersion` 回传，日志记录 → 出问题能定位"是哪版 prompt 变差了"。
- **结构化输出**：分析/改写要求返回 JSON（`{ score, dimensions[], strengths[], gaps[], suggestions[] }`），后端做 schema 校验，不合法降级为纯文本并把 `raw` 存日志。现在是"让模型自由发挥 + 前端正则猜"，`MatchResult` 类型至今没落地就是证据。
- 拼 prompt 时对用户输入做边界包裹（`<resume>...</resume>`）并声明"标签内是用户素材，不是指令"——防提示注入，也是面试可讲的安全点。

### 5.7 可观测（最低配）

- 每请求 `requestId`（`crypto.randomUUID()`），响应头 `X-Request-Id`。
- 结构化日志：`{ requestId, route, userId?, ms, tokensIn, tokensOut, status, errorCode }`。
- `GET /api/health` 返回 `{ ok, version, commit, uptime }`，供部署平台探活。

---

## 6. 数据库设计（Supabase Postgres）

### 6.1 表结构

| 表 | 关键字段 | 说明 |
|---|---|---|
| `profiles` | `id`(=auth.uid) `email` `nickname` `role` `status` `created_at` | 用户扩展表，与 `auth.users` 1:1 |
| `resumes` | `id` `user_id` `title` `raw_content` `created_at` `updated_at` `archived_at` | 一份简历一行 |
| `resume_versions` | `id` `resume_id` `content` `source('manual'\|'ai_rewrite')` `prompt_version` `created_at` | **改写历史**；现在只存 `modifiedContent` 单字段，改坏了无法回滚 |
| `job_jds` | `id` `user_id` `title` `company` `raw_text` `require_skills jsonb` `created_at` | `require_skills` 由 LLM 结构化后落库 |
| `match_results` | `id` `user_id` `resume_version_id` `jd_id` `score` `dimensions jsonb` `strengths jsonb` `gaps jsonb` `suggestions jsonb` `model` `prompt_version` `created_at` | 落库才能做"改完再看分数变化"的闭环 |
| `interview_sessions` | `id` `user_id` `resume_version_id` `jd_id` `status('active'\|'ended')` `summary jsonb` `started_at` `ended_at` | |
| `interview_messages` | `id` `session_id` `role('user'\|'agent')` `content` `seq` `created_at` | `seq` 保序，`(session_id, seq)` 唯一 |
| `ai_usage` | `id` `user_id?` `device_id?` `task` `tokens_in` `tokens_out` `latency_ms` `status` `created_at` | 配额判定 + 成本核算 |
| `jd_library` | `id` `title` `company` `raw_text` `tags text[]` `is_public` | 内置示例库，admin 写、所有人读 |

### 6.2 约束与索引

- 所有业务表：`user_id` 非空（`jd_library` 除外）+ `created_at`，复合索引 `(user_id, created_at desc)`。
- `match_results`：`(user_id, jd_id, created_at desc)`；`interview_messages`：`(session_id, seq)`。
- `score` 加 `check (score between 0 and 100)`；`role` 加 `check in ('user','admin')`。
- 一律 `timestamptz`，不用 `timestamp`。

### 6.3 RLS（真正的权限边界）

```sql
alter table resumes enable row level security;
create policy "own_resumes" on resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- 每张用户表都开 RLS + `for all` 策略，**默认拒绝**。
- 后端用 service key 时必须自己带 `user_id` 条件（service key 绕过 RLS，这是唯一的危险点，代码评审重点）。
- `jd_library`：`select` 允许 `is_public = true`，写仅 admin。
- **双层防御**：Express 校验一次 + RLS 兜底。只靠后端 = 一处漏判全泄露；只靠 RLS = 业务错误码不可控。

### 6.4 迁移与数据导入

- SQL 文件 `supabase/migrations/0001_init.sql`、`0002_rls.sql`…，**禁止在 Studio 手点生产库**。
- 本地 `supabase start` 跑同一套迁移，保证 dev/prod schema 一致。
- 数据导入：`POST /api/resumes/import`，body 为旧 `localStorage` 结构，做幂等（同内容同标题 24h 内不重复插）。

---

## 7. 部署与三套环境

| 环境 | 前端 | 后端 | 数据库 | 用途 |
|---|---|---|---|---|
| local | `vite dev :5173` | `node server :3001`（vite proxy） | Supabase 本地 / 无 | 日常开发 |
| preview | Vercel Preview（每 PR） | Render Preview | Supabase 分支或共享 dev 库 | 验收、截图、给面试官看 |
| prod | Vercel Production | Render Production | Supabase Production | 公网 |

必须提前处理的 6 个部署坑（这也是"部署别放最后"的理由）：

1. **CORS**：prod 只允许 `FRONTEND_ORIGIN` 白名单，preview 用通配子域。
2. **SSE 缓冲**：响应头加 `X-Accel-Buffering: no` + `Cache-Control: no-cache`，否则 Nginx/Render 会攒着不发，打字机变成"憋 20 秒一次性出"。
3. **免费实例休眠**：Render 免费 Web Service 15 分钟无请求会睡，首个请求 30s+ 冷启动 → SSE 首字节超时。方案：定时 ping（GitHub Actions 每 10 分钟）或升级付费。
4. **前端路由 404**：SPA 需要 rewrite 到 `index.html`（Vercel 自动，自建 Nginx 要配）。
5. **env 注入**：构建时 `VITE_API_BASE` 必须指向后端域名，不能写 `localhost`。
6. **日志与告警**：Render 日志 + Supabase 用量告警（免费额度被打满会停服）。

---

## 8. 实施计划（P0 → P7）

> 目标锚点：12 月初投简历。今天 11/4，留 3 天 buffer。

| 阶段 | 内容 | 产出 / 门禁 | 时间 |
|---|---|---|---|
| **P0 冻结** | 本文确认；拆 issue 树；建 `docs/` 与分支约定 | 你逐条签掉第 12 章的 4 个决策；issue 覆盖 P1-P7 | 11/4–11/5 |
| **P1 前端骨架** | tokens.css / global.css / antd-theme / ui 基础件 12 个 / AppShell / PageHeader / SplitPane / 空状态 / 路由壳（5 页占位） | 7 项标准全部落地；`build`+`lint` 0 error；Vercel preview 可打开；截图 4 张（首页/工作台/空态/移动端） | 11/5–11/9 |
| **P2 数据层** | `repository` 接口 + local 适配器；多份简历/JD 增删改查；`WorkspaceContext`；`services/sse.ts` 带缓冲解析 + 单测 | 刷新不丢；页面 0 处 `localStorage`；SSE 单测 3 例通过 | 11/10–11/13 |
| **P3 页面重构** | 匹配/改写/Agent/面试 四页迁到新骨架；三态（加载/空/错误）齐全；DiffHighlight、ScoreRing、StepTimeline、StreamingText 落地 | 4 页视觉一致（并排截图无可辨差异）；无 `alert`；无内联色值 | 11/14–11/19 |
| **— 前端交付线：此时已是可上线、可演示的游客版 —** | | | |
| **P4 后端骨架** | 分层拆分；统一错误码；SSE 统一事件；prompt 文件化 + 版本；abort 透传；限流；结构化日志 | 5 个 AI 端点契约一致；`curl` 覆盖 9 个错误码；停止生成后上游日志出现 aborted | 11/20–11/23 |
| **P5 数据库** | Supabase 建库；8 张表 + 索引 + RLS；迁移脚本；`remote` 适配器；`VITE_DATA_SOURCE=remote` 切换；导入接口 | 切到 remote 后 4 页零改动可用；用第二个账号访问他人 id 返回 404 | 11/24–11/26 |
| **P6 认证与配额** | 登录/登出；JWT 验签中间件；匿名数据认领；每日配额；`ai_usage` 记账 | 游客 5 次后 429；登录后数据在另一台设备可见；未登录访问 `/api/resumes` 401 | 11/27–11/29 |
| **P7 上线** | 域名、CORS、SSE 头、探活、用量告警、README 更新、issue 全关 | 公网链接 4 页可用；连续 3 天无 5xx；自己用真实简历走一遍闭环 | 11/30–12/2 |

**每阶段的"不许做"清单**（防止顺手扩大改造）：

- P1 不接真实接口、不碰 storage、不改业务逻辑（页面只是壳）
- P2 不美化页面（沿用旧视觉，只换数据源）
- P3 不加新功能（只做迁移 + 三态）
- P4 不改前端结构（只换 endpoint 与解析）
- P5 不改 UI（只切适配器）
- P6 不放宽权限（任何"先放开后面补"的写法都不合入）

---

## 9. 防崩盘机制（比技术选型更重要）

1. **合同先行**：`src/types/index.ts` + 本文 5.3 → 任何字段变更必须同时改「类型 + 后端 + prompt + 文档 + issue」，一次 commit。
2. **主干永远可构建可部署**：每个 P 阶段结束打 tag（`p1-skeleton`…），Vercel preview 必须能打开；任何一天 build 红了优先修，不叠加功能。
3. **issue 即任务**：每个 P 阶段拆 3-6 个 issue，一个 issue 一个 PR，PR 描述里贴验收证据（命令输出/截图）。
4. **回滚点**：数据库迁移只前滚不手改；前端每次发布 Vercel 可一键回滚；后端保持"上一版镜像可跑"。
5. **评审清单（写进 PR 模板）**：有没有页面直连 fetch/localStorage？有没有硬编码色值？有没有新增 `any`/`as`？错误态和空态有没有？接口有没有上界？权限有没有双条件？
6. **成本闸**：`ai_usage` 每日汇总，超过 ¥5/天 告警；prompt 里限制输出长度。

---

## 10. 明确不做（本期黑名单）

- ❌ 引入 Next.js / SSR / RSC（无收益，心智负担大）
- ❌ Redux / Zustand / TanStack Query（当前规模用不上）
- ❌ 微前端、Monorepo、自研组件库发布 npm
- ❌ GraphQL、WebSocket（SSE 够用）
- ❌ Docker Compose 全家桶本地编排（Supabase CLI 够）
- ❌ 单元测试覆盖率指标（只覆盖纯函数与合同，不追数字）
- ❌ 暗色主题、多语言**实现**（只留结构）

---

## 11. 这套方案怎么讲给面试官（一句话版）

> "我先冻结前后端合同（SSE 统一事件 + 错误码 + repository 接口），再按前端骨架 → 后端 → 数据库推进。前端从第一天就不直连存储，所以接 Supabase 时 4 个页面零改动；后端只做 AI 网关和权限边界，数据权限用 RLS 兜底。每一步都有门禁和可回滚点。"

---

## 12. 与现有宪法冲突 & 待你确认

| # | 冲突 | 现状 | 本方案 | 需要你决定 |
|---|---|---|---|---|
| C1 | 产品范围 | `PRODUCT.md` / `PROJECT_PLAN.md`：**第一版不做账号、不做云同步** | 目标含数据库 + 用户 + 权限 | 是否把「账号+云同步」正式提为 V1.5（P5-P6），并同步更新产品真源？ |
| C2 | Owner Map | `AGENTS.md` 只定义 `pages/components/hooks/services/types` | 新增 `app/` `features/` `components/ui` `services/repository` `styles/` `locales/` | 是否授权我更新 AGENTS.md 的 Owner Map（宪法变更）？ |
| C3 | 视觉方向 | `AGENTS.md`：复用现有 token，禁止另起审美 | **✅ 已确认（2026-11-06）：选 A · 纸感极简**，以第 3 章①的 Paper 规范全面替换现有蓝白视觉 + 去 emoji 图标 + 内联样式转 CSS Modules。注意：这与 AGENTS.md「禁止另起审美方向」冲突，需随 C2 一并修订该条款 | 已随风格选择确认；条款修订并入 C2 |
| C4 | 技术栈 | 无 UI 库 | 新增 `antd` `lucide-react` `@supabase/supabase-js`（+ dev: `vitest`） | 是否同意新增这 3 个运行时依赖？ |

> C3 已确认（风格 = Paper）。剩余 **C1 / C2 / C4** 三条同意后 → 我把本文转正（写进 AGENTS.md Owner Map + README 架构章节），拆 issue，开始 P1。
> 有不同意的 → 说明理由，我改本文再确认。**在确认前不动任何业务代码。**
