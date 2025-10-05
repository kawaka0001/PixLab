import { useRef, ChangeEvent } from 'react'

interface ImageUploaderProps {
  onImageLoad: (imageData: ImageData) => void
}

export function ImageUploader({ onImageLoad }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        canvas.width = img.width
        canvas.height = img.height

        // Enable willReadFrequently for better performance with getImageData
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        onImageLoad(imageData)
      }

      img.src = event.target?.result as string
    }

    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-primary-light rounded-lg p-6 border border-[#333333]">
      <h2 className="text-xl font-semibold mb-4">画像をアップロード</h2>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full bg-accent hover:bg-accent-dark text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg hover:shadow-accent/50"
      >
        画像を選択
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden canvas for image loading */}
      <canvas ref={canvasRef} className="hidden" />

      <p className="mt-4 text-sm text-gray-400">
        対応形式: PNG, JPEG, GIF, WebP
      </p>
    </div>
  )
}
