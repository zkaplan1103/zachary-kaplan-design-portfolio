// ── Particle count ────────────────────────────────────────────────────────────
export const PARTICLE_COUNT = 500

// ── Spring physics ────────────────────────────────────────────────────────────
export const SPRING = 0.06   // pull strength toward target
export const DAMPING = 0.88  // velocity decay per frame

// ── Scatter mode ──────────────────────────────────────────────────────────────
// Frames before a particle picks a new random target (~2–6s at 60fps)
export const SCATTER_LIFETIME_MIN = 120
export const SCATTER_LIFETIME_MAX = 360

// Opacity range in scatter mode (dim, not invisible)
export const SCATTER_OPACITY_MIN = 0.12
export const SCATTER_OPACITY_MAX = 0.35

// ── Character flickering ──────────────────────────────────────────────────────
// Frames between random character changes per particle
export const CHAR_FLIP_MIN = 20
export const CHAR_FLIP_MAX = 100

// ── Rendering ─────────────────────────────────────────────────────────────────
export const FONT_SIZE = 11
export const CHARS = '0123456789!@#$%^&*()_-+=[]{}|;:,./<>?~`\'"\\abcdefghijklmnopqrstuvwxyz'

// var(--fg) = #f0efe9 decomposed for rgba() canvas compositing
export const FG_R = 240
export const FG_G = 239
export const FG_B = 233

// ── ZK startup ────────────────────────────────────────────────────────────────
// How long (ms) particles hold the ZK letterform before scattering.
// Entire sequence happens under the CRTPowerOn overlay (2800ms).
export const ZK_HOLD_MS = 500
