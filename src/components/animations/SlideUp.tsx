import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { slideUp } from '@/lib/variants'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface SlideUpProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function SlideUp({ children, delay = 0, className }: SlideUpProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : slideUp}
      initial={reduced ? undefined : 'hidden'}
      whileInView={reduced ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}
