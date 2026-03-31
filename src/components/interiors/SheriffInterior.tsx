import { motion, useTransform } from 'framer-motion'
import type { InteriorProps } from './interiorTypes'

// ─── Palettes ─────────────────────────────────────────────────────────────────
const NIGHT = {
  bg:        '#1A1412',
  wall:      '#201610',
  floor:     '#1a0e06',
  wood:      '#2a1608',
  accent:    '#FFB300',
  stroke:    '#c9a96e',
  strokeMid: 'rgba(201,169,110,0.5)',
  strokeFar: 'rgba(201,169,110,0.22)',
  winFill:   'rgba(201,169,110,0.07)',
  paperBg:   'rgba(201,169,110,0.1)',
  cellFill:  'rgba(0,0,0,0.45)',
  sheen:     'rgba(255,179,0,0.25)',
  lampGlow:  'drop-shadow(0 0 10px #FFB300)',
  npc:       '#c9a96e',
}
const DAY = {
  bg:        '#A1887F',
  wall:      '#BCAAA4',
  floor:     '#8D6E63',
  wood:      '#6D4C41',
  accent:    '#FFF9E0',
  stroke:    '#4E342E',
  strokeMid: 'rgba(78,52,46,0.5)',
  strokeFar: 'rgba(78,52,46,0.22)',
  winFill:   'rgba(255,249,224,0.5)',
  paperBg:   'rgba(200,170,110,0.4)',
  cellFill:  'rgba(0,0,0,0.1)',
  sheen:     'rgba(255,249,224,0.4)',
  lampGlow:  'none',
  npc:       '#4E342E',
}

// ─── Shared geometry ──────────────────────────────────────────────────────────
const W = '160%'
const L = '-30%'

// viewBox: 420×280 — ceiling and floor planks both visible.
// Wall occupies full bg. Desk+chair+badge in left-centre zone.
// Jail cell bars on far right (x 290–420, partially OOV).
// Wanted poster far left (x 18–84). Rifle rack (x 104–124).
// Rear window centre (x 178–242). Sheriff NPC at x=208, behind desk.

