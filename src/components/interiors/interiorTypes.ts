// Shared props for all interior SVG components
export interface InteriorProps {
  isNight: boolean
  // Single pan offset in px — the ENTIRE interior canvas translates as one rigid body.
  // Mouse far-right → large negative panX → reveals right side of room.
  // Computed in BuildingInteriorPage: panX = mouseNorm * sw * -0.15
  panX: number
}
