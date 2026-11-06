import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { ComponentRef, ReactNode } from 'react'
import { Carousel as AntCarousel } from 'antd'
import s from './carousel.module.css'

export interface CarouselItem {
  key: string
  title: string
  desc: string
  icon?: ReactNode
  /** 右侧等宽注释区，用作技术细节速览；<768px 自动隐藏。 */
  note?: string[]
}

interface CarouselProps {
  items: CarouselItem[]
  /** 受控：当前帧索引。传入后由父级驱动切帧；不传则由组件自己推进。 */
  activeIndex?: number
  /** 帧切换回调，受控与非受控都会触发。 */
  onChange?: (index: number) => void
  className?: string
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/** 无服务端渲染，仅作为 useSyncExternalStore 的兜底快照。 */
function getReducedMotionFallback() {
  return false
}

/**
 * L1 基础件：白卡 + 1px 细线 + 2px 圆角，无阴影，fade 淡入淡出、底部圆点。
 * 系统开启「减少动态效果」时自动播放与过渡一并关闭，避免违背用户偏好。
 */
export function Carousel({ items, activeIndex, onChange, className }: CarouselProps) {
  const carouselRef = useRef<ComponentRef<typeof AntCarousel>>(null)
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionFallback,
  )

  useEffect(() => {
    if (activeIndex === undefined) return
    carouselRef.current?.goTo(activeIndex, false)
  }, [activeIndex])

  return (
    <div className={`${s.root} ${className ?? ''}`}>
      <AntCarousel
        ref={carouselRef}
        effect="fade"
        autoplay={!reducedMotion}
        autoplaySpeed={5000}
        speed={reducedMotion ? 0 : 500}
        dotPosition="bottom"
        afterChange={(current) => onChange?.(current)}
      >
        {items.map((item) => (
          <div key={item.key}>
            <div className={s.card}>
              {item.icon && (
                <span className={s.icon} aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <div className={s.body}>
                <h3 className={s.title}>{item.title}</h3>
                <p className={s.desc}>{item.desc}</p>
              </div>
              {item.note && item.note.length > 0 && (
                <ul className={s.note}>
                  {item.note.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </AntCarousel>
    </div>
  )
}
