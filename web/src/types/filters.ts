/**
 * Filter State Type Definition
 *
 * Single Source of Truth for all filter-related types.
 * Used across App.tsx, FilterControls.tsx, and other filter components.
 */

export type RotationAngle = 0 | 90 | 180 | 270

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface FilterState {
  grayscale: boolean
  blur: number
  brightness: number
  flipHorizontal: boolean
  flipVertical: boolean
  rotation: RotationAngle
  cropArea: CropArea | null
}

/**
 * Initial filter state with all filters disabled
 */
export const initialFilterState: FilterState = {
  grayscale: false,
  blur: 0,
  brightness: 0,
  flipHorizontal: false,
  flipVertical: false,
  rotation: 0,
  cropArea: null,
}
