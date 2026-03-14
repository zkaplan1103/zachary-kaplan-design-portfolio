import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { pageTransition } from '@/lib/variants'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      className={className}
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}
