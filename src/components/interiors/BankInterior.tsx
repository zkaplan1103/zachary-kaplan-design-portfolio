import type { InteriorProps } from './interiorTypes'

const NIGHT = {
  bg:        '#0e0904',
  wall:      '#1a1006',
  floor:     '#160c04',
  wood:      '#2a1608',
  accent:    '#FFB300',
  stroke:    '#c9a96e',
  strokeMid: 'rgba(201,169,110,0.5)',
  strokeFar: 'rgba(201,169,110,0.22)',
  vaultRing: 'rgba(201,169,110,0.55)',
  winFill:   'rgba(201,169,110,0.06)',
  sheen:     'rgba(255,179,0,0.18)',
}
const DAY = {
  bg:        '#b89050',
  wall:      '#c8a060',
  floor:     '#a07838',
  wood:      '#8B6030',
  accent:    '#FFF9E0',
  stroke:    '#5a3a10',
  strokeMid: 'rgba(90,58,16,0.5)',
  strokeFar: 'rgba(90,58,16,0.22)',
  vaultRing: 'rgba(90,58,16,0.5)',
  winFill:   'rgba(255,249,224,0.4)',
  sheen:     'rgba(255,248,150,0.35)',
}

export function BankInterior({ isNight, panX }: InteriorProps) {
  const p = isNight ? NIGHT : DAY

  return (
    <div
      style={{
        position:        'absolute',
        inset:           0,
        backgroundColor: p.bg,
        overflow:        'hidden',
        transition:      'background-color 1.5s',
      }}
    >
      <svg
        viewBox="0 0 420 260"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position:   'absolute',
          top:        0,
          left:       '-15%',
          width:      '130%',
          height:     '100%',
          transform:  `translateX(${panX}px)`,
          transitionProperty:       'transform',
          transitionDuration:       '0.25s',
          transitionTimingFunction: 'ease-out',
        }}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Back wall */}
        <rect x="0" y="0" width="420" height="260" fill={p.wall} />

        {/* Ceiling moulding */}
        <line x1="0" y1="22" x2="420" y2="22" stroke={p.strokeFar} strokeWidth="1" strokeOpacity="0.45" />
        <line x1="0" y1="28" x2="420" y2="28" stroke={p.strokeFar} strokeWidth="0.6" strokeOpacity="0.25" />

        {/* Chandelier — centre */}
        <line x1="210" y1="0"  x2="210" y2="36" stroke={p.strokeFar} strokeWidth="1" />
        <ellipse cx="210" cy="44" rx="28" ry="9" fill={p.wood} stroke={p.strokeFar} strokeWidth="1" />
        {[-18, -8, 2, 12, 22].map((dx) => (
          <g key={dx}>
            <line x1={210 + dx} y1="53" x2={210 + dx + 2} y2="70" stroke={p.strokeFar} strokeOpacity="0.4" strokeWidth="0.8" />
            <circle cx={210 + dx + 1} cy="72" r="3"
              fill={isNight ? p.accent : 'rgba(255,248,192,0.65)'}
              stroke={p.strokeFar} strokeWidth="0.7"
              style={{ filter: isNight ? `drop-shadow(0 0 6px ${p.accent})` : 'none' }}
            />
          </g>
        ))}
        {/* Night: chandelier glow pool */}
        {isNight && (
          <ellipse cx="210" cy="220" rx="50" ry="7"
            fill="rgba(255,179,0,0.1)" stroke="none"
            style={{ filter: 'blur(6px)' }}
          />
        )}

        {/* Teller windows — 3 bays */}
        {[94, 188, 282].map((x) => (
          <g key={x}>
            <rect x={x} y="68" width="56" height="56"
              fill={isNight ? 'rgba(201,169,110,0.04)' : 'rgba(255,249,224,0.12)'}
              stroke={p.strokeFar} strokeWidth="0.9"
            />
            {[x + 10, x + 22, x + 34, x + 46].map((gx) => (
              <line key={gx} x1={gx} y1="68" x2={gx} y2="124" stroke={p.strokeFar} strokeOpacity="0.35" strokeWidth="0.7" />
            ))}
            <line x1={x} y1="96" x2={x + 56} y2="96" stroke={p.strokeFar} strokeOpacity="0.3" strokeWidth="0.8" />
            <rect x={x + 10} y="118" width="36" height="6" stroke={p.strokeFar} strokeOpacity="0.5" strokeWidth="0.8" />
          </g>
        ))}

        {/* Teller counter */}
        <rect x="74" y="124" width="260" height="16" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
        <line x1="76" y1="125" x2="332" y2="125" stroke={p.sheen} strokeWidth="2" />
        <line x1="74"  y1="140" x2="74"  y2="222" stroke={p.stroke} strokeWidth="1.2" />
        <line x1="334" y1="140" x2="334" y2="222" stroke={p.stroke} strokeWidth="1.2" />

        {/* Vault door — far left wall */}
        <circle cx="34"  cy="150" r="42" fill={isNight ? '#1a1006' : '#8B6030'} stroke={p.stroke} strokeWidth="1.2" />
        <circle cx="34"  cy="150" r="32" stroke={p.vaultRing} strokeWidth="1" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={34 + Math.cos(rad) * 10} y1={150 + Math.sin(rad) * 10}
              x2={34 + Math.cos(rad) * 28} y2={150 + Math.sin(rad) * 28}
              stroke={p.vaultRing} strokeOpacity="0.5" strokeWidth="0.9"
            />
          )
        })}
        <circle cx="34" cy="150" r="8" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
        <line x1="42" y1="150" x2="60" y2="150" stroke={p.stroke} strokeWidth="2" />
        <circle cx="63" cy="150" r="4" fill={p.wood} stroke={p.stroke} strokeWidth="1" />

        {/* Floor safe — far right */}
        <rect x="354" y="162" width="48" height="60" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
        <rect x="364" y="172" width="28" height="34" fill={isNight ? '#1a0d04' : '#7a5025'} stroke={p.strokeMid} strokeOpacity="0.6" strokeWidth="0.9" />
        <circle cx="378" cy="189" r="8"  fill={p.wood} stroke={p.strokeMid} strokeOpacity="0.7" />
        <circle cx="378" cy="189" r="3"  fill={isNight ? p.accent : '#c8a020'} />

        {/* Floor */}
        <rect x="0" y="222" width="420" height="38" fill={p.floor} />
        <line x1="0" y1="222" x2="420" y2="222" stroke={p.stroke} strokeWidth="1" strokeOpacity="0.5" />
        {[232, 244, 254].map((y) => (
          <line key={y} x1="0" y1={y} x2="420" y2={y} stroke={p.strokeFar} strokeOpacity="0.15" strokeWidth="0.8" />
        ))}

        {/* Day: light shaft from chandelier area */}
        {!isNight && (
          <polygon
            points="184,53 236,53 258,222 160,222"
            fill="rgba(255,249,200,0.06)"
            stroke="none"
          />
        )}
      </svg>
    </div>
  )
}
