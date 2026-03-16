import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export default function CRTPowerOn() {
  const [done, setDone] = useState(false)
  const staticRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (done) return
    const canvas = staticRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    canvas.width = 200
    canvas.height = 112 // 16:9 low-res — CSS scales it up for chunky pixel grain

    let rafId: number

    function renderNoise() {
      const imageData = ctx.createImageData(canvas!.width, canvas!.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        // Half pixels black, half random gray/white — more realistic than pure 50/50
        const v = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 256)
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
      rafId = requestAnimationFrame(renderNoise)
    }

    rafId = requestAnimationFrame(renderNoise)
    return () => cancelAnimationFrame(rafId)
  }, [done])

  if (done) return null

  return (
    <>
      {/* Black overlay — holds then fades, revealing site content */}
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

      {/* TV static — surfaces during the fade, then resolves to nothing */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.55, 0] }}
        transition={{
          duration: 1.5,
          times: [0, 0.35, 0.65, 1],
          ease: 'easeInOut' as const,
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 51,
          pointerEvents: 'none',
        }}
      >
        <canvas
          ref={staticRef}
          style={{
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
          }}
        />
      </motion.div>
    </>
  )
}
