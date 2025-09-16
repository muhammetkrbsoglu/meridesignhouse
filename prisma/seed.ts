import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create Categories
  console.log('📂 Creating categories...')
  const categories = await Promise.all([
    // Main Categories - Gerçek Ürün Kategorileri
    prisma.category.upsert({
      where: { slug: 'mumlar' },
      update: {},
      create: {
        name: 'Mumlar',
        slug: 'mumlar',
        description: 'Özel tasarım mumlar ve mum setleri',
        isActive: true,
        sortOrder: 1
      }
    }),
    prisma.category.upsert({
      where: { slug: 'anahtarliklar' },
      update: {},
      create: {
        name: 'Anahtarlıklar',
        slug: 'anahtarliklar',
        description: 'Kişiye özel tasarım anahtarlıklar',
        isActive: true,
        sortOrder: 2
      }
    }),
    prisma.category.upsert({
      where: { slug: 'cikolata-setleri' },
      update: {},
      create: {
        name: 'Çikolata Setleri',
        slug: 'cikolata-setleri',
        description: 'Özel ambalajlı çikolata setleri',
        isActive: true,
        sortOrder: 3
      }
    }),
    prisma.category.upsert({
      where: { slug: 'saten-sac-lastikleri' },
      update: {},
      create: {
        name: 'Saten Saç Lastikleri',
        slug: 'saten-sac-lastikleri',
        description: 'Kaliteli saten saç lastikleri',
        isActive: true,
        sortOrder: 4
      }
    }),
    prisma.category.upsert({
      where: { slug: 'epoksi-miknatislar' },
      update: {},
      create: {
        name: 'Epoksi Mıknatıslar',
        slug: 'epoksi-miknatislar',
        description: 'Özel tasarım epoksi mıknatıslar',
        isActive: true,
        sortOrder: 5
      }
    }),
    prisma.category.upsert({
      where: { slug: 'kolonya-siseleri' },
      update: {},
      create: {
        name: 'Kolonya Şişeleri',
        slug: 'kolonya-siseleri',
        description: 'Dekoratif kolonya şişeleri',
        isActive: true,
        sortOrder: 6
      }
    }),
    prisma.category.upsert({
      where: { slug: 'hediye-setleri' },
      update: {},
      create: {
        name: 'Hediye Setleri',
        slug: 'hediye-setleri',
        description: 'Özel günler için hazırlanmış hediye setleri',
        isActive: true,
        sortOrder: 7
      }
    }),
    prisma.category.upsert({
      where: { slug: 'oda-kokular' },
      update: {},
      create: {
        name: 'Oda Kokuları',
        slug: 'oda-kokular',
        description: 'Ev için özel oda kokuları',
        isActive: true,
        sortOrder: 8
      }
    }),
    prisma.category.upsert({
      where: { slug: 'isteme-setleri' },
      update: {},
      create: {
        name: 'İsteme Setleri',
        slug: 'isteme-setleri',
        description: 'Kız isteme törenleri için özel setler',
        isActive: true,
        sortOrder: 9
      }
    })
  ])

  // Create subcategories for each main category
  console.log('📁 Creating subcategories...')
  const subcategoryData = [
    // Mum alt kategorileri
    { name: 'Kokulu Mumlar', slug: 'mumlar-kokulu', parentSlug: 'mumlar' },
    { name: 'Dekoratif Mumlar', slug: 'mumlar-dekoratif', parentSlug: 'mumlar' },
    { name: 'Özel Tasarım Mumlar', slug: 'mumlar-ozel-tasarim', parentSlug: 'mumlar' },
    
    // Anahtarlık alt kategorileri
    { name: 'Kişiye Özel', slug: 'anahtarliklar-kisiye-ozel', parentSlug: 'anahtarliklar' },
    { name: 'Çift Anahtarlıkları', slug: 'anahtarliklar-cift', parentSlug: 'anahtarliklar' },
    { name: 'İsimli Anahtarlıklar', slug: 'anahtarliklar-isimli', parentSlug: 'anahtarliklar' },
    
    // Çikolata Seti alt kategorileri
    { name: 'Lüks Çikolata Kutuları', slug: 'cikolata-setleri-luks', parentSlug: 'cikolata-setleri' },
    { name: 'Özel Gün Çikolataları', slug: 'cikolata-setleri-ozel-gun', parentSlug: 'cikolata-setleri' },
    { name: 'Hediye Çikolataları', slug: 'cikolata-setleri-hediye', parentSlug: 'cikolata-setleri' },
    
    // Hediye Seti alt kategorileri
    { name: 'Doğum Günü Setleri', slug: 'hediye-setleri-dogum-gunu', parentSlug: 'hediye-setleri' },
    { name: 'Yıldönümü Setleri', slug: 'hediye-setleri-yildonumu', parentSlug: 'hediye-setleri' },
    { name: 'Özel Gün Setleri', slug: 'hediye-setleri-ozel-gun', parentSlug: 'hediye-setleri' },
    
    // İsteme Seti alt kategorileri
    { name: 'Çiçekli İsteme Setleri', slug: 'isteme-setleri-cicekli', parentSlug: 'isteme-setleri' },
    { name: 'Çikolatalı İsteme Setleri', slug: 'isteme-setleri-cikolatali', parentSlug: 'isteme-setleri' },
    { name: 'Lüks İsteme Setleri', slug: 'isteme-setleri-luks', parentSlug: 'isteme-setleri' },
    
    // Oda Kokusu alt kategorileri
    { name: 'Sprey Oda Kokuları', slug: 'oda-kokular-sprey', parentSlug: 'oda-kokular' },
    { name: 'Reed Diffuser', slug: 'oda-kokular-reed-diffuser', parentSlug: 'oda-kokular' },
    { name: 'Özel Kokular', slug: 'oda-kokular-ozel', parentSlug: 'oda-kokular' }
  ]

  for (const subcat of subcategoryData) {
    const parentCategory = categories.find(cat => cat.slug === subcat.parentSlug)
    if (parentCategory) {
      await prisma.category.upsert({
        where: { slug: subcat.slug },
        update: {},
        create: {
          name: subcat.name,
          slug: subcat.slug,
          parentId: parentCategory.id,
          isActive: true,
          sortOrder: 1
        }
      })
    }
  }

  // Create Event Types - Gerçek Etkinlik Türleri
  console.log('🎉 Creating event types...')
  const eventTypes = await Promise.all([
    prisma.eventType.upsert({
      where: { name: 'Doğum Günü' },
      update: {},
      create: {
        name: 'Doğum Günü',
        description: 'Doğum günü kutlamaları için özel ürünler',
        isActive: true,
        sortOrder: 1
      }
    }),
    prisma.eventType.upsert({
      where: { name: 'Yıldönümü' },
      update: {},
      create: {
        name: 'Yıldönümü',
        description: 'Yıldönümü kutlamaları için romantik ürünler',
        isActive: true,
        sortOrder: 2
      }
    }),
    prisma.eventType.upsert({
      where: { name: 'Kız İsteme' },
      update: {},
      create: {
        name: 'Kız İsteme',
        description: 'Kız isteme törenleri için özel setler',
        isActive: true,
        sortOrder: 3
      }
    }),
    prisma.eventType.upsert({
      where: { name: 'Sevgililer Günü' },
      update: {},
      create: {
        name: 'Sevgililer Günü',
        description: 'Sevgililer günü için romantik hediyeler',
        isActive: true,
        sortOrder: 4
      }
    }),
    prisma.eventType.upsert({
      where: { name: 'Anneler Günü' },
      update: {},
      create: {
        name: 'Anneler Günü',
        description: 'Anneler günü için özel hediye setleri',
        isActive: true,
        sortOrder: 5
      }
    }),
    prisma.eventType.upsert({
      where: { name: 'Öğretmenler Günü' },
      update: {},
      create: {
        name: 'Öğretmenler Günü',
        description: 'Öğretmenler günü için teşekkür hediyeleri',
        isActive: true,
        sortOrder: 6
      }
    })
  ])

  // Create Theme Styles - Renk ve Tasarım Temaları
  console.log('🎨 Creating theme styles...')
  const themeStyles = await Promise.all([
    prisma.themeStyle.upsert({
      where: { name: 'Pembe Tonları' },
      update: {},
      create: {
        name: 'Pembe Tonları',
        description: 'Pembe ve pastel renk tonları',
        colors: ['#FFB6C1', '#FFC0CB', '#FF69B4', '#FF1493'],
        isActive: true,
        sortOrder: 1
      }
    }),
    prisma.themeStyle.upsert({
      where: { name: 'Mavi Tonları' },
      update: {},
      create: {
        name: 'Mavi Tonları',
        description: 'Mavi ve turkuaz renk tonları',
        colors: ['#87CEEB', '#4169E1', '#0000FF', '#1E90FF'],
        isActive: true,
        sortOrder: 2
      }
    }),
    prisma.themeStyle.upsert({
      where: { name: 'Altın Sarısı' },
      update: {},
      create: {
        name: 'Altın Sarısı',
        description: 'Altın ve sarı renk tonları',
        colors: ['#FFD700', '#FFA500', '#FFFF00', '#F0E68C'],
        isActive: true,
        sortOrder: 3
      }
    }),
    prisma.themeStyle.upsert({
      where: { name: 'Kırmızı Tonları' },
      update: {},
      create: {
        name: 'Kırmızı Tonları',
        description: 'Kırmızı ve bordo renk tonları',
        colors: ['#FF0000', '#DC143C', '#B22222', '#8B0000'],
        isActive: true,
        sortOrder: 4
      }
    }),
    prisma.themeStyle.upsert({
      where: { name: 'Yeşil Tonları' },
      update: {},
      create: {
        name: 'Yeşil Tonları',
        description: 'Yeşil ve doğa renk tonları',
        colors: ['#00FF00', '#32CD32', '#228B22', '#006400'],
        isActive: true,
        sortOrder: 5
      }
    }),
    prisma.themeStyle.upsert({
      where: { name: 'Mor Tonları' },
      update: {},
      create: {
        name: 'Mor Tonları',
        description: 'Mor ve lavanta renk tonları',
        colors: ['#800080', '#9370DB', '#8A2BE2', '#9932CC'],
        isActive: true,
        sortOrder: 6
      }
    })
  ])

  console.log('✅ Database seeding completed successfully!')
  console.log(`📊 Created ${categories.length} main categories`)
  console.log(`🎉 Created ${eventTypes.length} event types`)
  console.log(`🎨 Created ${themeStyles.length} theme styles`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })