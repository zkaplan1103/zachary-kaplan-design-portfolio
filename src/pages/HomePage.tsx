import { PageWrapper } from '@/components/layout/PageWrapper'
import { IntroAnimation } from '@/components/IntroAnimation'
import CRTPowerOn from '@/components/CRTPowerOn'
import { HeroSection } from '@/components/sections/HeroSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { ExperienceSection } from '@/components/sections/ExperienceSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { useUIStore } from '@/store/uiStore'

export function HomePage() {
  const introComplete = useUIStore((s) => s.introComplete)
  return (
    <PageWrapper>
      {!introComplete && <IntroAnimation />}
      {introComplete && <CRTPowerOn />}
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ExperienceSection />
      <ContactSection />
    </PageWrapper>
  )
}
