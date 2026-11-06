import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'
import s from './NotFoundPage.module.css'

/** 404 页。 */
export default function NotFoundPage() {
  return (
    <div className={`rise ${s.page}`}>
      <EmptyState title="404 · 页面不存在" desc="地址可能输错了，或者页面已在新骨架中改名。" />
      <p className={s.backRow}>
        <Link to="/" className={s.backLink}>
          回到首页
        </Link>
      </p>
    </div>
  )
}
