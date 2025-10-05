import type { FilterState } from './filters'

/**
 * Cursor position in canvas coordinates
 */
export interface CursorPosition {
  x: number
  y: number
}

/**
 * User cursor with metadata
 */
export interface UserCursor extends CursorPosition {
  userId: string
  color: string // User-specific color for visual distinction
  timestamp: number
}

/**
 * Broadcast event payload for cursor updates
 */
export interface CursorBroadcastPayload {
  type: 'cursor'
  userId: string
  x: number
  y: number
  color: string
}

/**
 * Broadcast event payload for image uploads
 */
export interface ImageUploadPayload {
  type: 'image_upload'
  userId: string
  imageUrl: string
  width: number
  height: number
  timestamp: number
}

/**
 * Broadcast event payload for filter changes
 * Reuses FilterState from filters.ts to ensure consistency
 */
export interface FilterChangePayload {
  type: 'filter_change'
  userId: string
  filters: FilterState
  timestamp: number
}

/**
 * Union type for all broadcast payloads
 */
export type BroadcastPayload =
  | CursorBroadcastPayload
  | ImageUploadPayload
  | FilterChangePayload
