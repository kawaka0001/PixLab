import { supabase } from './supabase'

const BUCKET_NAME = 'pixlab-images'

/**
 * Upload image to Supabase Storage
 *
 * @param file - Image file to upload
 * @param roomId - Room ID for organizing images
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(file: File, roomId: string): Promise<string> {
  // Generate unique filename
  const timestamp = Date.now()
  const filename = `${roomId}/${timestamp}-${file.name}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Download image from URL as ImageData
 *
 * @param url - Image URL
 * @returns ImageData object for canvas manipulation
 */
export async function downloadImageAsImageData(url: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      // Create offscreen canvas to extract ImageData
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      resolve(imageData)
    }

    img.onerror = () => {
      reject(new Error(`Failed to load image from ${url}`))
    }

    img.src = url
  })
}
