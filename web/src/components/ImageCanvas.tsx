import { useEffect, useRef, useState } from 'react'
import { ExportModal, type ExportFormat, type ExportScale } from './ExportModal'
import { CropOverlay } from './CropOverlay'
import { exportImage } from '../utils/exportImage'
import { type CropArea } from '../types/filters'

interface ImageCanvasProps {
  originalImage: ImageData | null
  processedImage: ImageData | null
  cropMode?: boolean
  onCropChange?: (cropArea: CropArea) => void
  onCropComplete?: () => void
  onCropCancel?: () => void
}

export function ImageCanvas({
  originalImage,
  processedImage,
  cropMode = false,
  onCropChange,
  onCropComplete,
  onCropCancel,
}: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showingOriginal, setShowingOriginal] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

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

  const handleExport = async (format: ExportFormat, scale: ExportScale, quality?: number) => {
    if (!processedImage) return

    try {
      await exportImage(processedImage, { format, scale, quality })
    } catch (error) {
      console.error('Export failed:', error)
      // TODO: Show error toast/notification
    }
  }

  if (!originalImage) {
    return (
      <div className="bg-primary-light rounded-lg p-12 border border-[#333333] flex items-center justify-center min-h-96">
        <p className="text-gray-400 text-lg">画像がアップロードされていません。画像を選択して編集を開始してください。</p>
      </div>
    )
  }

  return (
    <div className="bg-primary-light rounded-lg p-4 border border-[#333333] h-full flex flex-col">
      {/* Header with Compare and Export buttons */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {showingOriginal ? 'オリジナル' : <span className="text-accent">処理済み</span>}
        </h3>

        <div className="flex gap-2">
          <button
            onMouseDown={handleCompareStart}
            onMouseUp={handleCompareEnd}
            onMouseLeave={handleCompareEnd}
            onTouchStart={handleCompareStart}
            onTouchEnd={handleCompareEnd}
            className="px-4 py-2 bg-[#333333] hover:bg-[#444444] rounded-lg transition-colors flex items-center gap-2 select-none"
          >
            <span>👁️</span>
            <span>比較</span>
            <span className="text-xs text-gray-400">(押し続ける / Space)</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-primary font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <span>⬇️</span>
            <span>エクスポート</span>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="bg-[#333333] rounded p-4 flex items-center justify-center flex-1 min-h-0 relative"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full h-auto rounded"
        />

        {/* Crop Overlay */}
        {cropMode && canvasRef.current && processedImage && onCropChange && onCropComplete && onCropCancel && (
          <CropOverlay
            canvasElement={canvasRef.current}
            imageData={processedImage}
            onCropChange={onCropChange}
            onComplete={onCropComplete}
            onCancel={onCropCancel}
          />
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        imageData={processedImage}
        onExport={handleExport}
      />
    </div>
  )
}
