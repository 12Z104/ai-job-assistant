import { Tag as AntTag } from 'antd'
import type { TagProps } from 'antd'
import s from './ui.module.css'

/** 只允许这四种语义，禁止页面自选 antd 预设色。 */
export type TagTone = 'neutral' | 'polish' | 'suggest' | 'danger'

interface TagPropsWithTone extends Omit<TagProps, 'color'> {
  tone?: TagTone
}

const toneClass: Record<TagTone, string> = {
  neutral: s.tagNeutral ?? '',
  polish: s.tagPolish ?? '',
  suggest: s.tagSuggest ?? '',
  danger: s.tagDanger ?? '',
}

/**
 * L1 基础件：白底细线灰字为默认。
 * polish / suggest 对应改写标记色（--mark-*），与语义色分开命名。
 */
export function Tag({ tone = 'neutral', className, ...rest }: TagPropsWithTone) {
  return <AntTag {...rest} className={`${s.tag} ${toneClass[tone]} ${className ?? ''}`} />
}
