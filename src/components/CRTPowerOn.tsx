import { motion } from 'framer-motion'
import { useState } from 'react'

export default function CRTPowerOn() {
  const [done, setDone] = useState(false)
  if (done) return null
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'brightness(0)' }}
      animate={{
        opacity: [0, 0, 1],
        filter: ['brightness(0)', 'brightness(2.5)', 'brightness(1)'],
      }}
      transition={{ duration: 0.35, times: [0, 0.4, 1] }}
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
