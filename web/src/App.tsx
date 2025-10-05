import { useState, useEffect, useRef } from 'react'
import { ImageUploader } from './components/ImageUploader'
import { FilterControls } from './components/FilterControls'
import { ImageCanvas } from './components/ImageCanvas'
import { CollaborativeCursorsCanvas } from './components/CollaborativeCursorsCanvas'
import { useWasm } from './wasm/useWasm'
import { useCollaboration } from './hooks/useCollaboration'
import { uploadImage, downloadImageAsImageData } from './lib/storage'
import { saveCachedState, loadCachedState } from './lib/cache'
import { analyzeImage, type ImageMetadata } from './lib/imageMetadata'
import logger from './utils/logger'
import { type FilterState, initialFilterState } from './types/filters'

function App() {
  const { wasmModule, isLoading, error } = useWasm()
  const {
    roomId,
    userId: _userId, // Reserved for future use
    otherCursors,
    sharedImage,
    sharedFilters,
    broadcastCursor,
    broadcastImage,
    broadcastFilters,
    isConnected
  } = useCollaboration()
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<ImageData | null>(null)
  const [processedImage, setProcessedImage] = useState<ImageData | null>(null)
  const [filters, setFilters] = useState<FilterState>(initialFilterState)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [cropMode, setCropMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [isRestoringCache, setIsRestoringCache] = useState(true)
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)

  useEffect(() => {
    if (wasmModule) {
      logger.info('WASM module loaded successfully! 🎉', {
        action: 'WASM_INIT',
      })
      try {
        const greeting = wasmModule.greet('Developer')
        logger.debug('Greeting test', { action: 'WASM_GREET', greeting })
      } catch (err) {
        logger.error('Greet test failed', {
          action: 'WASM_GREET',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }, [wasmModule])

  /**
   * Restore cached state on initial load
   * Provides instant recovery after page reload
   */
  useEffect(() => {
    const restoreCache = async () => {
      try {
        const cached = await loadCachedState(roomId)

        if (cached && cached.imageUrl) {
          logger.info('Restoring from cache', {
            action: 'CACHE_RESTORE',
            timestamp: cached.timestamp,
          })

          // Restore filters immediately
          setFilters(cached.filters)

          // Download and restore image
          const imageData = await downloadImageAsImageData(cached.imageUrl)
          setImage(imageData)
          setProcessedImage(imageData)
          setCurrentImageUrl(cached.imageUrl)

          logger.info('Cache restored successfully', {
            action: 'CACHE_RESTORE_SUCCESS',
          })
        }
      } catch (err) {
        logger.error('Failed to restore cache', {
          action: 'CACHE_RESTORE_ERROR',
          error: err instanceof Error ? err.message : String(err),
        })
      } finally {
        setIsRestoringCache(false)
      }
    }

    restoreCache()
  }, [roomId]) // Only run once on mount

  /**
   * Auto-save state to cache (debounced)
   * Saves current image URL and filters for instant recovery
   */
  useEffect(() => {
    if (isRestoringCache) return // Don't save while restoring
    if (!currentImageUrl || !image) return // Nothing to save yet

    const timeoutId = setTimeout(async () => {
      try {
        await saveCachedState({
          roomId,
          imageUrl: currentImageUrl,
          imageWidth: image.width,
          imageHeight: image.height,
          filters,
          timestamp: Date.now(),
        })

        logger.debug('State auto-saved to cache', {
          action: 'CACHE_AUTO_SAVE',
        })
      } catch (err) {
        logger.error('Failed to auto-save cache', {
          action: 'CACHE_AUTO_SAVE_ERROR',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }, 500) // Debounce: save 500ms after last change

    return () => clearTimeout(timeoutId)
  }, [roomId, currentImageUrl, image, filters, isRestoringCache])

  /**
   * Handle local image upload
   * - Sets image data locally
   * - Uploads to Supabase Storage
   * - Broadcasts to other users in the room
   */
  const handleImageLoad = async (imageData: ImageData, file: File) => {
    logger.info('Image uploaded', {
      action: 'IMAGE_UPLOAD',
      imageInfo: {
        width: imageData.width,
        height: imageData.height,
        size: imageData.data.length,
      },
    })
    setImage(imageData)
    setProcessedImage(imageData)

    // Analyze image with wasmCloud service
    try {
      setIsAnalyzingImage(true)
      const metadata = await analyzeImage(file)
      setImageMetadata(metadata)
      logger.info('Image analyzed successfully', {
        action: 'IMAGE_ANALYSIS',
        metadata,
      })
    } catch (err) {
      logger.error('Failed to analyze image', {
        action: 'IMAGE_ANALYSIS_ERROR',
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsAnalyzingImage(false)
    }

    // Upload to Supabase Storage and broadcast to room
    try {
      setIsUploadingImage(true)
      const url = await uploadImage(file, roomId)
      setCurrentImageUrl(url) // Save URL for caching
      broadcastImage(url, imageData.width, imageData.height)
      logger.info('Image uploaded to storage and broadcasted', {
        action: 'IMAGE_BROADCAST',
        url,
      })
    } catch (err) {
      logger.error('Failed to upload image', {
        action: 'IMAGE_UPLOAD_ERROR',
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  /**
   * Sync shared image from other users
   * Downloads image from Supabase Storage URL and displays it
   */
  useEffect(() => {
    if (!sharedImage) return

    logger.info('Received shared image', {
      action: 'SHARED_IMAGE_RECEIVED',
      uploadedBy: sharedImage.uploadedBy,
      url: sharedImage.url,
    })

    downloadImageAsImageData(sharedImage.url)
      .then((imageData) => {
        setImage(imageData)
        setProcessedImage(imageData)
        setCurrentImageUrl(sharedImage.url) // Save URL for caching
        logger.info('Shared image loaded successfully', {
          action: 'SHARED_IMAGE_LOADED',
        })
      })
      .catch((err) => {
        logger.error('Failed to load shared image', {
          action: 'SHARED_IMAGE_ERROR',
          error: err instanceof Error ? err.message : String(err),
        })
      })
  }, [sharedImage])

  /**
   * Sync shared filters from other users
   * IMPORTANT: Does NOT broadcast to avoid infinite loop
   * Only manual changes trigger broadcasts
   */
  useEffect(() => {
    if (!sharedFilters) return

    logger.info('Received shared filters', {
      action: 'SHARED_FILTERS_RECEIVED',
      filters: sharedFilters,
    })

    setFilters(sharedFilters)
  }, [sharedFilters])

  // Handle mouse move for cursor broadcasting
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasContainerRef.current) return

    const rect = canvasContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    broadcastCursor(x, y)
  }

  // Copy room URL to clipboard
  const handleCopyRoomUrl = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    logger.info('Room URL copied to clipboard', { action: 'COPY_ROOM_URL', url })

    // Show feedback for 2 seconds
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filter Pipeline: Apply multiple filters in sequence
  useEffect(() => {
    if (!image || !wasmModule) return

    const start = performance.now()

    try {
      // Start with original image data
      let current = new Uint8Array(image.data.buffer)
      let currentWidth = image.width
      let currentHeight = image.height

      // Apply filters in pipeline order
      if (filters.grayscale) {
        logger.debug('Applying grayscale filter', { action: 'FILTER_PIPELINE' })
        current = new Uint8Array(wasmModule.apply_grayscale(current, currentWidth, currentHeight))
      }

      if (filters.brightness !== 0) {
        logger.debug('Applying brightness filter', { action: 'FILTER_PIPELINE', adjustment: filters.brightness })
        current = new Uint8Array(wasmModule.apply_brightness(current, currentWidth, currentHeight, filters.brightness))
      }

      if (filters.flipHorizontal) {
        logger.debug('Applying horizontal flip', { action: 'FILTER_PIPELINE' })
        current = new Uint8Array(wasmModule.apply_flip_horizontal(current, currentWidth, currentHeight))
      }

      if (filters.flipVertical) {
        logger.debug('Applying vertical flip', { action: 'FILTER_PIPELINE' })
        current = new Uint8Array(wasmModule.apply_flip_vertical(current, currentWidth, currentHeight))
      }

      // Rotation (may change image dimensions)
      if (filters.rotation !== 0) {
        logger.debug('Applying rotation', { action: 'FILTER_PIPELINE', angle: filters.rotation })
        if (filters.rotation === 90) {
          current = new Uint8Array(wasmModule.apply_rotate_90_cw(current, currentWidth, currentHeight))
          // Swap dimensions for 90° rotation
          ;[currentWidth, currentHeight] = [currentHeight, currentWidth]
        } else if (filters.rotation === 180) {
          current = new Uint8Array(wasmModule.apply_rotate_180(current, currentWidth, currentHeight))
          // Dimensions stay the same
        } else if (filters.rotation === 270) {
          current = new Uint8Array(wasmModule.apply_rotate_270_cw(current, currentWidth, currentHeight))
          // Swap dimensions for 270° rotation
          ;[currentWidth, currentHeight] = [currentHeight, currentWidth]
        }
      }

      if (filters.blur > 0) {
        logger.debug('Applying blur filter', { action: 'FILTER_PIPELINE', radius: filters.blur })
        current = new Uint8Array(wasmModule.apply_blur(current, currentWidth, currentHeight, filters.blur))
      }

      // Crop (applied last, as it changes image dimensions)
      if (filters.cropArea) {
        logger.debug('Applying crop', { action: 'FILTER_PIPELINE', cropArea: filters.cropArea })
        const { x, y, width, height } = filters.cropArea
        current = new Uint8Array(wasmModule.apply_crop(current, currentWidth, currentHeight, x, y, width, height))
        currentWidth = width
        currentHeight = height
      }

      const elapsed = performance.now() - start
      logger.info('Filter pipeline completed', {
        action: 'FILTER_PIPELINE_COMPLETE',
        filters,
        duration: elapsed,
      })

      // Create new ImageData from pipeline result (with potentially updated dimensions)
      const newImageData = new ImageData(
        new Uint8ClampedArray(current),
        currentWidth,
        currentHeight
      )

      setProcessedImage(newImageData)
    } catch (err) {
      logger.error('Filter pipeline failed', {
        action: 'FILTER_PIPELINE_ERROR',
        filters,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }, [image, wasmModule, filters])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="PixLab Logo" className="h-24 w-24 animate-pulse" />
          <div className="text-white text-xl">WASMモジュールを読み込み中... 🔄</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="PixLab Logo" className="h-24 w-24 opacity-50" />
          <div className="text-red-500 text-xl">WASMの読み込みエラー: {error.message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-primary text-white flex flex-col">
      <header className="bg-primary-light border-b border-[#333333] p-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="PixLab Logo" className="h-12 w-12" />
            <h1 className="text-3xl font-bold">
              <span className="text-accent">PixLab</span>
              <span className="text-sm text-gray-400 ml-3">WebAssembly画像エディタ</span>
            </h1>
          </div>

          {/* Collaboration Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#333333] rounded-lg">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}
                title={isConnected ? '接続中' : '切断'}
              />
              <span className="text-sm text-gray-300">
                {isConnected ? 'オンライン' : 'オフライン'}
              </span>
              {otherCursors.size > 0 && (
                <span className="text-sm text-accent ml-2">
                  +{otherCursors.size} 人
                </span>
              )}
            </div>

            <button
              onClick={handleCopyRoomUrl}
              className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                copied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-accent/20 hover:bg-accent/30 text-accent'
              }`}
              title={copied ? 'URLをコピーしました！' : '共有URLをコピー'}
            >
              {copied ? '✓ コピー完了！' : '🔗 共有'}
            </button>

            <div className="text-xs text-gray-500">
              Room: {roomId.slice(0, 6)}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Controls */}
        <div className="w-80 bg-primary-light border-r border-[#333333] p-4 overflow-y-auto flex-shrink-0">
          {isUploadingImage && (
            <div className="mb-4 bg-blue-500/20 border border-blue-500 rounded-lg p-3 text-sm text-blue-300">
              画像をアップロード中... 📤
            </div>
          )}
          {isAnalyzingImage && (
            <div className="mb-4 bg-purple-500/20 border border-purple-500 rounded-lg p-3 text-sm text-purple-300">
              画像を解析中... 🔍
            </div>
          )}
          <ImageUploader onImageLoad={handleImageLoad} />

          {/* Image Metadata Display */}
          {imageMetadata && (
            <div className="mt-4 bg-primary-light rounded-lg p-4 border border-[#333333]">
              <h3 className="text-lg font-semibold mb-3 text-accent">画像情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">フォーマット:</span>
                  <span className="font-medium text-white uppercase">{imageMetadata.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">サイズ:</span>
                  <span className="font-medium text-white">
                    {imageMetadata.width && imageMetadata.height
                      ? `${imageMetadata.width} × ${imageMetadata.height}px`
                      : '不明'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ファイルサイズ:</span>
                  <span className="font-medium text-white">
                    {(imageMetadata.size_bytes / 1024).toFixed(2)} KB
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#333333]">
                <p className="text-xs text-gray-500 italic">
                  wasmCloud 🌩️ で解析
                </p>
              </div>
            </div>
          )}

          {image && (
            <FilterControls
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters)
                broadcastFilters(newFilters) // Broadcast manual changes only
              }}
              disabled={!wasmModule}
              imageData={processedImage}
              onCropModeChange={setCropMode}
            />
          )}
        </div>

        {/* Main Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 p-6 overflow-hidden relative"
          onMouseMove={handleMouseMove}
        >
          <ImageCanvas
            originalImage={image}
            processedImage={processedImage}
            cropMode={cropMode}
            onCropChange={(cropArea) => {
              const newFilters = { ...filters, cropArea }
              setFilters(newFilters)
              broadcastFilters(newFilters) // Broadcast crop changes
            }}
            onCropComplete={() => setCropMode(false)}
            onCropCancel={() => setCropMode(false)}
          />

          {/* Collaborative Cursors Overlay (Canvas-based for 60fps performance) */}
          <CollaborativeCursorsCanvas
            cursors={otherCursors}
            containerRef={canvasContainerRef}
          />
        </div>
      </main>

      <footer className="bg-primary-light border-t border-[#333333] p-2 text-center text-sm text-gray-400 flex-shrink-0">
        <p><span className="text-accent">Rust 🦀</span> + WebAssembly ⚡ + React ⚛️ で構築</p>
      </footer>
    </div>
  )
}

export default App
