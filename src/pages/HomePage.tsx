import { PageWrapper } from '@/components/layout/PageWrapper'
import { IntroAnimation } from '@/components/IntroAnimation'
import CRTPowerOn from '@/components/CRTPowerOn'
import { HeroSection } from '@/components/sections/HeroSection'
// import { WorkSection } from '@/components/sections/WorkSection'
// import { AboutSection } from '@/components/sections/AboutSection'
// import { SkillsSection } from '@/components/sections/SkillsSection'
// import { ContactSection } from '@/components/sections/ContactSection'
import { useUIStore } from '@/store/uiStore'

export function HomePage() {
  const introComplete = useUIStore((s) => s.introComplete)
  return (
    <PageWrapper>
      {!introComplete && <IntroAnimation />}
      {introComplete && <CRTPowerOn />}
      <HeroSection />
      {/* <WorkSection />
      <AboutSection />
      <SkillsSection />
      <ContactSection /> */}
    </PageWrapper>
  )
}
