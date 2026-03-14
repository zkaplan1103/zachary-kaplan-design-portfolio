import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { staggerContainer } from '@/lib/variants'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface StaggerGroupProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function StaggerGroup({ children, className, delay = 0 }: StaggerGroupProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : staggerContainer}
      initial={reduced ? undefined : 'hidden'}
      whileInView={reduced ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}
