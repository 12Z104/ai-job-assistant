import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Briefcase, CircleAlert, CircleCheck, Lightbulb, Plus } from 'lucide-react'
import { PageHeader, SplitPane } from '../components/layout'
import { Button, Card, EmptyState, ErrorState, Field, Input, Skeleton, Spinner, Tag, Textarea, useToast } from '../components/ui'
import { repository, RepositoryError } from '../services/repository'
import { useStreaming } from '../hooks/useStreaming'
import type { AnalyzeResult, JobJD, Resume } from '../types'
import { DimensionBars, ResumeList, ScoreRing } from '../features/match'
import s from './MatchPage.module.css'

const RESUME_TITLE_MAX = 60
const CONTENT_MAX = 20_000
const JD_TITLE_MAX = 60
const COMPANY_MAX = 40
const JD_TEXT_MAX = 8_000

interface ResumeDraft {
  id: string
  title: string
  content: string
}

interface JdDraft {
  id: string
  title: string
  company: string
  content: string
}

interface LoadError {
  code: string
  message: string
}

function toLoadError(error: unknown): LoadError {
  if (error instanceof RepositoryError) {
    return { code: error.code, message: error.message }
  }
  return { code: 'UNKNOWN', message: error instanceof Error ? error.message : '未知错误' }
}

/**
 * 匹配分析页：三栏工作台（简历列表 / 简历 + JD 双编辑 / 结果区）。
 * 页面只做组装与状态编排，数据一律走 repository，选中态同步 URL query。
 */
