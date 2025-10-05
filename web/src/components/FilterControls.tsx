import { useEffect, useRef } from 'react'
import { type FilterState, type RotationAngle, initialFilterState } from '../types/filters'

interface FilterControlsProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  disabled?: boolean
  imageData?: ImageData | null
  onCropModeChange?: (cropMode: boolean) => void
}

export function FilterControls({ filters, onFiltersChange, disabled, imageData, onCropModeChange }: FilterControlsProps) {
  const debounceRef = useRef<number | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Debounced filter updates (150ms)
  const updateFilter = (key: keyof FilterState, value: number | boolean) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      onFiltersChange({ ...filters, [key]: value })
    }, 150)
  }

  const handleReset = () => {
    onFiltersChange(initialFilterState)
  }

  const hasActiveFilters = filters.grayscale || filters.blur > 0 || filters.brightness !== 0 || filters.flipHorizontal || filters.flipVertical || filters.rotation !== 0 || filters.cropArea !== null

  // Handle rotation: increment by 90° (0 -> 90 -> 180 -> 270 -> 0)
  const handleRotate = () => {
    const nextRotation = ((filters.rotation + 90) % 360) as RotationAngle
    onFiltersChange({ ...filters, rotation: nextRotation })
  }

  const handleOpenCropTool = () => {
    onCropModeChange?.(true)
  }

  return (
    <div className="bg-primary-light rounded-lg p-6 border border-[#333333] mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">フィルター</h2>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            disabled={disabled}
            className="text-xs text-accent hover:text-accent-dark disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            すべてリセット
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Crop Tool Button */}
        <button
          onClick={handleOpenCropTool}
          disabled={disabled || !imageData}
          className={`w-full font-medium py-2 px-4 rounded-lg transition-colors shadow-lg ${
            filters.cropArea
              ? 'bg-accent-dark text-white'
              : 'bg-accent hover:bg-accent-dark disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-white hover:shadow-accent/50'
          }`}
        >
          ✂️ トリミング {filters.cropArea && '✓'}
        </button>
        {/* Grayscale */}
        <button
          onClick={() => onFiltersChange({ ...filters, grayscale: !filters.grayscale })}
          disabled={disabled}
          className={`w-full font-medium py-2 px-4 rounded-lg transition-colors shadow-lg ${
            filters.grayscale
              ? 'bg-accent-dark text-white'
              : 'bg-accent hover:bg-accent-dark disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-white hover:shadow-accent/50'
          }`}
        >
          グレースケール {filters.grayscale && '✓'}
        </button>

        {/* Blur with Real-time Preview */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            ぼかし半径: {filters.blur.toFixed(1)}
            <span className="ml-2 text-xs text-gray-500">(リアルタイム ⚡)</span>
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={filters.blur}
            onChange={(e) => updateFilter('blur', Number(e.target.value))}
            className="w-full accent-accent"
            disabled={disabled}
          />
        </div>

        {/* Brightness with Real-time Preview */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            明るさ: {filters.brightness > 0 ? '+' : ''}{filters.brightness.toFixed(0)}
            <span className="ml-2 text-xs text-gray-500">(リアルタイム ⚡)</span>
          </label>
          <input
            type="range"
            min="-255"
            max="255"
            step="5"
            value={filters.brightness}
            onChange={(e) => updateFilter('brightness', Number(e.target.value))}
            className="w-full accent-accent"
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>暗く</span>
            <span>通常</span>
            <span>明るく</span>
          </div>
        </div>

        {/* Transform Tools (Compact Icon Buttons) */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">変形ツール</label>
          <div className="flex gap-2">
            {/* Flip Horizontal */}
            <button
              onClick={() => onFiltersChange({ ...filters, flipHorizontal: !filters.flipHorizontal })}
              disabled={disabled}
              title="左右反転"
              className={`flex-1 p-3 rounded-lg transition-all text-2xl disabled:cursor-not-allowed disabled:opacity-50 ${
                filters.flipHorizontal
                  ? 'bg-accent text-white shadow-lg shadow-accent/30'
                  : 'bg-[#3A3A3A] text-gray-400 hover:bg-accent/20 hover:text-accent hover:shadow-md'
              }`}
            >
              ↔️
            </button>

            {/* Flip Vertical */}
            <button
              onClick={() => onFiltersChange({ ...filters, flipVertical: !filters.flipVertical })}
              disabled={disabled}
              title="上下反転"
              className={`flex-1 p-3 rounded-lg transition-all text-2xl disabled:cursor-not-allowed disabled:opacity-50 ${
                filters.flipVertical
                  ? 'bg-accent text-white shadow-lg shadow-accent/30'
                  : 'bg-[#3A3A3A] text-gray-400 hover:bg-accent/20 hover:text-accent hover:shadow-md'
              }`}
            >
              ↕️
            </button>

            {/* Rotate */}
            <button
              onClick={handleRotate}
              disabled={disabled}
              title={`90°回転 ${filters.rotation !== 0 ? `(現在: ${filters.rotation}°)` : ''}`}
              className={`flex-1 p-3 rounded-lg transition-all text-lg font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                filters.rotation !== 0
                  ? 'bg-accent text-white shadow-lg shadow-accent/30'
                  : 'bg-[#3A3A3A] text-gray-400 hover:bg-accent/20 hover:text-accent hover:shadow-md'
              }`}
            >
              🔄{filters.rotation !== 0 && ` ${filters.rotation}°`}
            </button>
          </div>
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-[#333333]">
            <div className="text-xs text-gray-400 mb-2">適用中のフィルター:</div>
            <div className="flex flex-wrap gap-2">
              {filters.grayscale && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  グレースケール
                </span>
              )}
              {filters.blur > 0 && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  ぼかし ({filters.blur.toFixed(1)})
                </span>
              )}
              {filters.brightness !== 0 && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  明るさ ({filters.brightness > 0 ? '+' : ''}{filters.brightness})
                </span>
              )}
              {filters.flipHorizontal && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  ↔️ 左右反転
                </span>
              )}
              {filters.flipVertical && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  ↕️ 上下反転
                </span>
              )}
              {filters.rotation !== 0 && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  🔄 {filters.rotation}°
                </span>
              )}
              {filters.cropArea && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  ✂️ トリミング ({filters.cropArea.width}x{filters.cropArea.height})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
