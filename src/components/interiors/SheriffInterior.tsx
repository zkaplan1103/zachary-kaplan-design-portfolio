export function SheriffInterior() {
  return (
    <svg
      viewBox="0 0 320 200"
      width="100%"
      style={{ maxWidth: 480, opacity: 0.75 }}
      stroke="#c9a96e"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
      aria-label="Sheriff's office interior"
    >
      {/* Floor */}
      <line x1="0" y1="170" x2="320" y2="170" />
      {/* Desk */}
      <rect x="98" y="118" width="84" height="10" />
      <line x1="104" y1="128" x2="104" y2="170" />
      <line x1="176" y1="128" x2="176" y2="170" />
      {/* Chair behind desk */}
      <rect x="126" y="138" width="28" height="22" rx="2" strokeOpacity="0.5" />
      <line x1="126" y1="138" x2="126" y2="128" strokeOpacity="0.4" />
      <line x1="154" y1="138" x2="154" y2="128" strokeOpacity="0.4" />
      {/* Star badge on desk */}
      <polygon
        points="140,121 142,116 144,121 149,121 145,124 147,129 142,126 137,129 139,124 135,121"
        strokeOpacity="0.9"
      />
      {/* Jail cell — right side */}
      <rect x="220" y="55" width="84" height="115" />
      {[232, 244, 256, 268, 280, 292].map((x) => (
        <line key={x} x1={x} y1="55" x2={x} y2="170" strokeOpacity="0.55" />
      ))}
      <line x1="220" y1="113" x2="304" y2="113" strokeOpacity="0.4" />
      {/* Cell door hinges */}
      <rect x="220" y="60" width="6" height="4" strokeOpacity="0.6" />
      <rect x="220" y="100" width="6" height="4" strokeOpacity="0.6" />
      {/* Wanted poster — left wall */}
      <rect x="18" y="45" width="54" height="72" />
      <ellipse cx="45" cy="66" rx="14" ry="12" strokeOpacity="0.65" />
      <line x1="28" y1="84" x2="62" y2="84" strokeOpacity="0.5" />
      <line x1="28" y1="92" x2="58" y2="92" strokeOpacity="0.5" />
      <line x1="28" y1="100" x2="60" y2="100" strokeOpacity="0.5" />
      <line x1="28" y1="108" x2="54" y2="108" strokeOpacity="0.4" />
      {/* "WANTED" text suggestion */}
      <line x1="30" y1="52" x2="60" y2="52" strokeOpacity="0.7" />
      {/* Rifle rack */}
      <line x1="88" y1="45" x2="88" y2="118" />
      <line x1="78" y1="55" x2="98" y2="55" strokeOpacity="0.5" />
      <line x1="78" y1="75" x2="98" y2="75" strokeOpacity="0.5" />
      <line x1="78" y1="95" x2="98" y2="95" strokeOpacity="0.5" />
      {/* Rifle silhouettes */}
      {[55, 75, 95].map((y) => (
        <line key={y} x1="88" y1={y + 2} x2="88" y2={y + 16} strokeOpacity="0.4" />
      ))}
      {/* Window */}
      <rect x="155" y="45" width="44" height="52" />
      <line x1="177" y1="45" x2="177" y2="97" strokeOpacity="0.4" />
      <line x1="155" y1="71" x2="199" y2="71" strokeOpacity="0.4" />
    </svg>
  )
}
