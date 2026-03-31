import { useState } from 'react'
import { motion, useTransform } from 'framer-motion'
import type { InteriorProps } from './interiorTypes'

// ─── Palettes ─────────────────────────────────────────────────────────────────
const NIGHT = {
  bg:         '#0f0a08',
  ceiling:    '#100806',
  wallFar:    '#160d06',
  sideWall:   '#180e07',
  wainscot:   'rgba(0,0,0,0.3)',
  floor:      '#2a1608',
  wood:       '#3d2008',
  woodDark:   '#2a1608',
  accent:     '#FFB300',
  stroke:     '#c9a96e',
  strokeMid:  'rgba(201,169,110,0.5)',
  strokeFar:  'rgba(201,169,110,0.22)',
  winFill:    'rgba(201,169,110,0.07)',
  bottleFill: 'rgba(255,140,0,0.28)',
  sheen:      'rgba(255,179,0,0.45)',
  npc:        '#c9a96e',
}
const DAY = {
  bg:         '#7A5C50',
  ceiling:    '#9E8880',
  wallFar:    '#A89590',
  sideWall:   '#B0A09A',
  wainscot:   'rgba(0,0,0,0.1)',
  floor:      '#8D6E63',
  wood:       '#6D4C41',
  woodDark:   '#5A3D33',
  accent:     '#FFF9E0',
  stroke:     '#4E342E',
  strokeMid:  'rgba(78,52,46,0.5)',
  strokeFar:  'rgba(78,52,46,0.22)',
  winFill:    'rgba(255,249,224,0.5)',
  bottleFill: 'rgba(180,100,20,0.28)',
  sheen:      'rgba(255,249,224,0.5)',
  npc:        '#4E342E',
}

// ─── "Fixed Stage" layout ────────────────────────────────────────────────────
//
// viewBox: 0 0 1000 400
// Wide canvas matching CRT aspect ratio. VP = (500, 240).
//
// Back wall:  x=200 y=60 w=600 h=180  (y=60..240)
// Ceiling:    0,0 → 1000,0 → 800,60 → 200,60
// Floor:      0,400 → 1000,400 → 800,240 → 200,240
// L wall:     0,0 → 200,60 → 200,240 → 0,400
// R wall:     1000,0 → 800,60 → 800,240 → 1000,400
//
// Bar:        centred x=420..580, top y=195, front y=195..215
// Barkeep:    x=500, hat y=170, body to y=200 (hidden below bar top)
// Piano:      x=50..200, y=250..295 (far left — pan to reveal)
// Stools:     x=800..950, y=260..310 (far right — pan to reveal)
// No-fly:     nothing below y=350

const W = '160%'
const L = '-30%'

