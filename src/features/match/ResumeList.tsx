import { useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import type { Resume } from '../../types'
import { Button, EmptyState, Modal } from '../../components/ui'
import s from './match.module.css'

interface ResumeListProps {
  resumes: Resume[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

/**
 * L3 领域件：左栏简历列表。
 * 纯数据 + 回调 props（不调 repository）；删除走 Modal 二次确认；空列表给引导。
 */
export function ResumeList({ resumes, selectedId, onSelect, onCreate, onDelete }: ResumeListProps) {
  const [pendingDelete, setPendingDelete] = useState<Resume | null>(null)

  if (resumes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="还没有简历"
        desc="新建一份简历，粘贴简历正文后即可与 JD 做匹配分析。"
        action={
          <Button type="primary" size="small" icon={<Plus size={14} strokeWidth={1.5} />} onClick={onCreate}>
            新建简历
          </Button>
        }
      />
    )
  }

  return (
    <>
      <div className={s.listToolbar}>
        <Button
          size="small"
          icon={<Plus size={14} strokeWidth={1.5} />}
          onClick={onCreate}
        >
          新建简历
        </Button>
      </div>
      <ul className={s.list}>
        {resumes.map((resume) => (
          <li key={resume.id} className={s.listRow}>
            <button
              type="button"
              className={resume.id === selectedId ? `${s.listItem} ${s.listItemActive}` : s.listItem}
              onClick={() => onSelect(resume.id)}
            >
              <FileText size={14} strokeWidth={1.5} aria-hidden="true" className={s.listIcon} />
              <span className={s.listMain}>
                <span className={s.listTitle}>{resume.title}</span>
                <span className={`num ${s.listMeta}`}>
                  {formatDate(resume.createTime)} · {resume.rawContent.length} 字
                </span>
              </span>
            </button>
            <button
              type="button"
              className={s.listDelete}
              aria-label={`删除简历「${resume.title}」`}
              onClick={() => setPendingDelete(resume)}
            >
              <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <Modal
        title="删除简历"
        open={pendingDelete !== null}
        okText="删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        onOk={() => {
          if (pendingDelete) onDelete(pendingDelete.id)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      >
        <p className={s.modalText}>
          确定删除「{pendingDelete?.title ?? ''}」吗？删除后不可恢复。
        </p>
      </Modal>
    </>
  )
}
