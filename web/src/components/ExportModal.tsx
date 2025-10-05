import { useState, useEffect } from 'react'

export type ExportFormat = 'png' | 'jpg' | 'webp'
export type ExportScale = 0.5 | 0.75 | 1 | 2 | 3

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  imageData: ImageData | null
  onExport: (format: ExportFormat, scale: ExportScale, quality?: number) => void
}

export function ExportModal({ isOpen, onClose, imageData, onExport }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState<ExportScale>(1)
  const [quality, setQuality] = useState(0.9)

  // Generate filename preview
  const getFilename = () => {
    const timestamp = new Date().toISOString().slice(0, 10)
    const scaleSuffix = scale !== 1 ? `@${scale}x` : ''
    return `pixlab-export-${timestamp}${scaleSuffix}.${format}`
  }

  // Estimate file size (rough approximation)
  const getEstimatedSize = () => {
    if (!imageData) return 'N/A'

    const pixels = imageData.width * imageData.height * scale * scale
    let bytes: number

    switch (format) {
      case 'png':
        bytes = pixels * 4 // RGBA, uncompressed estimate
        break
      case 'jpg':
        bytes = pixels * quality * 0.5 // Rough JPEG compression estimate
        break
      case 'webp':
        bytes = pixels * quality * 0.3 // WebP is more efficient
        break
      default:
        bytes = 0
    }

    if (bytes < 1024) return `${bytes.toFixed(0)} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleExport = () => {
    onExport(format, scale, format === 'jpg' ? quality : undefined)
    onClose()
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-light border border-[#333333] rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333333]">
          <h2 className="text-xl font-semibold">画像をエクスポート</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">フォーマット</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-full bg-[#333333] border border-[#444444] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="png">PNG (無劣化、透過対応)</option>
              <option value="jpg">JPG (ファイルサイズ小)</option>
              <option value="webp">WebP (高圧縮)</option>
            </select>
          </div>

          {/* Scale Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">スケール</label>
            <div className="grid grid-cols-3 gap-2">
              {([0.5, 0.75, 1, 2, 3] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`py-2 px-3 rounded-lg border transition-colors text-sm ${
                    scale === s
                      ? 'bg-accent border-accent text-primary font-semibold'
                      : 'bg-[#333333] border-[#444444] text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {imageData && (
                <>出力: {Math.round(imageData.width * scale)} × {Math.round(imageData.height * scale)}px</>
              )}
            </p>
          </div>

          {/* Quality Slider (JPG/WebP only) */}
          {(format === 'jpg' || format === 'webp') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                品質: {(quality * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>ファイルサイズ小</span>
                <span>品質優先</span>
              </div>
            </div>
          )}

          {/* Filename Preview */}
          <div className="bg-[#333333] rounded-lg p-4 border border-[#444444]">
            <div className="text-sm text-gray-400 mb-1">ファイル名</div>
            <div className="font-mono text-sm text-accent">{getFilename()}</div>
            <div className="text-xs text-gray-400 mt-2">
              予想サイズ: <span className="text-white">{getEstimatedSize()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#333333]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#333333] hover:bg-[#444444] rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 bg-accent hover:bg-accent/90 text-primary font-semibold rounded-lg transition-colors"
          >
            ダウンロード
          </button>
        </div>
      </div>
    </div>
  )
}
