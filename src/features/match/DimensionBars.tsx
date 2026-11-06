import type { CSSProperties } from 'react'
import s from './match.module.css'

export interface DimensionItem {
  label: string
  /** 0-100 */
  value: number
}

interface DimensionBarsProps {
  items: DimensionItem[]
}

/* 错峰间隔 90ms 来自 docs/ARCHITECTURE.md 第 3 章①（维度条：宽度 900ms，错峰 90ms） */
const STAGGER_MS = 90

/**
 * L3 领域件：匹配维度条（技能匹配 / 经验相关 / 项目深度 / 表达清晰…）。
 * 条宽入场用纯 CSS 关键帧生长（900ms，逐项错峰 90ms），填充色 --color-accent、轨道色 --color-line；
 * prefers-reduced-motion 由 global.css 全局将动画时长归零，直接呈现终值。
 */
export function DimensionBars({ items }: DimensionBarsProps) {
  return (
    <ul className={s.bars}>
      {items.map((item, index) => {
        const value = Math.max(0, Math.min(100, item.value))
        return (
          <li key={item.label} className={s.barRow}>
            <span className={s.barLabel}>{item.label}</span>
            <span className={s.barTrack} aria-hidden="true">
              <span
                className={s.barFill}
                style={
                  {
                    '--bar-width': `${value}%`,
                    '--bar-delay': `${index * STAGGER_MS}ms`,
                  } as CSSProperties
                }
              />
            </span>
            <span className={`num ${s.barValue}`}>{value}</span>
          </li>
        )
      })}
    </ul>
  )
}
