import { useEffect, useRef } from 'react'
import monitorPng from '@/assets/images/monitor-v2-cropped.png'

/**
 * PNG dimensions and screen cutout bounds (measured from alpha channel).
 * Run: python3 -c "from PIL import Image; import numpy as np; ..."
 */
const MONITOR_NATURAL_WIDTH  = 1225
const MONITOR_NATURAL_HEIGHT = 815
const SCREEN_LEFT_PX         = 77
const SCREEN_TOP_PX          = 51
const SCREEN_WIDTH_PX        = 1070
const SCREEN_HEIGHT_PX       = 620

/**
 * Returns the rendered rect of the image.
 * object-fit: fill stretches the image to exactly fill the element —
 * no letterboxing, no pillarboxing. The rendered rect equals the element rect.
 */
function getImageRenderedRect(img: HTMLImageElement) {
  const rect = img.getBoundingClientRect()
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

interface CRTScreenProps {
  children: React.ReactNode
  dark: boolean
}

/**
 * CRTScreen — manages the monitor PNG frame and the screen content wrapper.
 *
 * Architecture:
 *   - Monitor PNG at z:100, object-fit:contain, covers full viewport
 *   - Screen content wrapper at z:1, positioned in px via ResizeObserver
 *     to precisely match the transparent screen cutout at any viewport size
 *   - All 7 CRT effects layered inside the screen wrapper as absolute overlays
 *
 * z-order inside screen wrapper:
 *   children (content)  →  grain (z:2)  →  scanlines (z:3)  →
 *   phosphor (z:4)      →  vignette (z:5)
 *   + box-shadow (inset bezel depth) and border-radius on wrapper itself
 *   + crt-flicker animation on wrapper
 *   Monitor PNG (z:100) sits above all of this externally
 */
export function CRTScreen({ children, dark }: CRTScreenProps) {
  const monitorRef = useRef<HTMLImageElement>(null)
  const screenRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateScreenBounds = () => {
      const monitor = monitorRef.current
      const screen  = screenRef.current
      if (!monitor || !screen) return

      const rendered = getImageRenderedRect(monitor)
      const scaleX   = rendered.width  / MONITOR_NATURAL_WIDTH
      const scaleY   = rendered.height / MONITOR_NATURAL_HEIGHT

      screen.style.left   = `${rendered.left + SCREEN_LEFT_PX * scaleX}px`
      screen.style.top    = `${rendered.top  + SCREEN_TOP_PX  * scaleY}px`
      screen.style.width  = `${SCREEN_WIDTH_PX  * scaleX}px`
      screen.style.height = `${SCREEN_HEIGHT_PX * scaleY}px`
    }

    const ro = new ResizeObserver(updateScreenBounds)
    ro.observe(document.body)
    updateScreenBounds()
    return () => ro.disconnect()
  }, [])

  return (
    <>
      {/*
       * ── z:100 — Monitor frame PNG ─────────────────────────────────────────
       * object-fit: fill stretches the PNG to exactly 100vw × 100vh so the
       * bezel touches all four browser edges at every viewport size.
       * getImageRenderedRect() still used to find the screen rect for positioning.
       */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 100,
          pointerEvents: 'none',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
        }}
      >
        <img
          ref={monitorRef}
          src={monitorPng}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            margin: 0,
            padding: 0,
          }}
        />
      </div>

      {/*
       * z:0 — Bezel background fill.
       * Must be BELOW the screen wrapper (z:1). If placed above (e.g. z:99),
       * it renders between the transparent screen cutout of the PNG and the
       * content, making the screen area appear solid beige instead of showing
       * site content. At z:0 it is only visible in areas not covered by the
       * screen wrapper and is hidden by the opaque PNG bezel anyway.
       */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: '-4px',
          zIndex: 0,
          backgroundColor: '#000000',
          pointerEvents: 'none',
        }}
      />

      {/*
       * ── z:1 — Screen content wrapper ─────────────────────────────────────
       * Position and size are set in px by the ResizeObserver above.
       * overflow: hidden clips content + CRT overlays to the screen rect.
       * border-radius: 8px matches the CRT screen curvature.
       * animation: crt-flicker applies subliminal opacity pulse (#6 flicker).
       * box-shadow: inset adds bezel depth and shadow (#1 bezel shadow).
       * transform: perspective adds subtle screen curvature (#7).
       */}
      <div
        ref={screenRef}
        style={{
          position: 'fixed',
          zIndex: 1,
          overflow: 'hidden',
          borderRadius: 12,
          backgroundColor: dark ? '#0d0d0d' : '#f8f7f4',
          boxShadow: dark
            ? 'none'
            : 'inset 0 0 40px 8px rgba(60,50,40,0.18)',
          transform: 'perspective(1200px)',
          animation: 'crt-flicker 4s linear infinite',
        }}
      >
        {/* Site content */}
        {children}

        {/* z:2 — Grain (drifting SVG noise) — oversized so drift never exposes edge */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-15%', left: '-15%', right: '-15%', bottom: '-15%',
            zIndex: 2,
            opacity: dark ? 0.045 : 0.025,
            filter: 'url(#crt-noise)',
            background: 'white',
            willChange: 'transform',
            animation: 'crt-grain-drift 12s linear infinite',
            pointerEvents: 'none',
          }}
        />

        {/* z:3 — Scanlines */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            background: `repeating-linear-gradient(
              transparent 0px,
              transparent 2px,
              rgba(0,0,0,${dark ? '0.08' : '0.04'}) 2px,
              rgba(0,0,0,${dark ? '0.08' : '0.04'}) 4px
            )`,
            pointerEvents: 'none',
          }}
        />

        {/* z:4 — Phosphor glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            background: dark
              ? 'radial-gradient(ellipse at center, rgba(120,255,120,0.04) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(255,255,200,0.03) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* z:5 — Vignette */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            background: `radial-gradient(
              ellipse at center,
              transparent 50%,
              rgba(0,0,0,${dark ? '0.7' : '0.08'}) 100%
            )`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </>
  )
}
