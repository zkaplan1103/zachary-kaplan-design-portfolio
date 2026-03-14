import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { fadeIn } from '@/lib/variants'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface FadeInProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : fadeIn}
      initial={reduced ? undefined : 'hidden'}
      whileInView={reduced ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}
