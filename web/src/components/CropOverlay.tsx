import { useState, useEffect, useRef } from 'react'
import { type CropArea } from '../types/filters'

interface CropOverlayProps {
  canvasElement: HTMLCanvasElement
  imageData: ImageData
  onCropChange: (cropArea: CropArea) => void
  onComplete: () => void
  onCancel: () => void
}

export function CropOverlay({ canvasElement, imageData, onCropChange, onComplete, onCancel }: CropOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: imageData.width,
    height: imageData.height,
  })

  // Convert canvas display coordinates to image data coordinates
  const canvasToImageCoords = (canvasX: number, canvasY: number) => {
    const rect = canvasElement.getBoundingClientRect()
    const scaleX = imageData.width / rect.width
    const scaleY = imageData.height / rect.height

    return {
      x: Math.round(canvasX * scaleX),
      y: Math.round(canvasY * scaleY),
    }
  }

  // Convert image data coordinates to canvas display coordinates
  const imageToCanvasCoords = (imageX: number, imageY: number) => {
    const rect = canvasElement.getBoundingClientRect()
    const scaleX = rect.width / imageData.width
    const scaleY = rect.height / imageData.height

    return {
      x: imageX * scaleX,
      y: imageY * scaleY,
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== overlayRef.current) return // Only start drag on overlay background

    const rect = canvasElement.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDragging(true)
    setDragStart({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return

    const rect = canvasElement.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    // Calculate selection in canvas coordinates
    const canvasSelection = {
      x: Math.min(dragStart.x, currentX),
      y: Math.min(dragStart.y, currentY),
      width: Math.abs(currentX - dragStart.x),
      height: Math.abs(currentY - dragStart.y),
    }

    // Clamp to canvas bounds
    canvasSelection.x = Math.max(0, Math.min(canvasSelection.x, rect.width))
    canvasSelection.y = Math.max(0, Math.min(canvasSelection.y, rect.height))
    canvasSelection.width = Math.min(canvasSelection.width, rect.width - canvasSelection.x)
    canvasSelection.height = Math.min(canvasSelection.height, rect.height - canvasSelection.y)

    // Convert to image data coordinates
    const topLeft = canvasToImageCoords(canvasSelection.x, canvasSelection.y)
    const bottomRight = canvasToImageCoords(
      canvasSelection.x + canvasSelection.width,
      canvasSelection.y + canvasSelection.height
    )

    const imageSelection = {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }

    // Clamp to image bounds
    imageSelection.x = Math.max(0, Math.min(imageSelection.x, imageData.width))
    imageSelection.y = Math.max(0, Math.min(imageSelection.y, imageData.height))
    imageSelection.width = Math.min(imageSelection.width, imageData.width - imageSelection.x)
    imageSelection.height = Math.min(imageSelection.height, imageData.height - imageSelection.y)

    setSelection(imageSelection)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  const handleApply = () => {
    if (selection.width > 0 && selection.height > 0) {
      onCropChange(selection)
    }
    onComplete()
  }

  const handleReset = () => {
    setSelection({
      x: 0,
      y: 0,
      width: imageData.width,
      height: imageData.height,
    })
  }

  // Calculate display coordinates for the selection box
  const displayCoords = imageToCanvasCoords(selection.x, selection.y)
  const displaySize = {
    width: (selection.width / imageData.width) * canvasElement.getBoundingClientRect().width,
    height: (selection.height / imageData.height) * canvasElement.getBoundingClientRect().height,
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleApply()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selection])

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
            linear-gradient(transparent ${displayCoords.y}px, transparent ${displayCoords.y}px),
            linear-gradient(90deg, transparent ${displayCoords.x}px, transparent ${displayCoords.x}px)
          `,
        }}
      >
        {/* Selection box */}
        <div
          className="absolute border-2 border-accent pointer-events-none"
          style={{
            left: `${displayCoords.x}px`,
            top: `${displayCoords.y}px`,
            width: `${displaySize.width}px`,
            height: `${displaySize.height}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Corner handles */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-accent rounded-full" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-accent rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent rounded-full" />
        </div>
      </div>

      {/* Control panel */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary-light rounded-lg p-4 border border-accent shadow-xl z-10">
        <div className="flex items-center gap-4">
          {/* Selection info */}
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-400">位置:</span>{' '}
              <span className="text-white font-mono">{selection.x}, {selection.y}</span>
            </div>
            <div>
              <span className="text-gray-400">サイズ:</span>{' '}
              <span className="text-white font-mono">{selection.width} × {selection.height}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-gray-300 rounded text-sm transition-colors"
            >
              全体選択
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-gray-300 rounded text-sm transition-colors"
            >
              キャンセル (Esc)
            </button>
            <button
              onClick={handleApply}
              disabled={selection.width === 0 || selection.height === 0}
              className="px-4 py-1.5 bg-accent hover:bg-accent-dark text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              適用 (Enter)
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
