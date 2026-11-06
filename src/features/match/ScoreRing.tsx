import type { CSSProperties } from 'react'
import s from './match.module.css'

interface ScoreRingProps {
  /** 匹配分 0-100 */
  score: number
  /** 环中心的说明文字（如"综合匹配"） */
  label?: string
}

/* 几何常量：线宽 4 来自 docs/ARCHITECTURE.md 第 3 章①（分数环规格），非设计 token 管辖的色值/间距 */
const SIZE = 140
const STROKE_WIDTH = 4
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * L3 领域件：匹配分环形可视化（Paper 规范：描边生长 1.15s，stroke-linecap: butt）。
 * 入场动画用纯 CSS 关键帧实现（stroke-dashoffset 从满环到目标值），无需 JS 定时器；
 * prefers-reduced-motion 由 global.css 全局将动画时长归零，直接呈现终值。
 * 分数变化时组件以 key 重挂载，重新播放"从满环到目标值"的生长。
 */
export function ScoreRing({ score, label }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const offset = CIRCUMFERENCE * (1 - clamped / 100)

  return (
    <div className={s.ringWrap}>
      <svg
        key={clamped}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${label ?? '匹配分'}：${Math.round(clamped)} 分（满分 100）`}
      >
        <circle
          className={s.ringTrack}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <circle
          className={s.ringValue}
          style={{ '--ring-full': CIRCUMFERENCE, '--ring-offset': offset } as CSSProperties}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="butt"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className={s.ringCenter}>
        <span className={`num ${s.ringScore}`}>{Math.round(clamped)}</span>
        {label && <span className={s.ringLabel}>{label}</span>}
      </div>
    </div>
  )
}
