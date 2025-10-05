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
      const rawPixels = new Uint8Array(image.data)

      let result: Uint8Array

      switch (filterType) {
        case 'grayscale':
          result = wasmModule.apply_grayscale(rawPixels)
          break
        case 'blur':
          result = wasmModule.apply_blur(rawPixels, params?.radius || 5)
          break
        default:
          logger.warn('Unknown filter type', { filterType })
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
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading WASM module... 🔄</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">Error loading WASM: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-3xl font-bold">
          🎨 PixLab
          <span className="text-sm text-gray-400 ml-3">WebAssembly Image Editor</span>
        </h1>
      </header>

      <main className="container mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <ImageUploader onImageLoad={handleImageLoad} />

            {image && (
              <FilterControls
                onFilterApply={handleFilterApply}
                disabled={!wasmModule}
              />
            )}
          </div>

          {/* Canvas Section */}
          <div className="lg:col-span-2">
            <ImageCanvas
              originalImage={image}
              processedImage={processedImage}
            />
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-gray-800 border-t border-gray-700 p-2 text-center text-sm text-gray-400">
        <p>Built with Rust 🦀 + WebAssembly ⚡ + React ⚛️</p>
      </footer>
    </div>
  )
}

export default App
