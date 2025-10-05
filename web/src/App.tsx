import { useState, useEffect } from 'react'
import { ImageUploader } from './components/ImageUploader'
import { FilterControls } from './components/FilterControls'
import { ImageCanvas } from './components/ImageCanvas'
import { useWasm } from './wasm/useWasm'
import logger from './utils/logger'
import { type FilterState, initialFilterState } from './types/filters'

function App() {
  const { wasmModule, isLoading, error } = useWasm()
  const [image, setImage] = useState<ImageData | null>(null)
  const [processedImage, setProcessedImage] = useState<ImageData | null>(null)
  const [filters, setFilters] = useState<FilterState>(initialFilterState)

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

  const handleImageLoad = (imageData: ImageData) => {
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
          <div className="text-white text-xl">Loading WASM module... 🔄</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="PixLab Logo" className="h-24 w-24 opacity-50" />
          <div className="text-red-500 text-xl">Error loading WASM: {error.message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-primary text-white flex flex-col">
      <header className="bg-primary-light border-b border-[#333333] p-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="PixLab Logo" className="h-12 w-12" />
          <h1 className="text-3xl font-bold">
            <span className="text-accent">PixLab</span>
            <span className="text-sm text-gray-400 ml-3">WebAssembly Image Editor</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Controls */}
        <div className="w-80 bg-primary-light border-r border-[#333333] p-4 overflow-y-auto flex-shrink-0">
          <ImageUploader onImageLoad={handleImageLoad} />

          {image && (
            <FilterControls
              filters={filters}
              onFiltersChange={setFilters}
              disabled={!wasmModule}
            />
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 p-6 overflow-hidden">
          <ImageCanvas
            originalImage={image}
            processedImage={processedImage}
          />
        </div>
      </main>

      <footer className="bg-primary-light border-t border-[#333333] p-2 text-center text-sm text-gray-400 flex-shrink-0">
        <p>Built with <span className="text-accent">Rust 🦀</span> + WebAssembly ⚡ + React ⚛️</p>
      </footer>
    </div>
  )
}

export default App
