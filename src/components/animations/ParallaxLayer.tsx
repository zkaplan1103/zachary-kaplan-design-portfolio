import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { type ReactNode } from 'react'

interface ParallaxLayerProps {
  children: ReactNode
  /** Parallax intensity. Negative = slower, positive = faster relative to scroll. */
  speed?: number
  className?: string
}

export function ParallaxLayer({ children, speed = 0.4, className }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 80}px`, `${speed * 80}px`])

  return (
    <div ref={ref} className={`overflow-hidden ${className ?? ''}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}
