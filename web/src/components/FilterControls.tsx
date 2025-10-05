import { useState, useEffect, useRef } from 'react'

interface FilterControlsProps {
  onFilterApply: (filterType: string, params?: any) => void
  disabled?: boolean
}

export function FilterControls({ onFilterApply, disabled }: FilterControlsProps) {
  const [blurRadius, setBlurRadius] = useState(5)
  const debounceTimerRef = useRef<number | null>(null)

  // Debounced filter application (150ms) - best practice for smooth UX
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = window.setTimeout(() => {
      onFilterApply('blur', { radius: blurRadius })
    }, 150)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [blurRadius, onFilterApply])

  return (
    <div className="bg-primary-light rounded-lg p-6 border border-[#333333] mt-4">
      <h2 className="text-xl font-semibold mb-4">Filters</h2>

      <div className="space-y-4">
        {/* Grayscale */}
        <button
          onClick={() => onFilterApply('grayscale')}
          disabled={disabled}
          className="w-full bg-accent hover:bg-accent-dark disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-lg hover:shadow-accent/50"
        >
          Grayscale
        </button>

        {/* Blur with Real-time Preview */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Blur Radius: {blurRadius.toFixed(1)}
            <span className="ml-2 text-xs text-gray-500">(Real-time ⚡)</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="20"
            step="0.5"
            value={blurRadius}
            onChange={(e) => setBlurRadius(Number(e.target.value))}
            className="w-full accent-accent"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
