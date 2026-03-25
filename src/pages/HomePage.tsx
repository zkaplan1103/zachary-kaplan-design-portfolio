import { useState, useEffect } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { IntroAnimation } from '@/components/IntroAnimation'
import { WesternTown } from '@/components/WesternTown'
import { useUIStore } from '@/store/uiStore'

type PowerOnPhase = 'off' | 'expandX' | 'expandY' | 'done'

export function HomePage() {
  const introComplete = useUIStore((s) => s.introComplete)
  const [powerOn, setPowerOn] = useState<PowerOnPhase>('off')
  const [scaleX, setScaleX] = useState(0)
  const [scaleY, setScaleY] = useState(0)

  // ── CRT power-on sequence (reverse of power-off) ──────────────────────────
  useEffect(() => {
    if (!introComplete) return
    // Kick off the power-on after a brief blackout gap
    const delay = setTimeout(() => setPowerOn('expandX'), 150)
    return () => clearTimeout(delay)
  }, [introComplete])

  useEffect(() => {
    if (powerOn === 'off' || powerOn === 'done') return

    if (powerOn === 'expandX') {
      // Phase 1: Horizontal expand — thin line appears (100ms)
      const start = performance.now()
      let raf = 0
      function tick(now: number) {
        const t = Math.min(1, (now - start) / 100)
        setScaleX(t)
        setScaleY(0.02) // thin horizontal line
        if (t < 1) { raf = requestAnimationFrame(tick) }
        else { setPowerOn('expandY') }
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }

    if (powerOn === 'expandY') {
      // Phase 2: Vertical expand — full screen (400ms, easeOut)
      const start = performance.now()
      let raf = 0
      function tick(now: number) {
        const t = Math.min(1, (now - start) / 400)
        const ease = 1 - (1 - t) * (1 - t) // easeOut quadratic
        setScaleY(0.02 + ease * 0.98) // 0.02 → 1.0
        setScaleX(1)
        if (t < 1) { raf = requestAnimationFrame(tick) }
        else { setPowerOn('done') }
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }
  }, [powerOn])

  const showTown = introComplete
  const isAnimating = powerOn !== 'done' && powerOn !== 'off'

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
                ? `scaleX(${scaleX}) scaleY(${scaleY})`
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
