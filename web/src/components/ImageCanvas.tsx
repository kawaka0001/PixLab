import { useEffect, useRef, useState } from 'react'

interface ImageCanvasProps {
  originalImage: ImageData | null
  processedImage: ImageData | null
}

export function ImageCanvas({ originalImage, processedImage }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showingOriginal, setShowingOriginal] = useState(false)

  // Update canvas when image changes or when toggling between original/processed
  useEffect(() => {
    const imageToDisplay = showingOriginal ? originalImage : processedImage
    if (!imageToDisplay || !canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = imageToDisplay.width
    canvas.height = imageToDisplay.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.putImageData(imageToDisplay, 0, 0)
  }, [originalImage, processedImage, showingOriginal])

  // Keyboard shortcut (Space key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && originalImage) {
        e.preventDefault()
        setShowingOriginal(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setShowingOriginal(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [originalImage])

  const handleCompareStart = () => {
    if (originalImage) {
      setShowingOriginal(true)
    }
  }

  const handleCompareEnd = () => {
    setShowingOriginal(false)
  }

  if (!originalImage) {
    return (
      <div className="bg-primary-light rounded-lg p-12 border border-[#333333] flex items-center justify-center min-h-96">
        <p className="text-gray-400 text-lg">No image loaded. Upload an image to start editing.</p>
      </div>
    )
  }

  return (
    <div className="bg-primary-light rounded-lg p-4 border border-[#333333] h-full flex flex-col">
      {/* Header with Compare button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {showingOriginal ? 'Original' : <span className="text-accent">Processed</span>}
        </h3>

        <button
          onMouseDown={handleCompareStart}
          onMouseUp={handleCompareEnd}
          onMouseLeave={handleCompareEnd}
          onTouchStart={handleCompareStart}
          onTouchEnd={handleCompareEnd}
          className="px-4 py-2 bg-[#333333] hover:bg-[#444444] rounded-lg transition-colors flex items-center gap-2 select-none"
        >
          <span>👁️</span>
          <span>Compare</span>
          <span className="text-xs text-gray-400">(Hold / Space)</span>
        </button>
      </div>

      {/* Canvas */}
      <div className="bg-[#333333] rounded p-4 flex items-center justify-center flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full h-auto rounded"
        />
      </div>
    </div>
  )
}
