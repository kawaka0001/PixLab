import type { ExportFormat, ExportScale } from '../components/ExportModal'
import logger from './logger'

interface ExportOptions {
  format: ExportFormat
  scale: ExportScale
  quality?: number // For JPG/WebP (0.1 - 1.0)
}

/**
 * Export ImageData to a downloadable file
 * Follows Figma-style export best practices
 */
export async function exportImage(
  imageData: ImageData,
  options: ExportOptions
): Promise<void> {
  const { format, scale, quality = 0.9 } = options

  logger.info('Starting image export', {
    action: 'EXPORT_START',
    format,
    scale,
    quality,
    imageSize: {
      width: imageData.width,
      height: imageData.height,
    },
  })

  try {
    // Create canvas with scaled dimensions
    const canvas = document.createElement('canvas')
    const scaledWidth = imageData.width * scale
    const scaledHeight = imageData.height * scale

    canvas.width = scaledWidth
    canvas.height = scaledHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Draw original image
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) {
      throw new Error('Failed to get temporary canvas context')
    }
    tempCtx.putImageData(imageData, 0, 0)

    // Scale up using high-quality smoothing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight)

    // Convert to blob with format-specific settings
    const mimeType = getMimeType(format)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        mimeType,
        format === 'png' ? undefined : quality
      )
    })

    // Generate filename
    const filename = generateFilename(format, scale)

    // Trigger download
    downloadBlob(blob, filename)

    logger.info('Export completed successfully', {
      action: 'EXPORT_COMPLETE',
      filename,
      fileSize: blob.size,
      format,
      scale,
    })
  } catch (error) {
    logger.error('Export failed', {
      action: 'EXPORT_ERROR',
      error: error instanceof Error ? error.message : String(error),
      format,
      scale,
    })
    throw error
  }
}

/**
 * Get MIME type for export format
 */
function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'png':
      return 'image/png'
    case 'jpg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    default:
      return 'image/png'
  }
}

/**
 * Generate filename with Figma-style naming convention
 * Format: pixlab-export-YYYY-MM-DD[@2x].ext
 */
function generateFilename(format: ExportFormat, scale: ExportScale): string {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const scaleSuffix = scale !== 1 ? `@${scale}x` : ''
  return `pixlab-export-${date}${scaleSuffix}.${format}`
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
