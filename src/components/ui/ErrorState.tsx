import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import s from './ui.module.css'

interface ErrorStateProps {
  title?: string
  desc?: string
  onRetry?: () => void
}

/**
 * 错误状态：明确说清出了什么问题 + 给重试出口。
 * 禁止静默吞错、禁止 alert（用 useToast 做轻提示）。
 */
export function ErrorState({
  title = '出了点问题',
  desc,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={s.empty}>
      <AlertTriangle size={28} strokeWidth={1.5} aria-hidden="true" className={s.errorIcon} />
      <p className={s.emptyTitle}>{title}</p>
      {desc && <p className={s.emptyDesc}>{desc}</p>}
      {onRetry && (
        <div className={s.emptyAction}>
          <Button size="small" icon={<RefreshCw size={14} strokeWidth={1.5} />} onClick={onRetry}>
            重试
          </Button>
        </div>
      )}
    </div>
  )
}
