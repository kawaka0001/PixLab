import type { FilterState } from '../types/filters'
import logger from '../utils/logger'

const DB_NAME = 'pixlab_cache'
const STORE_NAME = 'room_states'
const DB_VERSION = 1

export interface CachedRoomState {
  roomId: string
  imageUrl: string | null
  imageWidth: number
  imageHeight: number
  filters: FilterState
  timestamp: number
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      logger.error('Failed to open IndexedDB', {
        action: 'INDEXEDDB_OPEN_ERROR',
        error: request.error?.message,
      })
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store with roomId as key
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'roomId' })
        logger.info('IndexedDB object store created', {
          action: 'INDEXEDDB_INIT',
        })
      }
    }
  })
}

/**
 * Save room state to IndexedDB
 */
export async function saveCachedState(state: CachedRoomState): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.put(state)

      request.onsuccess = () => {
        logger.debug('Room state saved to cache', {
          action: 'CACHE_SAVE',
          roomId: state.roomId,
          timestamp: state.timestamp,
        })
        resolve()
      }

      request.onerror = () => {
        logger.error('Failed to save to cache', {
          action: 'CACHE_SAVE_ERROR',
          error: request.error?.message,
        })
        reject(request.error)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (err) {
    logger.error('Cache save failed', {
      action: 'CACHE_SAVE_ERROR',
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}

/**
 * Load room state from IndexedDB
 */
export async function loadCachedState(roomId: string): Promise<CachedRoomState | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get(roomId)

      request.onsuccess = () => {
        const result = request.result as CachedRoomState | undefined

        if (result) {
          logger.info('Room state loaded from cache', {
            action: 'CACHE_LOAD',
            roomId,
            timestamp: result.timestamp,
            hasImage: !!result.imageUrl,
          })
        } else {
          logger.debug('No cached state found', {
            action: 'CACHE_LOAD',
            roomId,
          })
        }

        resolve(result || null)
      }

      request.onerror = () => {
        logger.error('Failed to load from cache', {
          action: 'CACHE_LOAD_ERROR',
          error: request.error?.message,
        })
        reject(request.error)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (err) {
    logger.error('Cache load failed', {
      action: 'CACHE_LOAD_ERROR',
      error: err instanceof Error ? err.message : String(err),
    })
    return null // Fail gracefully
  }
}

/**
 * Clear cached state for a room
 */
export async function clearCachedState(roomId: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.delete(roomId)

      request.onsuccess = () => {
        logger.info('Cached state cleared', {
          action: 'CACHE_CLEAR',
          roomId,
        })
        resolve()
      }

      request.onerror = () => {
        logger.error('Failed to clear cache', {
          action: 'CACHE_CLEAR_ERROR',
          error: request.error?.message,
        })
        reject(request.error)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (err) {
    logger.error('Cache clear failed', {
      action: 'CACHE_CLEAR_ERROR',
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}
