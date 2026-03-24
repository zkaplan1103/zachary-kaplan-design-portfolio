import { PageWrapper } from '@/components/layout/PageWrapper'
import { IntroAnimation } from '@/components/IntroAnimation'
import CRTPowerOn from '@/components/CRTPowerOn'
// import { HeroSection } from '@/components/sections/HeroSection'
// import { WorkSection } from '@/components/sections/WorkSection'
// import { AboutSection } from '@/components/sections/AboutSection'
// import { SkillsSection } from '@/components/sections/SkillsSection'
// import { ContactSection } from '@/components/sections/ContactSection'
import { useUIStore } from '@/store/uiStore'
import { SwarmCanvas } from '@/components/swarm/SwarmCanvas'

export function HomePage() {
  const introComplete = useUIStore((s) => s.introComplete)
  return (
    <>
      {/* SwarmCanvas lives outside PageWrapper so position:absolute reaches the
          screen wrapper's containing block without being intercepted by
          PageWrapper's motion.div transform */}
      {introComplete && <SwarmCanvas />}
      <PageWrapper>
        {!introComplete && <IntroAnimation />}
        {introComplete && <CRTPowerOn />}
        {/* All sections commented out for Phase B snake testing */}
        {/* <HeroSection /> */}
        {/* <AboutSection /> */}
        {/* <WorkSection /> */}
        {/* <SkillsSection /> */}
        {/* <ContactSection /> */}
        {/* Scroll spacer — provides scroll distance for snake path traversal */}
        {!introComplete && <div style={{ height: '300vh' }} />}
      </PageWrapper>
    </>
  )
}
