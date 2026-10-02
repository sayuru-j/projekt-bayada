import { useEffect, useRef, useState, type CSSProperties, type ElementType } from 'react'
import { cn } from '@/lib/utils'

/** Scrolls long titles horizontally so the full text is visible. */
export function MarqueeTitle({
  text,
  className,
  as: Tag = 'h2',
}: {
  text: string
  className?: string
  as?: 'h2' | 'p' | 'span'
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(false)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current
      const el = textRef.current
      if (!wrap || !el) return
      const over = el.scrollWidth > wrap.clientWidth + 2
      setOverflow(over)
      setDistance(over ? el.scrollWidth - wrap.clientWidth + 24 : 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [text])

  const Comp = Tag as ElementType

  return (
    <div ref={wrapRef} className="min-w-0 overflow-hidden" title={text}>
      <Comp
        className={cn(
          'm-0 block whitespace-nowrap',
          overflow && 'marquee-title',
          className,
        )}
      >
        <span
          ref={textRef}
          className="inline-block"
          style={
            overflow
              ? ({ '--marquee-distance': `-${distance}px` } as CSSProperties)
              : undefined
          }
        >
          {text}
        </span>
      </Comp>
    </div>
  )
}
