import ImageKit from 'imagekit'

// ImageKit client for server-side operations
export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
})

// ImageKit configuration for client-side
export const imagekitConfig = {
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
  authenticationEndpoint: '/api/imagekit/auth'
}

// Helper function to generate optimized image URLs
export function getOptimizedImageUrl(
  src: string | undefined,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'jpg' | 'png'
    crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max'
    focus?: 'auto' | 'face' | 'center'
  } = {}
) {
  const placeholder = '/placeholder-product.jpg'
  if (!src || typeof src !== 'string') {
    return placeholder
  }
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    crop = 'maintain_ratio',
    focus = 'auto'
  } = options

  // If no transformations needed, return original URL
  if (!width && !height && !quality && !format && !crop && !focus) {
    return src
  }

  const transformations = []
  
  if (width) transformations.push(`w-${width}`)
  if (height) transformations.push(`h-${height}`)
  if (quality) transformations.push(`q-${quality}`)
  if (format) transformations.push(`f-${format}`)
  if (crop) transformations.push(`c-${crop}`)
  if (focus) transformations.push(`fo-${focus}`)

  const transformationString = transformations.join(',')
  
  // If src is already a full ImageKit URL, add transformations
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
  if (endpoint && src.includes(endpoint)) {
    // Check if URL already has transformations
    if (src.includes('/tr:')) {
      // Replace existing transformations
      const urlParts = src.split('/tr:')
      const basePath = urlParts[0]
      const imagePath = urlParts[1]?.split('/').slice(1).join('/') || urlParts[1]
      return `${basePath}/tr:${transformationString}/${imagePath}`
    } else {
      // Add new transformations
      const imagePath = src.replace(endpoint, '')
      return `${endpoint}/tr:${transformationString}${imagePath}`
    }
  }
  
  // If src is a relative path, construct full ImageKit URL
  const cleanSrc = src.startsWith('/') ? src.slice(1) : src
  if (endpoint) {
    return `${endpoint}/tr:${transformationString}/${cleanSrc}`
  }
  // Fallback to placeholder if endpoint missing
  return placeholder
}

// Helper function for responsive images
export function getResponsiveImageSrcSet(
  src: string | undefined,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
) {
  return sizes
    .map(size => `${getOptimizedImageUrl(src, { width: size })} ${size}w`)
    .join(', ')
}

// Upload file to ImageKit
export async function uploadToImageKit(
  file: Buffer | string,
  fileName: string,
  folder?: string
) {
  try {
    const uploadResponse = await imagekit.upload({
      file,
      fileName,
      folder: folder || 'products',
      useUniqueFileName: true,
      tags: ['product', 'upload']
    })
    
    return {
      success: true,
      data: uploadResponse
    }
  } catch (error) {
    console.error('ImageKit upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

// Delete file from ImageKit
export async function deleteFromImageKit(fileId: string) {
  try {
    await imagekit.deleteFile(fileId)
    return { success: true }
  } catch (error) {
    console.error('ImageKit delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

// Get file details from ImageKit
export async function getImageKitFileDetails(fileId: string) {
  try {
    const fileDetails = await imagekit.getFileDetails(fileId)
    return {
      success: true,
      data: fileDetails
    }
  } catch (error) {
    console.error('ImageKit file details error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file details'
    }
  }
}

// ImageKit transformation presets
export const imagePresets = {
  thumbnail: { width: 150, height: 150, crop: 'force' as const, quality: 70 },
  small: { width: 300, height: 300, crop: 'maintain_ratio' as const, quality: 80 },
  medium: { width: 600, height: 600, crop: 'maintain_ratio' as const, quality: 85 },
  large: { width: 1200, height: 1200, crop: 'maintain_ratio' as const, quality: 90 },
  hero: { width: 1920, height: 1080, crop: 'maintain_ratio' as const, quality: 90 },
  productCard: { width: 400, height: 300, crop: 'force' as const, quality: 80 },
  productDetail: { width: 800, height: 600, crop: 'maintain_ratio' as const, quality: 90 },
  whatsappMessage: { 
    width: 900, 
    height: 1800, 
    crop: 'force' as const, 
    quality: 100,
    focus: 'center' as const,
    format: 'webp' as const
  }
} as const

// Get preset image URL
export function getPresetImageUrl(src: string | undefined, preset: keyof typeof imagePresets) {
  return getOptimizedImageUrl(src, imagePresets[preset])
}


