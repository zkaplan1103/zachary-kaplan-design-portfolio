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
        duration: 2.8,
        times: [0, 0.2, 1],
        ease: 'easeIn' as const,
      }}
      onAnimationComplete={() => setDone(true)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: '#0d0d0d',
        pointerEvents: 'none',
      }}
    />
  )
}
