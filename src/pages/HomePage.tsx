import { useState, useEffect } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { IntroAnimation } from '@/components/IntroAnimation'
import { WesternTown } from '@/components/WesternTown'
import { useUIStore } from '@/store/uiStore'

type PowerOnPhase = 'off' | 'expandX' | 'done'

export function HomePage() {
  const introComplete = useUIStore((s) => s.introComplete)
  const [powerOn, setPowerOn] = useState<PowerOnPhase>('off')
  const [scaleX, setScaleX] = useState(0)

  // ── CRT power-on sequence ─────────────────────────────────────────────────
  // Town starts as scaleX(0) scaleY(1) — invisible thin vertical line
  // Expands horizontally from center over 120ms ease-out
  useEffect(() => {
    if (!introComplete) return
    const delay = setTimeout(() => setPowerOn('expandX'), 150)
    return () => clearTimeout(delay)
  }, [introComplete])

  useEffect(() => {
    if (powerOn !== 'expandX') return

    // Phase 1: scaleX 0 → 1 over 120ms (ease-out: cubic-bezier(0.23, 1, 0.32, 1))
    const start = performance.now()
    let raf = 0
    function tick(now: number) {
      const t = Math.min(1, (now - start) / 120)
      // Strong ease-out per Emil skill: fast start, smooth settle
      const ease = 1 - Math.pow(1 - t, 3)
      setScaleX(ease) // 0 → 1
      if (t < 1) { raf = requestAnimationFrame(tick) }
      else { setPowerOn('done') }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [powerOn])

  const showTown = introComplete
  const isAnimating = powerOn === 'expandX'

  return (
    <>
      <PageWrapper>
        {/* Phase 1: ZK screensaver — click to exit */}
        {!introComplete && <IntroAnimation />}

        {/* Phase 2: CRT power-on → Western Town */}
        {showTown && (
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: isAnimating
                ? `scaleX(${scaleX})`
                : undefined,
              transformOrigin: '50% 50%',
              willChange: isAnimating ? 'transform' : undefined,
            }}
          >
            <WesternTown />
          </div>
        )}
      </PageWrapper>
    </>
  )
}
