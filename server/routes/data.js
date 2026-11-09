// 数据路由：resumes / jds 的 CRUD（BFF 合同：前端 remote 适配器唯一依赖）
// 成功响应 { data, meta: { requestId } }；错误走 errorHandler 的 { error, requestId } 合同
// 排序合同：列表创建时间倒序（与前端 local 适配器一致）
// 数据语义与前端 repository/types.ts 对齐：get 不存在返回 null，update 不存在 404，remove 幂等
import { Router } from 'express'
import { validate, LIMITS } from '../middleware/validate.js'
import store, { listSort } from '../services/dataStore.js'

const router = Router()

// ---- 校验规则（title/company ≤ 100：UI 输入框上限；正文沿用合同 5.3 上界）----
const TITLE_MAX = 100
const titleRule = { required: true, type: 'string', maxLength: TITLE_MAX }
const titleOptionalRule = { required: false, type: 'string', maxLength: TITLE_MAX }
const contentRule = { required: true, type: 'string', maxLength: LIMITS.RESUME_MAX }
const contentOptionalRule = { required: false, type: 'string', maxLength: LIMITS.RESUME_MAX }
const companyOptionalRule = { required: false, type: 'string', maxLength: TITLE_MAX }
const skillsRule = { required: false, type: 'array', maxItems: 50 }

// validate 的 array 规则只认 {role, content} 消息体，requireSkills 单独补元素校验
function validSkills(req, res, next) {
  const skills = req.body?.requireSkills
  if (skills !== undefined && (!Array.isArray(skills) || skills.some((s) => typeof s !== 'string'))) {
    req.ctx.log.errorCode = 'VALIDATION_FAILED'
    return res.status(400).json({
      error: { code: 'VALIDATION_FAILED', message: '请求参数不合法', details: [{ field: 'requireSkills', issue: '必须是字符串数组' }] },
      requestId: req.ctx.requestId,
    })
  }
  next()
}

function ok(res, req, data) {
  res.json({ data, meta: { requestId: req.ctx.requestId } })
}

// ---- resumes ----
router.get('/resumes', (req, res) => {
  ok(res, req, store.list('resumes').sort(listSort))
})

router.get('/resumes/:id', (req, res) => {
  ok(res, req, store.get('resumes', req.params.id)) // 不存在返回 null：正常业务态
})

router.post('/resumes', validate({ title: titleRule, rawContent: contentRule }), (req, res) => {
  const now = Date.now()
  const record = {
    id: crypto.randomUUID(),
    title: req.body.title,
    rawContent: req.body.rawContent,
    createTime: now,
    updatedAt: now,
  }
  ok(res, req, store.create('resumes', record))
})

router.patch(
  '/resumes/:id',
  validate({ title: titleOptionalRule, rawContent: contentOptionalRule }),
  (req, res, next) => {
    // 只放行业务上可编辑的字段（id/createTime 不可变，与前端 ResumePatch 对齐）
    const patch = {}
    for (const key of ['title', 'rawContent', 'modifiedContent', 'suggestNotes']) {
      if (req.body[key] !== undefined) patch[key] = req.body[key]
    }
    try {
      ok(res, req, store.update('resumes', req.params.id, patch))
    } catch (err) {
      next(err)
    }
  },
)

router.delete('/resumes/:id', (req, res) => {
  store.remove('resumes', req.params.id)
  ok(res, req, { ok: true }) // 幂等：目标不存在也 200
})

// ---- jds ----
router.get('/jds', (req, res) => {
  ok(res, req, store.list('jds').sort(listSort))
})

router.get('/jds/:id', (req, res) => {
  ok(res, req, store.get('jds', req.params.id))
})

router.post('/jds', validate({ title: titleRule, rawText: contentRule, requireSkills: skillsRule }), validSkills, (req, res) => {
  const now = Date.now()
  const record = {
    id: crypto.randomUUID(),
    title: req.body.title,
    company: req.body.company ?? '',
    rawText: req.body.rawText,
    requireSkills: req.body.requireSkills ?? [], // 缺省空数组（实现层补齐）
    createTime: now,
    updatedAt: now,
  }
  ok(res, req, store.create('jds', record))
})

router.patch(
  '/jds/:id',
  validate({ title: titleOptionalRule, rawText: contentOptionalRule, company: companyOptionalRule, requireSkills: skillsRule }),
  validSkills,
  (req, res, next) => {
    const patch = {}
    for (const key of ['title', 'company', 'rawText', 'requireSkills']) {
      if (req.body[key] !== undefined) patch[key] = req.body[key]
    }
    try {
      ok(res, req, store.update('jds', req.params.id, patch))
    } catch (err) {
      next(err)
    }
  },
)

router.delete('/jds/:id', (req, res) => {
  store.remove('jds', req.params.id)
  ok(res, req, { ok: true })
})

export default router
