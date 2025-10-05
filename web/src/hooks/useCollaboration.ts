import { useEffect, useState, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type {
  UserCursor,
  CursorBroadcastPayload,
  ImageUploadPayload,
  FilterChangePayload,
} from '../types/collaboration'
import type { FilterState } from '../types/filters'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
]

/**
 * Generate a stable user ID (persisted in localStorage)
 */
function getUserId(): string {
  const stored = localStorage.getItem('pixlab_user_id')
  if (stored) return stored

  const newId = `user_${Math.random().toString(36).substr(2, 9)}`
  localStorage.setItem('pixlab_user_id', newId)
  return newId
}

/**
 * Generate a stable user color based on user ID
 */
function getUserColor(userId: string): string {
  const stored = localStorage.getItem('pixlab_user_color')
  if (stored) return stored

  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const color = COLORS[hash % COLORS.length]
  localStorage.setItem('pixlab_user_color', color)
  return color
}

/**
 * Get or create room ID from URL
 */
function getRoomId(): string {
  const params = new URLSearchParams(window.location.search)
  const roomId = params.get('room')

  if (roomId) return roomId

  // Generate new room ID and update URL
  const newRoomId = Math.random().toString(36).substr(2, 9)
  const newUrl = `${window.location.pathname}?room=${newRoomId}`
  window.history.replaceState({}, '', newUrl)
  return newRoomId
}

export interface SharedImage {
  url: string
  width: number
  height: number
  uploadedBy: string
  timestamp: number
}

export interface UseCollaborationResult {
  roomId: string
  userId: string
  userColor: string
  otherCursors: Map<string, UserCursor>
  sharedImage: SharedImage | null
  sharedFilters: FilterState | null
  broadcastCursor: (x: number, y: number) => void
  broadcastImage: (url: string, width: number, height: number) => void
  broadcastFilters: (filters: FilterState) => void
  isConnected: boolean
}

/**
 * Real-time collaboration hook using Supabase Broadcast
 *
 * Features:
 * - Ultra-low latency cursor sharing (6ms median)
 * - Automatic room management via URL
 * - Persistent user identity
 */
export function useCollaboration(): UseCollaborationResult {
  const [userId] = useState(() => getUserId())
  const [userColor] = useState(() => getUserColor(userId))
  const [roomId] = useState(() => getRoomId())
  const [otherCursors, setOtherCursors] = useState<Map<string, UserCursor>>(new Map())
  const [sharedImage, setSharedImage] = useState<SharedImage | null>(null)
  const [sharedFilters, setSharedFilters] = useState<FilterState | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const cleanupTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current) return

    const payload: CursorBroadcastPayload = {
      type: 'cursor',
      userId,
      x,
      y,
      color: userColor,
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor-move',
      payload,
    })
  }, [userId, userColor])

  const broadcastImage = useCallback((url: string, width: number, height: number) => {
    if (!channelRef.current) return

    const payload: ImageUploadPayload = {
      type: 'image_upload',
      userId,
      imageUrl: url,
      width,
      height,
      timestamp: Date.now(),
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'image-upload',
      payload,
    })
  }, [userId])

  const broadcastFilters = useCallback((filters: FilterState) => {
    if (!channelRef.current) return

    const payload: FilterChangePayload = {
      type: 'filter_change',
      userId,
      filters,
      timestamp: Date.now(),
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'filter-change',
      payload,
    })
  }, [userId])

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: false }, // Don't receive own messages
      },
    })

    channel
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        const data = payload as CursorBroadcastPayload

        if (data.userId === userId) return // Extra safety check

        setOtherCursors(prev => {
          const next = new Map(prev)
          next.set(data.userId, {
            userId: data.userId,
            x: data.x,
            y: data.y,
            color: data.color,
            timestamp: Date.now(),
          })
          return next
        })

        // Auto-remove cursor after 5 seconds of inactivity
        const existingTimer = cleanupTimersRef.current.get(data.userId)
        if (existingTimer) clearTimeout(existingTimer)

        const timer = setTimeout(() => {
          setOtherCursors(prev => {
            const next = new Map(prev)
            next.delete(data.userId)
            return next
          })
          cleanupTimersRef.current.delete(data.userId)
        }, 5000)

        cleanupTimersRef.current.set(data.userId, timer)
      })
      .on('broadcast', { event: 'image-upload' }, ({ payload }) => {
        const data = payload as ImageUploadPayload

        if (data.userId === userId) return // Don't process own uploads

        setSharedImage({
          url: data.imageUrl,
          width: data.width,
          height: data.height,
          uploadedBy: data.userId,
          timestamp: data.timestamp,
        })
      })
      .on('broadcast', { event: 'filter-change' }, ({ payload }) => {
        const data = payload as FilterChangePayload

        if (data.userId === userId) return // Don't process own changes

        setSharedFilters(data.filters)
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      cleanupTimersRef.current.forEach(timer => clearTimeout(timer))
      cleanupTimersRef.current.clear()
    }
  }, [roomId, userId])

  return {
    roomId,
    userId,
    userColor,
    otherCursors,
    sharedImage,
    sharedFilters,
    broadcastCursor,
    broadcastImage,
    broadcastFilters,
    isConnected,
  }
}
