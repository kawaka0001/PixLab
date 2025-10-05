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
