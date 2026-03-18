// ZK_GRID data for use by the swarm engine.
// Copied from IntroAnimation.tsx — no import coupling, both files own their copy.
// Each cell with value 1 becomes a particle target position.

export const CELL_SIZE = 26
export const ZK_ROWS = 18
export const ZK_COLS = 30          // Z(14) + gap(2) + K(14)
export const ZK_TOTAL_W = (ZK_COLS - 1) * CELL_SIZE  // 754px
export const ZK_TOTAL_H = (ZK_ROWS - 1) * CELL_SIZE  // 442px

const Z_GRID: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 0  — top bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 1
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 2
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 3
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 4
  [0,0,0,0,0,0,0,0,1,1,1,1,0,0], // Row 5  — diagonal
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0], // Row 6
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0], // Row 7
  [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // Row 8
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0], // Row 9
  [0,0,0,1,1,1,1,0,0,0,0,0,0,0], // Row 10
  [0,0,1,1,1,1,0,0,0,0,0,0,0,0], // Row 11
  [0,1,1,1,1,0,0,0,0,0,0,0,0,0], // Row 12
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 13 — bottom bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 14
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 15
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 16
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 17
]

const K_GRID: number[][] = [
  [1,1,1,1,1, 0,0,0,0,0, 1,1,1,1], // Row 0  — stem | upper arm cols 10-13
  [1,1,1,1,1, 0,0,0,0, 1,1,1,1,0], // Row 1
  [1,1,1,1,1, 0,0,0, 1,1,1,1,0,0], // Row 2
  [1,1,1,1,1, 0,0, 1,1,1,1,0,0,0], // Row 3
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 4
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 5
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 6  — V-notch
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 7
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 8
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 9
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 10
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 11
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 12 — lower arm
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 13
  [1,1,1,1,1, 0,0, 1,1,1,1,0,0,0], // Row 14
  [1,1,1,1,1, 0,0,0, 1,1,1,1,0,0], // Row 15
  [1,1,1,1,1, 0,0,0,0, 1,1,1,1,0], // Row 16
  [1,1,1,1,1, 0,0,0,0,0, 1,1,1,1], // Row 17
]

// Combined Z | 2-col gap | K → 30 cols total
export const ZK_GRID: number[][] = Z_GRID.map((zRow, r) => [...zRow, 0, 0, ...K_GRID[r]])

// Returns all filled cell coordinates (row, col) in the ZK grid.
export function getZKCells(): { col: number; row: number }[] {
  const cells: { col: number; row: number }[] = []
  for (let r = 0; r < ZK_ROWS; r++) {
    for (let c = 0; c < ZK_COLS; c++) {
      if (ZK_GRID[r][c] === 1) cells.push({ col: c, row: r })
    }
  }
  return cells
}