export default function MatchPage() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [resumes, setResumes] = useState<Resume[]>([])
  const [jds, setJds] = useState<JobJD[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<LoadError | null>(null)
  const [savingResume, setSavingResume] = useState(false)
  const [savingJd, setSavingJd] = useState(false)

  /* 编辑覆盖层：只存"用户改过但未保存"的草稿，键对应当前选中记录 id。
     未覆盖时草稿直接从选中记录派生，切换选中 / 保存 / 新建后自动回到记录真值，
     避免 setState-in-effect 同步草稿。 */
  const [resumeEdits, setResumeEdits] = useState<ResumeDraft | null>(null)
  const [jdEdits, setJdEdits] = useState<JdDraft | null>(null)

  const resumeId = searchParams.get('resume')
  const jdId = searchParams.get('jd')
  const selectedResume = resumes.find((item) => item.id === resumeId) ?? null
  const selectedJd = jds.find((item) => item.id === jdId) ?? null

  /* AI 匹配分析流：请求/解析/取消/错误全部收口在 useStreaming，页面零 fetch */
  const analysis = useStreaming<AnalyzeResult>('/api/ai/analyze')

  const resumeDraft: ResumeDraft | null = selectedResume
    ? resumeEdits && resumeEdits.id === selectedResume.id
      ? resumeEdits
      : { id: selectedResume.id, title: selectedResume.title, content: selectedResume.rawContent }
    : null

  const jdDraft: JdDraft | null = selectedJd
    ? jdEdits && jdEdits.id === selectedJd.id
      ? jdEdits
      : {
          id: selectedJd.id,
          title: selectedJd.title,
          company: selectedJd.company,
          content: selectedJd.rawText,
        }
    : null

  /* 拉取数据体：不含同步 setState，可安全在 mount effect 与重试事件中复用 */
  const fetchAll = useCallback(async () => {
    try {
      const [resumeList, jdList] = await Promise.all([repository.resumes.list(), repository.jds.list()])
      setResumes(resumeList)
      setJds(jdList)
      setError(null)
    } catch (err) {
      setError(toLoadError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- 挂载时从 repository（外部系统）拉取数据，effect 的合法用途
    void fetchAll()
  }, [fetchAll])

  /** 重试出口：由用户事件触发，先回到加载态再拉取 */
  const retry = () => {
    setError(null)
    setLoading(true)
    void fetchAll()
  }

  /* 选中态同步 URL：无参数或参数失效时默认选第一条（replace 不产生历史记录） */
  useEffect(() => {
    if (loading || error) return
    const firstResume = resumes[0]
    if (!firstResume) return
    if (!resumeId || !resumes.some((item) => item.id === resumeId)) {
      setSearchParams(
        (prev) => {
          prev.set('resume', firstResume.id)
          return prev
        },
        { replace: true },
      )
    }
  }, [loading, error, resumes, resumeId, setSearchParams])

  useEffect(() => {
    if (loading || error) return
    const firstJd = jds[0]
    if (!firstJd) return
    if (!jdId || !jds.some((item) => item.id === jdId)) {
      setSearchParams(
        (prev) => {
          prev.set('jd', firstJd.id)
          return prev
        },
        { replace: true },
      )
    }
  }, [loading, error, jds, jdId, setSearchParams])

  const resumeDirty =
    selectedResume !== null &&
    resumeDraft !== null &&
    (resumeDraft.title !== selectedResume.title || resumeDraft.content !== selectedResume.rawContent)

  const jdDirty =
    selectedJd !== null &&
    jdDraft !== null &&
    (jdDraft.title !== selectedJd.title ||
      jdDraft.company !== selectedJd.company ||
      jdDraft.content !== selectedJd.rawText)

  async function handleCreateResume() {
    try {
      const created = await repository.resumes.create({ title: '未命名简历', rawContent: '' })
      setResumes((prev) => [created, ...prev])
      setResumeEdits(null)
      setSearchParams(
        (prev) => {
          prev.set('resume', created.id)
          return prev
        },
        { replace: true },
      )
    } catch (err) {
      toast.error(toLoadError(err).message)
    }
  }

  async function handleDeleteResume(id: string) {
    try {
      await repository.resumes.remove(id)
      setResumes((prev) => prev.filter((item) => item.id !== id))
      setResumeEdits(null)
      if (id === resumeId) {
        setSearchParams(
          (prev) => {
            prev.delete('resume')
            return prev
          },
          { replace: true },
        )
      }
      toast.success('简历已删除')
    } catch (err) {
      toast.error(toLoadError(err).message)
    }
  }

  async function handleSaveResume() {
    if (!selectedResume || !resumeDraft || !resumeDirty) return
    setSavingResume(true)
    try {
      const updated = await repository.resumes.update(selectedResume.id, {
        title: resumeDraft.title.trim() || '未命名简历',
        rawContent: resumeDraft.content,
      })
      setResumes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setResumeEdits(null)
      toast.success('简历已保存')
    } catch (err) {
      toast.error(toLoadError(err).message)
    } finally {
      setSavingResume(false)
    }
  }

  async function handleCreateJd() {
    try {
      const created = await repository.jds.create({ title: '未命名职位', company: '', rawText: '' })
      setJds((prev) => [created, ...prev])
      setJdEdits(null)
      setSearchParams(
        (prev) => {
          prev.set('jd', created.id)
          return prev
        },
        { replace: true },
      )
    } catch (err) {
      toast.error(toLoadError(err).message)
    }
  }

  async function handleSaveJd() {
    if (!selectedJd || !jdDraft || !jdDirty) return
    setSavingJd(true)
    try {
      const updated = await repository.jds.update(selectedJd.id, {
        title: jdDraft.title.trim() || '未命名职位',
        company: jdDraft.company.trim(),
        rawText: jdDraft.content,
      })
      setJds((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setJdEdits(null)
      toast.success('JD 已保存')
    } catch (err) {
      toast.error(toLoadError(err).message)
    } finally {
      setSavingJd(false)
    }
  }

  /** 开始分析：用当前编辑草稿发起流式请求（未保存的修改也参与分析） */
  function handleAnalyze() {
    if (!resumeDraft || !jdDraft) return
    if (!resumeDraft.content.trim()) {
      toast.error('请先填写简历正文再开始分析')
      return
    }
    if (!jdDraft.content.trim()) {
      toast.error('请先填写 JD 正文再开始分析')
      return
    }
    void analysis.start({ resumeText: resumeDraft.content, jdText: jdDraft.content })
  }

  /* 结构化结果可分析性：简历 + JD 齐备即可发起 */
  const canAnalyze = resumeDraft !== null && jdDraft !== null

  /* ---- 三态：加载 ---- */
  if (loading) {
    return (
      <div className={`rise ${s.page}`}>
        <PageHeader title="简历匹配分析" desc="贴简历 + JD，AI 输出结构化打分、亮点、差距与建议" />
        <SplitPane
          left={
            <Card title="我的简历">
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          }
          center={
            <Card title="简历与 JD">
              <Skeleton active title paragraph={{ rows: 8 }} />
            </Card>
          }
          right={
            <Card title="匹配结果">
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          }
        />
      </div>
    )
  }

  /* ---- 三态：错误（repository 抛 RepositoryError，展示错误码 + 重试） ---- */
  if (error) {
    return (
      <div className={`rise ${s.page}`}>
        <PageHeader title="简历匹配分析" desc="贴简历 + JD，AI 输出结构化打分、亮点、差距与建议" />
        <Card title="我的简历">
          <ErrorState
            title="数据加载失败"
            desc={`错误码 ${error.code}：${error.message}`}
            onRetry={retry}
          />
        </Card>
      </div>
    )
  }

  /* ---- 三态：空（无任何简历，中右栏引导） ---- */
  const empty = resumes.length === 0

  return (
    <div className={`rise ${s.page}`}>
      <PageHeader title="简历匹配分析" desc="贴简历 + JD，AI 输出结构化打分、亮点、差距与建议" />
      <SplitPane
        left={
          <Card title="我的简历">
            <ResumeList
              resumes={resumes}
              selectedId={resumeId}
              onSelect={(id) =>
                setSearchParams(
                  (prev) => {
                    prev.set('resume', id)
                    return prev
                  },
                  { replace: true },
                )
              }
              onCreate={() => void handleCreateResume()}
              onDelete={(id) => void handleDeleteResume(id)}
            />
          </Card>
        }
        center={
          <div className={s.centerStack}>
            <Card title="简历正文">
              {selectedResume && resumeDraft ? (
                <div className={s.editorStack}>
                  <Field label="简历标题" hint={`${resumeDraft.title.length}/${RESUME_TITLE_MAX}`}>
                    <Input
                      value={resumeDraft.title}
                      maxLength={RESUME_TITLE_MAX}
                      placeholder="如：后端开发-2026 春招"
                      onChange={(event) =>
                        setResumeEdits({ ...resumeDraft, title: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="简历正文" hint={`${resumeDraft.content.length}/${CONTENT_MAX}`}>
                    <Textarea
                      rows={12}
                      value={resumeDraft.content}
                      maxLength={CONTENT_MAX}
                      placeholder="粘贴简历正文（Markdown 或纯文本均可）…"
                      onChange={(event) =>
                        setResumeEdits({ ...resumeDraft, content: event.target.value })
                      }
                    />
                  </Field>
                  <div className={s.editorActions}>
                    <Button
                      type="primary"
                      disabled={!resumeDirty}
                      loading={savingResume}
                      onClick={() => void handleSaveResume()}
                    >
                      保存简历
                    </Button>
                    {resumeDirty && <span className={s.dirtyHint}>有未保存的修改</span>}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="暂无选中简历"
                  desc={empty ? '先在左侧新建一份简历。' : '在左侧选择一份简历后开始编辑。'}
                />
              )}
            </Card>

            <Card title="职位 JD">
              {selectedJd && jdDraft ? (
                <div className={s.editorStack}>
                  <div className={s.jdChips}>
                    {jds.map((jd) => (
                      <Tag
                        key={jd.id}
                        tone={jd.id === selectedJd.id ? 'polish' : 'neutral'}
                        onClick={() =>
                          setSearchParams(
                            (prev) => {
                              prev.set('jd', jd.id)
                              return prev
                            },
                            { replace: true },
                          )
                        }
                      >
                        {jd.title}
                      </Tag>
                    ))}
                  </div>
                  <Field label="职位名称" hint={`${jdDraft.title.length}/${JD_TITLE_MAX}`}>
                    <Input
                      value={jdDraft.title}
                      maxLength={JD_TITLE_MAX}
                      placeholder="如：Go 后端开发工程师"
                      onChange={(event) => setJdEdits({ ...jdDraft, title: event.target.value })}
                    />
                  </Field>
                  <Field label="公司" hint={`${jdDraft.company.length}/${COMPANY_MAX}`}>
                    <Input
                      value={jdDraft.company}
                      maxLength={COMPANY_MAX}
                      placeholder="可选"
                      onChange={(event) => setJdEdits({ ...jdDraft, company: event.target.value })}
                    />
                  </Field>
                  <Field label="JD 正文" hint={`${jdDraft.content.length}/${JD_TEXT_MAX}`}>
                    <Textarea
                      rows={8}
                      value={jdDraft.content}
                      maxLength={JD_TEXT_MAX}
                      placeholder="粘贴职位描述…"
                      onChange={(event) => setJdEdits({ ...jdDraft, content: event.target.value })}
                    />
                  </Field>
                  <div className={s.editorActions}>
                    <Button
                      type="primary"
                      disabled={!jdDirty}
                      loading={savingJd}
                      onClick={() => void handleSaveJd()}
                    >
                      保存 JD
                    </Button>
                    {jdDirty && <span className={s.dirtyHint}>有未保存的修改</span>}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Briefcase}
                  title="还没有 JD"
                  desc="新建一份 JD，与简历做匹配分析。"
                  action={
                    <Button
                      type="primary"
                      size="small"
                      icon={<Plus size={14} strokeWidth={1.5} />}
                      onClick={() => void handleCreateJd()}
                    >
                      新建 JD
                    </Button>
                  }
                />
              )}
            </Card>
          </div>
        }
        right={
          <div className={s.rightStack}>
            <Card title="匹配结果">
              {/* 操作行：流式进行中切换为「停止生成」，其余时候是「开始分析」 */}
              <div className={s.editorActions}>
                {analysis.status === 'streaming' ? (
                  <>
                    <Button onClick={analysis.stop}>停止生成</Button>
                    <span className={s.dirtyHint}>正在流式生成…</span>
                  </>
                ) : (
                  <Button type="primary" disabled={!canAnalyze} onClick={handleAnalyze}>
                    开始分析
                  </Button>
                )}
              </div>

              {/* ---- 状态：错误（SSE error 事件 / 网络失败 → code + message + 重试） ---- */}
              {analysis.status === 'error' && analysis.error && (
                <ErrorState
                  title="分析失败"
                  desc={`错误码 ${analysis.error.code}：${analysis.error.message}`}
                  onRetry={handleAnalyze}
                />
              )}

              {/* ---- 状态：空 ---- */}
              {analysis.status === 'idle' && (
                <EmptyState
                  title="还没有分析结果"
                  desc={canAnalyze ? '点击「开始分析」，AI 将流式输出匹配分析。' : '先在中间栏填写简历与 JD。'}
                />
              )}

              {/* ---- 降级路径：done.result 缺失（后端 schema 校验不过回纯文本流）或流式推进中 ---- */}
              {(analysis.status === 'streaming' || (analysis.status === 'done' && !analysis.result)) &&
                (analysis.text ? (
                  <p className={s.streamText}>{analysis.text}</p>
                ) : (
                  <div className={s.resultTop}>
                    <Spinner label="正在等待模型响应" />
                  </div>
                ))}

              {/* ---- 结构化结果落地：score / dimensions 驱动现有可视化组件 ---- */}
              {analysis.status === 'done' && analysis.result && (
                <>
                  <div className={s.resultTop}>
                    <ScoreRing score={analysis.result.score} label="综合匹配" />
                  </div>
                  {analysis.result.dimensions.length > 0 && (
                    <>
                      <div className={s.resultDivider} />
                      <DimensionBars
                        items={analysis.result.dimensions.map((d) => ({ label: d.name, value: d.score }))}
                      />
                    </>
                  )}
                  {analysis.result.strengths.length > 0 && (
                    <>
                      <div className={s.resultDivider} />
                      <span className="section-title">亮点</span>
                      <ul className={s.gapList}>
                        {analysis.result.strengths.map((item) => (
                          <li key={item} className={s.gapItem}>
                            <CircleCheck size={14} strokeWidth={1.5} aria-hidden="true" className={s.goodIcon} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {analysis.result.gaps.length > 0 && (
                    <>
                      <div className={s.resultDivider} />
                      <span className="section-title">差距清单</span>
                      <ul className={s.gapList}>
                        {analysis.result.gaps.map((gap) => (
                          <li key={gap} className={s.gapItem}>
                            <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" className={s.gapIcon} />
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {analysis.result.suggestions.length > 0 && (
                    <>
                      <div className={s.resultDivider} />
                      <span className="section-title">建议</span>
                      <ul className={s.gapList}>
                        {analysis.result.suggestions.map((item) => (
                          <li key={item} className={s.gapItem}>
                            <Lightbulb size={14} strokeWidth={1.5} aria-hidden="true" className={s.tipIcon} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </Card>
          </div>
        }
      />
    </div>
  )
}
