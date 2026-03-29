import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { IntroAnimation } from '@/components/IntroAnimation'
import { WesternTown } from '@/components/WesternTown'
import { useUIStore } from '@/store/uiStore'
import { motion } from 'framer-motion'

export function HomePage() {
  const introComplete = useUIStore((s) => s.introComplete)
  // Unmount blur/tint overlay layers after they finish animating
  const [showOverlay, setShowOverlay] = useState(true)

  return (
    <PageWrapper>
      {/* Phase 1: ZK screensaver — click to exit */}
      {!introComplete && <IntroAnimation />}

      {/* Phase 2: CRT warm-up — three-layer dissolve */}
      {introComplete && (
        <>
          {/* Layer 1: WesternTown — opacity + subtle scale only. NO filter ever. */}
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.2, 0, 0.6, 1] }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <WesternTown />
          </motion.div>

          {/* Layers 2+3: separate div above WesternTown — blur + tint dissolve.
              backdrop-filter is on THIS element (not WesternTown) to avoid GPU compositor issue.
              Unmounted after animation via showOverlay flag. */}
          {showOverlay && (
            <>
              {/* Layer 2: backdrop-filter blur dissolves from 14px → 0 over 1.2s
                  WebkitBackdropFilter set in style (not animate) — Safari gets static layer */}
              <motion.div
                initial={{ backdropFilter: 'blur(14px)' }}
                animate={{ backdropFilter: 'blur(0px)' }}
                transition={{ duration: 1.2, ease: [0.1, 0, 0.5, 1] }}
                onAnimationComplete={() => setShowOverlay(false)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 30,
                  pointerEvents: 'none',
                  WebkitBackdropFilter: 'blur(14px)',
                }}
              />
              {/* Layer 3: dark tint rgba(0,0,0,0.85) → transparent, holds darkness front-loaded */}
              <motion.div
                initial={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
                animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
                transition={{ duration: 1.2, ease: [0.15, 0, 0.5, 1] }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 29,
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
        </>
      )}
    </PageWrapper>
  )
}
