import { PageWrapper } from '@/components/layout/PageWrapper'
import { IntroAnimation } from '@/components/IntroAnimation'
import { WesternTown } from '@/components/WesternTown'
import { useUIStore } from '@/store/uiStore'
import { motion } from 'framer-motion'

export function HomePage() {
  const introComplete = useUIStore((s) => s.introComplete)

  return (
    <PageWrapper>
      {/* Phase 1: ZK screensaver — click to exit */}
      {!introComplete && <IntroAnimation />}

      {/* Phase 2: CRT warm-up — scale into view + black veil fades independently */}
      {introComplete && (
        <>
          {/* Town: scale 1.015→1 and opacity 0→1 over 800ms */}
          <motion.div
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <WesternTown />
          </motion.div>
          {/* Black veil fades out independently — CRT phosphor warming up from dark */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#000',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </PageWrapper>
  )
}
