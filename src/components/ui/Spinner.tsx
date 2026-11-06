import { Spin } from 'antd'
import s from './ui.module.css'

/** L1 基础件：行内加载指示。整页等待请用 EmptyState 之前的 Skeleton。 */
export function Spinner({ label = '加载中' }: { label?: string }) {
  return (
    <span className={s.spinner} role="status" aria-label={label}>
      <Spin size="small" />
    </span>
  )
}
