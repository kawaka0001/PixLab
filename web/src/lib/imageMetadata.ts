/**
 * wasmCloud Image Metadata API Client
 * Analyzes images using the wasmCloud image-metadata service
 */

import logger from '../utils/logger'

export interface ImageMetadata {
  size_bytes: number
  format: string
  width: number | null
  height: number | null
  message: string
}

const WASMCLOUD_API_URL = import.meta.env.VITE_WASMCLOUD_API_URL || 'http://127.0.0.1:8000'

/**
 * Common fetch logic for wasmCloud API calls
 * @param body - Request body (ArrayBuffer or Blob)
 * @param source - Source of the request for logging
 * @returns Image metadata
 */
async function fetchImageMetadata(
  body: ArrayBuffer | Blob,
  source: 'file' | 'imagedata'
): Promise<ImageMetadata> {
  const startTime = performance.now()
  const bodySize = body instanceof Blob ? body.size : body.byteLength

  logger.info('Sending image to wasmCloud for analysis', {
    action: 'WASMCLOUD_API_REQUEST',
    source,
    bodySize,
    endpoint: `${WASMCLOUD_API_URL}/analyze`,
  })

  try {
    const response = await fetch(`${WASMCLOUD_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body,
    })

    const duration = performance.now() - startTime

    if (!response.ok) {
      const errorMsg = `wasmCloud API request failed: ${response.status} ${response.statusText}`
      logger.error(errorMsg, {
        action: 'WASMCLOUD_API_ERROR',
        status: response.status,
        statusText: response.statusText,
        duration,
      })
      throw new Error(errorMsg)
    }

    const metadata: ImageMetadata = await response.json()

    logger.info('Image analysis completed successfully', {
      action: 'WASMCLOUD_API_SUCCESS',
      duration,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size_bytes: metadata.size_bytes,
      },
    })

    return metadata
  } catch (error) {
    const duration = performance.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    logger.error('wasmCloud API call failed', {
      action: 'WASMCLOUD_API_EXCEPTION',
      error: errorMessage,
      duration,
      source,
    })

    throw error
  }
}

/**
 * Analyze an image using the wasmCloud metadata service
 * @param file - The image file to analyze
 * @returns Image metadata including dimensions, format, and size
 */
export async function analyzeImage(file: File): Promise<ImageMetadata> {
  logger.debug('Starting image analysis from File', {
    action: 'ANALYZE_IMAGE_START',
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  })

  try {
    const arrayBuffer = await file.arrayBuffer()
    return await fetchImageMetadata(arrayBuffer, 'file')
  } catch (error) {
    logger.error('Failed to analyze image from File', {
      action: 'ANALYZE_IMAGE_ERROR',
      fileName: file.name,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

/**
 * Analyze an image from ImageData
 * Converts ImageData to PNG blob and sends to wasmCloud service
 * @param imageData - The ImageData to analyze
 * @returns Image metadata
 */
export async function analyzeImageData(imageData: ImageData): Promise<ImageMetadata> {
  logger.debug('Starting image analysis from ImageData', {
    action: 'ANALYZE_IMAGEDATA_START',
    width: imageData.width,
    height: imageData.height,
    dataSize: imageData.data.length,
  })

  try {
    // Create a canvas to convert ImageData to blob
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      const error = new Error('Failed to get canvas context')
      logger.error('Canvas context creation failed', {
        action: 'CANVAS_CONTEXT_ERROR',
        error: error.message,
      })
      throw error
    }

    ctx.putImageData(imageData, 0, 0)

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      }, 'image/png')
    })

    logger.debug('ImageData converted to PNG blob', {
      action: 'IMAGEDATA_TO_BLOB',
      blobSize: blob.size,
    })

    return await fetchImageMetadata(blob, 'imagedata')
  } catch (error) {
    logger.error('Failed to analyze ImageData', {
      action: 'ANALYZE_IMAGEDATA_ERROR',
      width: imageData.width,
      height: imageData.height,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
