import { useState } from 'react'

interface FilterControlsProps {
  onFilterApply: (filterType: string, params?: any) => void
  disabled?: boolean
}

export function FilterControls({ onFilterApply, disabled }: FilterControlsProps) {
  const [blurRadius, setBlurRadius] = useState(5)

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mt-4">
      <h2 className="text-xl font-semibold mb-4">Filters</h2>

      <div className="space-y-4">
        {/* Grayscale */}
        <button
          onClick={() => onFilterApply('grayscale')}
          disabled={disabled}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Grayscale
        </button>

        {/* Blur */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Blur Radius: {blurRadius}
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={blurRadius}
            onChange={(e) => setBlurRadius(Number(e.target.value))}
            className="w-full"
            disabled={disabled}
          />
          <button
            onClick={() => onFilterApply('blur', { radius: blurRadius })}
            disabled={disabled}
            className="w-full mt-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Apply Blur
          </button>
        </div>
      </div>
    </div>
  )
}
