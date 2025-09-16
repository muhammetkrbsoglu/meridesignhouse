import { getPresetImageUrl } from '../src/lib/imagekit'

// Test different image files
const testImages = [
  'placeholder-product.jpg',
  'placeholder-product.svg',
  'file.svg',
  'globe.svg',
  'next.svg',
  'vercel.svg',
  'window.svg'
]

console.log('🔍 ImageKit URL Test:')
console.log('Base URL:', process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT)

testImages.forEach(image => {
  const url = getPresetImageUrl(image, 'hero')
  console.log(`\n📸 ${image}:`)
  console.log(`   URL: ${url}`)
})
