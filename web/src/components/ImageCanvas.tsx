import { useEffect, useRef } from 'react'

interface ImageCanvasProps {
  originalImage: ImageData | null
  processedImage: ImageData | null
}

export function ImageCanvas({ originalImage, processedImage }: ImageCanvasProps) {
  const originalCanvasRef = useRef<HTMLCanvasElement>(null)
  const processedCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!originalImage || !originalCanvasRef.current) return

    const canvas = originalCanvasRef.current
    canvas.width = originalImage.width
    canvas.height = originalImage.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.putImageData(originalImage, 0, 0)
  }, [originalImage])

  useEffect(() => {
    if (!processedImage || !processedCanvasRef.current) return

    const canvas = processedCanvasRef.current
    canvas.width = processedImage.width
    canvas.height = processedImage.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.putImageData(processedImage, 0, 0)
  }, [processedImage])

  if (!originalImage) {
    return (
      <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 flex items-center justify-center min-h-96">
        <p className="text-gray-400 text-lg">No image loaded. Upload an image to start editing.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Original */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold mb-3">Original</h3>
        <div className="bg-gray-700 rounded p-2 flex justify-center">
          <canvas
            ref={originalCanvasRef}
            className="max-w-full h-auto rounded"
          />
        </div>
      </div>

      {/* Processed */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold mb-3">Processed (WASM)</h3>
        <div className="bg-gray-700 rounded p-2 flex justify-center">
          <canvas
            ref={processedCanvasRef}
            className="max-w-full h-auto rounded"
          />
        </div>
      </div>
    </div>
  )
}
