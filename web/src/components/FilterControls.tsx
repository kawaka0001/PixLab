import { useEffect, useRef } from 'react'
import { type FilterState, type RotationAngle, initialFilterState } from '../types/filters'

interface FilterControlsProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  disabled?: boolean
}

export function FilterControls({ filters, onFiltersChange, disabled }: FilterControlsProps) {
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

  const hasActiveFilters = filters.grayscale || filters.blur > 0 || filters.brightness !== 0 || filters.flipHorizontal || filters.flipVertical || filters.rotation !== 0

  // Handle rotation: increment by 90° (0 -> 90 -> 180 -> 270 -> 0)
  const handleRotate = () => {
    const nextRotation = ((filters.rotation + 90) % 360) as RotationAngle
    onFiltersChange({ ...filters, rotation: nextRotation })
  }

  return (
    <div className="bg-primary-light rounded-lg p-6 border border-[#333333] mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            disabled={disabled}
            className="text-xs text-accent hover:text-accent-dark disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            Reset All
          </button>
        )}
      </div>

      <div className="space-y-4">
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
          Grayscale {filters.grayscale && '✓'}
        </button>

        {/* Blur with Real-time Preview */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Blur Radius: {filters.blur.toFixed(1)}
            <span className="ml-2 text-xs text-gray-500">(Real-time ⚡)</span>
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
            Brightness: {filters.brightness > 0 ? '+' : ''}{filters.brightness.toFixed(0)}
            <span className="ml-2 text-xs text-gray-500">(Real-time ⚡)</span>
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
            <span>Darker</span>
            <span>Normal</span>
            <span>Brighter</span>
          </div>
        </div>

        {/* Flip Horizontal */}
        <button
          onClick={() => onFiltersChange({ ...filters, flipHorizontal: !filters.flipHorizontal })}
          disabled={disabled}
          className={`w-full font-medium py-2 px-4 rounded-lg transition-colors shadow-lg ${
            filters.flipHorizontal
              ? 'bg-accent-dark text-white'
              : 'bg-accent hover:bg-accent-dark disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-white hover:shadow-accent/50'
          }`}
        >
          ↔️ Flip Horizontal {filters.flipHorizontal && '✓'}
        </button>

        {/* Flip Vertical */}
        <button
          onClick={() => onFiltersChange({ ...filters, flipVertical: !filters.flipVertical })}
          disabled={disabled}
          className={`w-full font-medium py-2 px-4 rounded-lg transition-colors shadow-lg ${
            filters.flipVertical
              ? 'bg-accent-dark text-white'
              : 'bg-accent hover:bg-accent-dark disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-white hover:shadow-accent/50'
          }`}
        >
          ↕️ Flip Vertical {filters.flipVertical && '✓'}
        </button>

        {/* Rotation */}
        <button
          onClick={handleRotate}
          disabled={disabled}
          className={`w-full font-medium py-2 px-4 rounded-lg transition-colors shadow-lg ${
            filters.rotation !== 0
              ? 'bg-accent-dark text-white'
              : 'bg-accent hover:bg-accent-dark disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-white hover:shadow-accent/50'
          }`}
        >
          🔄 Rotate {filters.rotation !== 0 && `${filters.rotation}°`}
        </button>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-[#333333]">
            <div className="text-xs text-gray-400 mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-2">
              {filters.grayscale && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  Grayscale
                </span>
              )}
              {filters.blur > 0 && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  Blur ({filters.blur.toFixed(1)})
                </span>
              )}
              {filters.brightness !== 0 && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  Brightness ({filters.brightness > 0 ? '+' : ''}{filters.brightness})
                </span>
              )}
              {filters.flipHorizontal && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  ↔️ Flip H
                </span>
              )}
              {filters.flipVertical && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  ↕️ Flip V
                </span>
              )}
              {filters.rotation !== 0 && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                  🔄 Rotate {filters.rotation}°
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
