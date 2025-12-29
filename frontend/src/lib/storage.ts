/**
 * Image storage utilities for uploading coin images to MinIO
 */

const MINIO_URL = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000'
const BUCKET_NAME = 'coin-images'

export interface UploadResult {
  image_url: string
  thumbnail_url: string
}

/**
 * Upload a coin image to MinIO storage
 * @param file - The image file to upload
 * @param coinId - Optional coin ID for naming
 * @returns Promise with image URLs
 */
export async function uploadCoinImage(file: File, coinId?: string): Promise<UploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = coinId
      ? `${coinId}_${timestamp}.${extension}`
      : `coin_${timestamp}_${randomStr}.${extension}`

    // For now, create a data URL (base64) as fallback
    // In production, this should upload to MinIO via a backend endpoint
    const dataUrl = await fileToDataUrl(file)

    // TODO: Implement actual MinIO upload via backend endpoint
    // For now, return the data URL which can be stored in the database
    // The backend should provide an endpoint like POST /api/upload that:
    // 1. Accepts the file
    // 2. Uploads to MinIO
    // 3. Returns the public URL

    return {
      image_url: dataUrl,
      thumbnail_url: dataUrl, // In production, create an actual thumbnail
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
}

/**
 * Convert a File to a data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Upload image via backend endpoint (for production use)
 */
export async function uploadCoinImageViaBackend(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload image')
  }

  const data = await response.json()
  return {
    image_url: data.image_url,
    thumbnail_url: data.thumbnail_url || data.image_url,
  }
}

/**
 * Get the public URL for a MinIO object
 */
export function getImageUrl(path: string): string {
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path
  }
  return `${MINIO_URL}/${BUCKET_NAME}/${path}`
}