export function SaloonInterior({ isNight, mouseSpring, sw, onBarkeepClick }: InteriorProps) {
  const p = isNight ? NIGHT : DAY
  const [barkeepHover, setBarkeepHover] = useState(false)

  // Single pan — entire room moves as one solid block
  const panX = useTransform(mouseSpring, v => v * sw * -0.18)

  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: p.bg,
      overflow: 'hidden',
      transition: 'background-color 1.5s',
    }}>
      <motion.div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: L, width: W,
        x: panX,
        pointerEvents: onBarkeepClick ? 'auto' : 'none',
      }}>
        <svg
          viewBox="0 0 1000 400"
          preserveAspectRatio="xMidYMid slice"
          width="100%" height="100%"
          style={{ display: 'block' }}
          fill="none" strokeLinecap="round" strokeLinejoin="round"
        >
          {/* ═══════════════════════════════════════════════
              ROOM SHELL — ceiling, walls, back wall, floor
              ═══════════════════════════════════════════════ */}

          {/* Ceiling trapezoid */}
          <polygon points="0,0 1000,0 800,60 200,60" fill={p.ceiling} />
          {[120, 280, 420, 580, 720, 880].map(nx => (
            <line key={nx}
              x1={nx} y1="0"
              x2={200 + (nx / 1000) * 600} y2="60"
              stroke={p.strokeFar} strokeOpacity="0.1" strokeWidth="1"
            />
          ))}

          {/* Left side wall */}
          <polygon points="0,0 200,60 200,240 0,400" fill={p.sideWall} />
          <line x1="0" y1="0"   x2="200" y2="60"  stroke={p.strokeFar} strokeWidth="1" strokeOpacity="0.2" />
          <line x1="0" y1="400" x2="200" y2="240" stroke={p.strokeFar} strokeWidth="1" strokeOpacity="0.2" />

          {/* Right side wall */}
          <polygon points="1000,0 800,60 800,240 1000,400" fill={p.sideWall} />
          <line x1="1000" y1="0"   x2="800" y2="60"  stroke={p.strokeFar} strokeWidth="1" strokeOpacity="0.2" />
          <line x1="1000" y1="400" x2="800" y2="240" stroke={p.strokeFar} strokeWidth="1" strokeOpacity="0.2" />

          {/* Back wall */}
          <rect x="200" y="60" width="600" height="180" fill={p.wallFar} />
          <rect x="200" y="60" width="600" height="180"
            stroke={p.strokeFar} strokeWidth="1" strokeOpacity="0.3" fill="none"
          />
          {/* Wainscoting */}
          <rect x="200" y="190" width="600" height="50"
            fill={p.wainscot} stroke="none"
          />

          {/* Windows — flanking bar zone */}
          {[[230, 80], [700, 80]].map(([wx, wy]) => (
            <g key={wx}>
              <rect x={wx} y={wy} width="70" height="80"
                fill={p.winFill} stroke={p.strokeFar} strokeWidth="1"
              />
              <line x1={wx + 35} y1={wy} x2={wx + 35} y2={wy + 80}
                stroke={p.strokeFar} strokeOpacity="0.2" strokeWidth="0.8"
              />
              <line x1={wx} y1={wy + 40} x2={wx + 70} y2={wy + 40}
                stroke={p.strokeFar} strokeOpacity="0.2" strokeWidth="0.8"
              />
              {!isNight && (
                <polygon
                  points={`${wx},${wy + 80} ${wx + 70},${wy + 80} ${wx + 90},240 ${wx - 20},240`}
                  fill="rgba(255,249,200,0.04)" stroke="none"
                />
              )}
            </g>
          ))}

          {/* Pendant lights on back wall — tiny bells */}
          {[350, 650].map(cx => (
            <g key={cx} style={{ filter: isNight ? 'drop-shadow(0 0 4px #FFB300)' : 'none' }}>
              <line x1={cx} y1="60" x2={cx} y2="78" stroke={p.strokeFar} strokeWidth="1" />
              <path
                d={`M${cx - 4},78 L${cx - 6},92 L${cx + 6},92 L${cx + 4},78 Z`}
                fill={isNight ? p.accent : 'rgba(255,248,192,0.7)'}
                stroke={p.stroke} strokeWidth="0.8"
              />
              <circle cx={cx} cy="78" r="2" fill={p.stroke} />
            </g>
          ))}

          {/* Bottle shelf — centred on back wall behind bar */}
          <line x1="380" y1="155" x2="620" y2="155"
            stroke={p.stroke} strokeWidth="1" strokeOpacity="0.4"
          />
          {[392, 412, 432, 452, 472, 492, 512, 532, 552, 572, 592, 608].map(x => (
            <g key={x}>
              <rect x={x - 4} y="138" width="8" height="17" rx="2"
                fill={p.bottleFill} stroke={p.strokeFar} strokeWidth="0.8"
              />
              <line x1={x} y1="135" x2={x} y2="130" stroke={p.strokeFar} strokeWidth="0.6" />
            </g>
          ))}

          {/* Floor trapezoid */}
          <polygon points="0,400 1000,400 800,240 200,240" fill={p.floor} />
          <line x1="200" y1="240" x2="800" y2="240"
            stroke={p.stroke} strokeWidth="1" strokeOpacity="0.4"
          />

          {/* 8 floorboard convergence lines → VP (500, 240) */}
          {[40, 150, 260, 380, 620, 740, 850, 960].map(nx => (
            <line key={nx}
              x1={nx} y1="400" x2={500} y2="240"
              stroke={p.strokeFar} strokeOpacity="0.1" strokeWidth="1"
            />
          ))}
          {/* Cross-planks — compress toward horizon */}
          {[0.12, 0.26, 0.40, 0.54, 0.70, 0.88].map(t => {
            const y = 240 + t * 160
            const lx = (1 - t) * 200
            const rx = 1000 - (1 - t) * 200
            return (
              <line key={t}
                x1={lx} y1={y} x2={rx} y2={y}
                stroke={p.strokeFar} strokeOpacity="0.1" strokeWidth="0.8"
              />
            )
          })}

          {/* ═══════════════════════════════════════════════
              BARKEEP — behind bar, centred at x=500
              Interactive: hover glow + click to approach
              ═══════════════════════════════════════════════ */}
          <g
            id="barkeep"
            transform="translate(500, 170)"
            style={{
              cursor: onBarkeepClick ? 'pointer' : 'default',
              filter: barkeepHover
                ? 'drop-shadow(0 0 8px #FFD700)'
                : 'none',
              transition: 'filter 0.3s ease',
            }}
            onMouseEnter={() => setBarkeepHover(true)}
            onMouseLeave={() => setBarkeepHover(false)}
            onClick={onBarkeepClick}
            pointerEvents={onBarkeepClick ? 'auto' : 'none'}
          >
            {/* Invisible hit area — larger than the sprite for easy targeting */}
            <rect x="-20" y="0" width="40" height="45" fill="transparent" />
            {/* Hat brim */}
            <line x1="-12" y1="8" x2="12" y2="8" stroke={p.npc} strokeWidth="2" />
            {/* Hat crown */}
            <path d="M-8 8 L-8 2 Q0 -3 8 2 L8 8"
              stroke={p.npc} strokeWidth="2" fill="none"
            />
            {/* Head */}
            <ellipse cx="0" cy="15" rx="6" ry="5"
              stroke={p.npc} strokeWidth="1.5"
              fill={isNight ? 'rgba(201,169,110,0.06)' : 'rgba(78,52,46,0.06)'}
            />
            {/* Neck + torso — extends below bar top, hidden by counter */}
            <line x1="0" y1="20" x2="0" y2="40" stroke={p.npc} strokeWidth="2" />
            {/* Shoulders */}
            <line x1="-8" y1="22" x2="8" y2="22" stroke={p.npc} strokeWidth="1.8" />
            {/* Arms on bar */}
            <line x1="-8" y1="22" x2="-16" y2="32" stroke={p.npc} strokeWidth="1.5" />
            <line x1="8"  y1="22" x2="16"  y2="32" stroke={p.npc} strokeWidth="1.5" />
          </g>

          {/* ═══════════════════════════════════════════════
              BAR COUNTER — centred at x=500
              ═══════════════════════════════════════════════ */}

          {/* Foreground pendant lamp — centred over bar */}
          <line x1="500" y1="0" x2="500" y2="50" stroke={p.strokeFar} strokeWidth="1" />
          <path
            d="M493,50 L490,68 L510,68 L507,50 Z"
            fill={isNight ? p.accent : 'rgba(255,248,192,0.75)'}
            stroke={p.stroke} strokeWidth="1"
            style={{ filter: isNight ? 'drop-shadow(0 0 6px #FFB300)' : 'none' }}
          />
          <circle cx="500" cy="50" r="2.5" fill={p.stroke} />
          {isNight && (
            <ellipse cx="500" cy="220" rx="60" ry="8"
              fill="rgba(255,179,0,0.05)" stroke="none"
              style={{ filter: 'blur(6px)' }}
            />
          )}

          {/* Counter top face (perspective wedge) */}
          <polygon
            points="420,200 580,200 574,192 426,192"
            fill={p.wood} stroke={p.stroke} strokeWidth="1.2"
          />
          {/* Top sheen */}
          <line x1="428" y1="193" x2="572" y2="193"
            stroke={p.sheen} strokeWidth="2"
          />
          {/* Counter front face */}
          <rect x="420" y="200" width="160" height="22"
            fill={p.woodDark} stroke={p.stroke} strokeWidth="1.2"
          />
          {/* Panel grooves */}
          {[445, 470, 500, 530, 555].map(x => (
            <line key={x} x1={x} y1="201" x2={x} y2="221"
              stroke={p.strokeFar} strokeOpacity="0.12" strokeWidth="0.8"
            />
          ))}
          {/* Rail */}
          <line x1="420" y1="210" x2="580" y2="210"
            stroke={p.strokeMid} strokeWidth="0.8" strokeOpacity="0.3"
          />

          {/* ═══════════════════════════════════════════════
              PIANO — far left wall (x=50..200)
              ═══════════════════════════════════════════════ */}
          {/* Lid top face */}
          <polygon
            points="50,255 200,255 194,248 56,248"
            fill={p.woodDark} stroke={p.stroke} strokeWidth="1.2"
          />
          {/* Body */}
          <rect x="50" y="255" width="150" height="40"
            fill={p.wood} stroke={p.stroke} strokeWidth="1.2"
          />
          {/* Key area */}
          <rect x="58" y="258" width="130" height="14"
            fill={isNight ? '#140a04' : '#4a3028'}
            stroke={p.strokeMid} strokeWidth="0.8"
          />
          {[72, 88, 104, 120, 136, 152, 168].map(x => (
            <line key={x}
              x1={x} y1="258" x2={x} y2="272"
              stroke={p.strokeMid} strokeOpacity="0.3" strokeWidth="0.7"
            />
          ))}
          {/* Legs */}
          <line x1="60"  y1="295" x2="60"  y2="315" stroke={p.stroke} strokeWidth="2.5" />
          <line x1="190" y1="295" x2="190" y2="315" stroke={p.stroke} strokeWidth="2.5" />
          {isNight && (
            <ellipse cx="125" cy="248" rx="60" ry="4"
              fill="rgba(255,179,0,0.05)" stroke="none"
              style={{ filter: 'blur(3px)' }}
            />
          )}

          {/* ═══════════════════════════════════════════════
              STOOLS — far right (x=800..950), staggered
              ═══════════════════════════════════════════════ */}
          {[
            { x: 820, y: 260, s: 0.75 },
            { x: 870, y: 275, s: 0.88 },
            { x: 930, y: 292, s: 1.0  },
          ].map(({ x, y, s }) => (
            <g key={x}>
              <ellipse cx={x} cy={y} rx={14 * s} ry={5 * s}
                fill={p.wood} stroke={p.stroke} strokeWidth="1.2"
              />
              <line
                x1={x} y1={y + 6 * s} x2={x} y2={y + 26 * s}
                stroke={p.stroke} strokeWidth={1.5 * s}
              />
              <line
                x1={x - 9 * s} y1={y + 20 * s}
                x2={x + 9 * s} y2={y + 20 * s}
                stroke={p.stroke} strokeWidth={1 * s}
              />
            </g>
          ))}

        </svg>
      </motion.div>
    </div>
  )
}
