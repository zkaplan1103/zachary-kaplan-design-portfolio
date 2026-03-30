import type { InteriorProps } from './interiorTypes'

const NIGHT = {
  bg:        '#120a04',
  wall:      '#1e1006',
  floor:     '#1a0e06',
  wood:      '#2a1608',
  accent:    '#FFB300',
  stroke:    '#c9a96e',
  strokeMid: 'rgba(201,169,110,0.5)',
  strokeFar: 'rgba(201,169,110,0.22)',
  winFill:   'rgba(201,169,110,0.07)',
  paperBg:   'rgba(201,169,110,0.1)',
  cellFill:  'rgba(0,0,0,0.4)',
  sheen:     'rgba(255,179,0,0.2)',
}
const DAY = {
  bg:        '#b89050',
  wall:      '#c8a060',
  floor:     '#a87e40',
  wood:      '#8B6030',
  accent:    '#FFF9E0',
  stroke:    '#5a3a10',
  strokeMid: 'rgba(90,58,16,0.5)',
  strokeFar: 'rgba(90,58,16,0.22)',
  winFill:   'rgba(255,249,224,0.4)',
  paperBg:   'rgba(220,190,120,0.4)',
  cellFill:  'rgba(0,0,0,0.1)',
  sheen:     'rgba(255,248,150,0.35)',
}

export function SheriffInterior({ isNight, panX }: InteriorProps) {
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

        {/* Rear window — centre */}
        <rect x="178" y="44" width="64" height="76"
          fill={p.winFill} stroke={p.strokeFar} strokeWidth="0.9"
        />
        <line x1="210" y1="44" x2="210" y2="120" stroke={p.strokeFar} strokeOpacity="0.35" strokeWidth="0.8" />
        <line x1="178" y1="82" x2="242" y2="82"  stroke={p.strokeFar} strokeOpacity="0.35" strokeWidth="0.8" />
        {/* Day: sunbeam */}
        {!isNight && (
          <polygon
            points="178,120 242,120 270,260 148,260"
            fill="rgba(255,249,200,0.06)"
            stroke="none"
          />
        )}

        {/* Wanted poster — far left wall */}
        <rect x="14" y="54" width="66" height="88" fill={p.paperBg} stroke={p.strokeFar} strokeWidth="0.9" />
        <ellipse cx="47" cy="80" rx="18" ry="16" stroke={p.strokeFar} strokeWidth="0.8" />
        <line x1="26" y1="104" x2="74" y2="104" stroke={p.strokeFar} strokeOpacity="0.45" strokeWidth="0.8" />
        <line x1="26" y1="114" x2="68" y2="114" stroke={p.strokeFar} strokeOpacity="0.4"  strokeWidth="0.8" />
        <line x1="26" y1="124" x2="72" y2="124" stroke={p.strokeFar} strokeOpacity="0.4"  strokeWidth="0.8" />
        <line x1="28" y1="62"  x2="66" y2="62"  stroke={p.strokeFar} strokeOpacity="0.7"  strokeWidth="1" />

        {/* Rifle rack */}
        <line x1="104" y1="54" x2="104" y2="148" stroke={p.strokeFar} strokeWidth="1" />
        <line x1="92"  y1="70" x2="116" y2="70"  stroke={p.strokeFar} strokeOpacity="0.45" strokeWidth="0.8" />
        <line x1="92"  y1="96" x2="116" y2="96"  stroke={p.strokeFar} strokeOpacity="0.45" strokeWidth="0.8" />
        <line x1="92"  y1="122" x2="116" y2="122" stroke={p.strokeFar} strokeOpacity="0.45" strokeWidth="0.8" />

        {/* Floor */}
        <rect x="0" y="222" width="420" height="38" fill={p.floor} />
        <line x1="0" y1="222" x2="420" y2="222" stroke={p.stroke} strokeWidth="1" strokeOpacity="0.5" />
        {[232, 244, 254].map((y) => (
          <line key={y} x1="0" y1={y} x2="420" y2={y} stroke={p.strokeFar} strokeOpacity="0.15" strokeWidth="0.8" />
        ))}

        {/* Desk */}
        <rect x="128" y="152" width="108" height="14" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
        <line x1="128" y1="152" x2="136" y2="152" stroke={p.sheen} strokeWidth="2" />
        <line x1="128" y1="166" x2="128" y2="222" stroke={p.stroke} strokeWidth="1.2" />
        <line x1="236" y1="166" x2="236" y2="222" stroke={p.stroke} strokeWidth="1.2" />
        {/* Desk sheen */}
        <line x1="130" y1="153" x2="234" y2="153" stroke={p.sheen} strokeWidth="1.5" />

        {/* Sheriff star badge on desk */}
        <polygon
          points="182,155 184,148 186,155 193,155 188,159 190,166 184,162 178,166 180,159 175,155"
          stroke={p.stroke} strokeWidth="1"
          fill={isNight ? 'rgba(255,179,0,0.15)' : 'rgba(255,220,50,0.25)'}
        />

        {/* Chair */}
        <rect x="160" y="178" width="36" height="30" rx="2"
          fill={p.wood} stroke={p.strokeMid} strokeWidth="1" strokeOpacity="0.6"
        />

        {/* Jail cell — far right */}
        <rect x="286" y="68" width="120" height="154" fill={p.cellFill} stroke={p.stroke} strokeWidth="1.2" />
        {[300, 315, 330, 345, 360, 375, 390].map((x) => (
          <line key={x} x1={x} y1="68" x2={x} y2="222" stroke={p.strokeMid} strokeOpacity="0.5" strokeWidth="0.9" />
        ))}
        <line x1="286" y1="145" x2="406" y2="145" stroke={p.strokeMid} strokeOpacity="0.4" strokeWidth="0.9" />
        {/* Cell hinges */}
        <rect x="286" y="76" width="8" height="5" fill={p.wood} stroke={p.strokeMid} strokeOpacity="0.6" />
        <rect x="286" y="122" width="8" height="5" fill={p.wood} stroke={p.strokeMid} strokeOpacity="0.6" />
      </svg>
    </div>
  )
}
