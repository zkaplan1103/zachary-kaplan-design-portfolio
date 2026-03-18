import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface DrawBorderProps {
  children: React.ReactNode
  delay?: number
  color?: string
  inset?: number
}

export function DrawBorder({
  children,
  delay = 0,
  color = 'rgba(240,239,233,0.15)',
  inset = 0,
}: DrawBorderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: inset,
          left: inset,
          width: `calc(100% - ${inset * 2}px)`,
          height: `calc(100% - ${inset * 2}px)`,
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'visible',
        }}
      >
        <motion.rect
          x="0.5"
          y="0.5"
          width="99%"
          height="99%"
          fill="none"
          stroke={color}
          strokeWidth={1}
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.4, ease: 'linear' as const, delay }}
        />
      </svg>
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  )
}
