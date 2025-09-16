import { uploadToImageKit } from '../src/lib/imagekit'
import fs from 'fs'
import path from 'path'

async function uploadDesignStudioImage() {
  try {
    console.log('🎨 Tasarım Atölyesi görseli yükleniyor...')
    
    // PNG dosyasını oku
    const imagePath = path.join(process.cwd(), 'tasarım atölyesi.png')
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Dosya bulunamadı:', imagePath)
      return
    }
    
    const imageBuffer = fs.readFileSync(imagePath)
    
    // ImageKit'e yükle
    const result = await uploadToImageKit(
      imageBuffer,
      'tasarim-atolyesi-coming-soon.png',
      'design-studio'
    )
    
    if (result.success && result.data) {
      console.log('✅ Görsel başarıyla yüklendi!')
      console.log('📁 Dosya ID:', result.data.fileId)
      console.log('🔗 URL:', result.data.url)
      console.log('📂 Yol:', (result.data as any).filePath)
    } else {
      console.error('❌ Yükleme hatası:', result.error || 'Bilinmeyen hata')
    }
    
  } catch (error) {
    console.error('❌ Hata:', error)
  }
}

uploadDesignStudioImage()