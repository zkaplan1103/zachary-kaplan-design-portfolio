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

      {/* Phase 2: Fade-in → Western Town */}
      {introComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%' }}
        >
          <WesternTown />
        </motion.div>
      )}
    </PageWrapper>
  )
}
