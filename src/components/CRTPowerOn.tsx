import { motion } from 'framer-motion'
import { useState } from 'react'

export default function CRTPowerOn() {
  const [done, setDone] = useState(false)
  if (done) return null
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{
        duration: 1.8,
        times: [0, 0.4, 1],
        ease: 'easeInOut' as const,
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: '#0d0d0d',
        pointerEvents: 'none',
      }}
      onAnimationComplete={() => setDone(true)}
    />
  )
}
