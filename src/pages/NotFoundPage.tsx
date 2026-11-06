import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

/** 404 页。 */
export default function NotFoundPage() {
  return (
    <div className="rise" style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-8) var(--space-5)' }}>
      <EmptyState
        title="404 · 页面不存在"
        desc="地址可能输错了，或者页面已在新骨架中改名。"
      />
      <p style={{ textAlign: 'center' }}>
        <Link to="/">回到首页</Link>
      </p>
    </div>
  )
}
