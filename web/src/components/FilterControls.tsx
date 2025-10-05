import { useEffect, useRef } from 'react'

interface FilterState {
  grayscale: boolean
  blur: number
  brightness: number
}

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

  return (
    <div className="bg-primary-light rounded-lg p-6 border border-[#333333] mt-4">
      <h2 className="text-xl font-semibold mb-4">Filters</h2>

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
      </div>
    </div>
  )
}
