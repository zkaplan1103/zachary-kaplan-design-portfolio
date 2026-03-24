import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { IntroAnimation } from '@/components/IntroAnimation'
import { TVStatic } from '@/components/TVStatic'
import { WesternTown } from '@/components/WesternTown'
// import CRTPowerOn from '@/components/CRTPowerOn'
// import { HeroSection } from '@/components/sections/HeroSection'
// import { WorkSection } from '@/components/sections/WorkSection'
// import { AboutSection } from '@/components/sections/AboutSection'
// import { SkillsSection } from '@/components/sections/SkillsSection'
// import { ContactSection } from '@/components/sections/ContactSection'
import { useUIStore } from '@/store/uiStore'
// import { SwarmCanvas } from '@/components/swarm/SwarmCanvas' // SNAKE SYSTEM — COMMENTED OUT

export function HomePage() {
  const introComplete = useUIStore((s) => s.introComplete)
  const [staticDone, setStaticDone] = useState(false)

  return (
    <>
      <PageWrapper>
        {/* Phase 1: ZK screensaver — click to exit */}
        {!introComplete && <IntroAnimation />}

        {/* Phase 2: TV static transition (400ms static → 80ms flash → 300ms fade) */}
        {introComplete && !staticDone && (
          <TVStatic onComplete={() => setStaticDone(true)} />
        )}

        {/* Phase 3: Western Town homepage */}
        {introComplete && staticDone && <WesternTown />}
      </PageWrapper>
    </>
  )
}
