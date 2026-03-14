import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { textReveal } from '@/lib/variants'

interface TextRevealProps {
  children: string
  className?: string
  delay?: number
}

export function TextReveal({ children, className, delay = 0 }: TextRevealProps) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <span className={className}>{children}</span>
  }

  return (
    <span className="overflow-hidden inline-block">
      <motion.span
        className={`inline-block ${className ?? ''}`}
        variants={textReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'block' }}
      >
        {children}
      </motion.span>
    </span>
  )
}
