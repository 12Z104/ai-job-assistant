import type { ReactNode } from 'react'
import s from './ui.module.css'

interface FieldProps {
  label: string
  hint?: string
  required?: boolean
  children: ReactNode
}

/** 表单字段的标签 + 控件 + 说明的组合，统一标签排版。 */
export function Field({ label, hint, required = false, children }: FieldProps) {
  return (
    <label className={s.field}>
      <span className={s.label}>
        {label}
        {required && (
          <b className={s.labelReq} aria-hidden="true">
            {' '}
            *
          </b>
        )}
      </span>
      {children}
      {hint && <span className={s.hint}>{hint}</span>}
    </label>
  )
}
