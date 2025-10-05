import { useState, useEffect } from 'react'
import { ImageUploader } from './components/ImageUploader'
import { FilterControls } from './components/FilterControls'
import { ImageCanvas } from './components/ImageCanvas'
import { useWasm } from './wasm/useWasm'
import logger from './utils/logger'

function App() {
  const { wasmModule, isLoading, error } = useWasm()
  const [image, setImage] = useState<ImageData | null>(null)
  const [processedImage, setProcessedImage] = useState<ImageData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

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

  const handleFilterApply = async (filterType: string, params?: any) => {
    if (!image || !wasmModule) return

    // Skip if already processing (prevent queue buildup)
    if (isProcessing) {
      logger.debug('Filter skipped (already processing)', { filterType })
      return
    }

    setIsProcessing(true)

    logger.info('Filter apply started', {
      action: 'FILTER_APPLY',
      filterType,
      params,
      imageInfo: {
        width: image.width,
        height: image.height,
        size: image.data.length,
      },
    })

    const start = performance.now()

    try {
      // Direct access to image data (avoid unnecessary copy)
      // ImageData.data is already a Uint8ClampedArray
      const rawPixels = image.data

      let result: Uint8Array

      switch (filterType) {
        case 'grayscale':
          result = wasmModule.apply_grayscale(rawPixels, image.width, image.height)
          break
        case 'blur':
          result = wasmModule.apply_blur(rawPixels, image.width, image.height, params?.radius || 5)
          break
        default:
          logger.warn('Unknown filter type', { filterType })
          setIsProcessing(false)
          return
      }

      const elapsed = performance.now() - start
      logger.info('Filter applied successfully', {
        action: 'FILTER_COMPLETE',
        filterType,
        duration: elapsed,
      })

      // Create new ImageData from result
      const newImageData = new ImageData(
        new Uint8ClampedArray(result),
        image.width,
        image.height
      )

      setProcessedImage(newImageData)
    } catch (err) {
      logger.error('Filter apply failed', {
        action: 'FILTER_ERROR',
        filterType,
        params,
        error: err instanceof Error ? err.message : String(err),
        imageInfo: {
          width: image.width,
          height: image.height,
          size: image.data.length,
        },
      })
    } finally {
      setIsProcessing(false)
    }
  }

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
              onFilterApply={handleFilterApply}
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
