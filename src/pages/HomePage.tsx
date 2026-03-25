import { useState, useEffect, useCallback } from 'react'
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

const SCROLL_KEYS = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']

export function HomePage() {
  const introComplete = useUIStore((s) => s.introComplete)
  const [showTown, setShowTown] = useState(false)

  // ── Hard scroll lock until introComplete ──────────────────────────────────
  useEffect(() => {
    if (introComplete) return

    const html = document.documentElement
    const body = document.body
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.height = '100vh'
    body.style.height = '100vh'

    const preventScroll = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    const preventKeys = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.includes(e.key)) {
        e.preventDefault()
      }
    }

    window.addEventListener('wheel', preventScroll, { passive: false })
    window.addEventListener('touchmove', preventScroll, { passive: false })
    window.addEventListener('scroll', preventScroll, { passive: false })
    window.addEventListener('keydown', preventKeys, { passive: false })

    return () => {
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
      window.removeEventListener('scroll', preventScroll)
      window.removeEventListener('keydown', preventKeys)
      html.style.overflow = ''
      body.style.overflow = ''
      html.style.height = ''
      body.style.height = ''
    }
  }, [introComplete])

  const onStaticComplete = useCallback(() => setShowTown(true), [])

  return (
    <>
      <PageWrapper>
        {/* Phase 1: ZK screensaver — click to exit */}
        {!introComplete && <IntroAnimation />}

        {/* Phase 2: TV static transition */}
        {introComplete && !showTown && (
          <TVStatic onComplete={onStaticComplete} />
        )}

        {/* Phase 3: Western Town homepage */}
        {introComplete && showTown && <WesternTown />}
      </PageWrapper>
    </>
  )
}
