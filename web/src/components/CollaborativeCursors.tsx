import type { UserCursor } from '../types/collaboration'

interface CollaborativeCursorsProps {
  cursors: Map<string, UserCursor>
  containerRef: React.RefObject<HTMLDivElement>
}

/**
 * Render collaborative cursors from other users
 *
 * Features:
 * - Smooth position transitions
 * - User-specific colors
 * - User ID labels
 * - Automatic cleanup on inactivity
 */
export function CollaborativeCursors({ cursors, containerRef }: CollaborativeCursorsProps) {
  if (!containerRef.current) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from(cursors.values()).map((cursor) => (
        <Cursor key={cursor.userId} cursor={cursor} />
      ))}
    </div>
  )
}

interface CursorProps {
  cursor: UserCursor
}

function Cursor({ cursor }: CursorProps) {
  return (
    <div
      className="absolute transition-all duration-100 ease-out"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor Icon (SVG) */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        <path
          d="M5.65376 12.3673L13.3165 4.70451C13.6344 4.38656 14.1742 4.38656 14.4922 4.70451L19.3538 9.56615C19.6717 9.88411 19.6717 10.4239 19.3538 10.7419L11.691 18.4046C11.373 18.7226 10.8332 18.7226 10.5153 18.4046L5.65376 13.5429C5.33581 13.225 5.33581 12.6852 5.65376 12.3673Z"
          fill={cursor.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User Label */}
      <div
        className="ml-4 -mt-2 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-lg"
        style={{
          backgroundColor: cursor.color,
        }}
      >
        {cursor.userId.split('_')[1]?.slice(0, 6) || 'User'}
      </div>
    </div>
  )
}