export function SheriffInterior({ isNight, mouseSpring, sw }: InteriorProps) {
  const p = isNight ? NIGHT : DAY

  // Group A (wall/windows/ceiling/floor): slow — 10% of sw
  const wallX = useTransform(mouseSpring, v => v * sw * -0.10)
  // Group B (desk, chair, badge, cell bars, NPC): fast — 20% of sw
  const furnX = useTransform(mouseSpring, v => v * sw * -0.20)

  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: p.bg,
      overflow: 'hidden',
      transition: 'background-color 1.5s',
    }}>

      {/* ══ GROUP A — WALL / CEILING / WINDOW / POSTER / RIFLE / FLOOR ══ */}
      <motion.div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: L, width: W,
        x: wallX,
      }}>
        <svg
          viewBox="0 0 420 280"
          preserveAspectRatio="xMidYMid slice"
          width="100%" height="100%"
          style={{ display: 'block' }}
          fill="none" strokeLinecap="round" strokeLinejoin="round"
        >
          {/* Back wall */}
          <rect x="0" y="0" width="420" height="280" fill={p.wall} />

          {/* Ceiling rail */}
          <line x1="0" y1="28" x2="420" y2="28" stroke={p.strokeFar} strokeWidth="1" strokeOpacity="0.45" />
          <line x1="0" y1="34" x2="420" y2="34" stroke={p.strokeFar} strokeWidth="0.6" strokeOpacity="0.25" />

          {/* Ceiling lamp — single drop, centre */}
          <line x1="210" y1="0" x2="210" y2="32" stroke={p.strokeFar} strokeWidth="0.8" />
          <ellipse cx="210" cy="40" rx="12" ry="4" fill={p.wood} stroke={p.strokeFar} strokeWidth="1" />
          <circle cx="210" cy="40" r="8"
            fill={isNight ? p.accent : 'rgba(255,255,200,0.7)'}
            stroke={p.strokeFar} strokeWidth="0.8"
            style={{ filter: isNight ? p.lampGlow : 'none' }}
          />
          {isNight && (
            <ellipse cx="210" cy="248" rx="26" ry="5"
              fill="rgba(255,179,0,0.1)" stroke="none"
              style={{ filter: 'blur(5px)' }}
            />
          )}

          {/* Rear window — centre */}
          <rect x="178" y="48" width="64" height="68" fill={p.winFill} stroke={p.strokeFar} strokeWidth="0.9" />
          <line x1="210" y1="48" x2="210" y2="116" stroke={p.strokeFar} strokeOpacity="0.35" strokeWidth="0.8" />
          <line x1="178" y1="82" x2="242" y2="82"  stroke={p.strokeFar} strokeOpacity="0.35" strokeWidth="0.8" />
          {!isNight && (
            <polygon points="178,116 242,116 268,280 150,280" fill="rgba(255,249,200,0.06)" stroke="none" />
          )}

          {/* Wanted poster — far left */}
          <rect x="18" y="58" width="62" height="84" fill={p.paperBg} stroke={p.strokeFar} strokeWidth="0.9" />
          {/* "WANTED" header line */}
          <line x1="26" y1="68"  x2="72" y2="68"  stroke={p.strokeFar} strokeOpacity="0.7"  strokeWidth="1" />
          {/* Portrait oval */}
          <ellipse cx="49" cy="92" rx="17" ry="15" stroke={p.strokeFar} strokeWidth="0.8" />
          {/* Description text lines */}
          <line x1="26" y1="114" x2="72" y2="114" stroke={p.strokeFar} strokeOpacity="0.45" strokeWidth="0.8" />
          <line x1="26" y1="122" x2="68" y2="122" stroke={p.strokeFar} strokeOpacity="0.4"  strokeWidth="0.8" />
          <line x1="26" y1="130" x2="70" y2="130" stroke={p.strokeFar} strokeOpacity="0.4"  strokeWidth="0.8" />

          {/* Rifle rack — to the right of poster */}
          <line x1="108" y1="58" x2="108" y2="148" stroke={p.strokeFar} strokeWidth="1" />
          {[76, 102, 128].map(y => (
            <line key={y} x1="96" y1={y} x2="120" y2={y} stroke={p.strokeFar} strokeOpacity="0.45" strokeWidth="0.8" />
          ))}
          {/* Rifle silhouettes */}
          {[72, 98, 124].map(y => (
            <g key={y}>
              <line x1="100" y1={y} x2="100" y2={y + 26} stroke={p.strokeFar} strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="butt" />
              <line x1="97"  y1={y + 20} x2="103" y2={y + 20} stroke={p.strokeFar} strokeOpacity="0.3" strokeWidth="0.8" />
            </g>
          ))}

          {/* Floor */}
          <rect x="0" y="248" width="420" height="32" fill={p.floor} />
          <line x1="0" y1="248" x2="420" y2="248" stroke={p.stroke} strokeWidth="1" strokeOpacity="0.5" />
          {[258, 268, 276].map(y => (
            <line key={y} x1="0" y1={y} x2="420" y2={y} stroke={p.strokeFar} strokeOpacity="0.15" strokeWidth="0.8" />
          ))}
        </svg>
      </motion.div>

      {/* ══ GROUP B — DESK / CHAIR / BADGE / CELL BARS / SHERIFF NPC ══ */}
      <motion.div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: L, width: W,
        x: furnX,
        pointerEvents: 'none',
      }}>
        <svg
          viewBox="0 0 420 280"
          preserveAspectRatio="xMidYMid slice"
          width="100%" height="100%"
          style={{ display: 'block' }}
          fill="none" strokeLinecap="round" strokeLinejoin="round"
        >
          {/* Sheriff desk */}
          <rect x="148" y="164" width="120" height="16" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
          <line x1="150" y1="165" x2="266" y2="165" stroke={p.sheen} strokeWidth="1.5" />
          <line x1="148" y1="180" x2="148" y2="248" stroke={p.stroke} strokeWidth="1.2" />
          <line x1="268" y1="180" x2="268" y2="248" stroke={p.stroke} strokeWidth="1.2" />

          {/* Papers on desk */}
          <rect x="164" y="156" width="28" height="8" fill={p.paperBg} stroke={p.strokeFar} strokeWidth="0.7" />
          <rect x="198" y="155" width="24" height="9" fill={p.paperBg} stroke={p.strokeFar} strokeWidth="0.7" />

          {/* Sheriff star badge — on desk surface */}
          <polygon
            points="208,164 210,157 212,164 219,164 214,168 216,175 208,171 202,175 204,168 199,164"
            stroke={p.stroke} strokeWidth="1"
            fill={isNight ? 'rgba(255,179,0,0.2)' : 'rgba(255,220,50,0.3)'}
          />
          {isNight && (
            <ellipse cx="208" cy="162" rx="36" ry="4"
              fill="rgba(255,179,0,0.1)" stroke="none"
              style={{ filter: 'blur(6px)' }}
            />
          )}

          {/* Chair */}
          <rect x="180" y="190" width="36" height="30" rx="2"
            fill={p.wood} stroke={p.strokeMid} strokeWidth="1" strokeOpacity="0.6"
          />
          {/* Chair back */}
          <rect x="182" y="178" width="32" height="14" rx="2"
            fill={p.wood} stroke={p.strokeMid} strokeWidth="0.9" strokeOpacity="0.5"
          />

          {/* Sheriff NPC — seated behind desk */}
          <g id="sheriff" transform="translate(208, 138)">
            {/* Hat */}
            <line x1="-8" y1="8"  x2="8"  y2="8"  stroke={p.npc} strokeWidth="1.4" />
            <path d="M-6 8 L-6 3 Q0 0 6 3 L6 8" stroke={p.npc} strokeWidth="1.4" fill="none" />
            {/* Head */}
            <ellipse cx="0" cy="13" rx="4" ry="3.5" stroke={p.npc} strokeWidth="1.2" />
            {/* Body */}
            <line x1="0" y1="17" x2="0"  y2="26" stroke={p.npc} strokeWidth="1.4" />
            {/* Arms resting on desk */}
            <line x1="0" y1="20" x2="-9" y2="25" stroke={p.npc} strokeWidth="1.2" />
            <line x1="0" y1="20" x2="9"  y2="25" stroke={p.npc} strokeWidth="1.2" />
          </g>

          {/* Jail cell bars — far right, partially OOV (revealed by panning right) */}
          <rect x="295" y="58" width="130" height="190" fill={p.cellFill} stroke={p.stroke} strokeWidth="1.2" />
          {[311, 325, 339, 353, 367, 381, 397, 411].map(x => (
            <line key={x} x1={x} y1="58" x2={x} y2="248"
              stroke={p.strokeMid} strokeOpacity="0.55" strokeWidth="1"
            />
          ))}
          {/* Cell mid-bar */}
          <line x1="295" y1="148" x2="425" y2="148" stroke={p.strokeMid} strokeOpacity="0.4" strokeWidth="0.9" />
          {/* Door hinges */}
          <rect x="295" y="66"  width="8" height="5" fill={p.wood} stroke={p.strokeMid} strokeOpacity="0.6" />
          <rect x="295" y="112" width="8" height="5" fill={p.wood} stroke={p.strokeMid} strokeOpacity="0.6" />
        </svg>
      </motion.div>

    </div>
  )
}
