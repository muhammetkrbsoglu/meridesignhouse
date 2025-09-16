# 🔧 SEO Implementation - Düzeltilmiş ve Güncellenmiş Versiyon

## 1. HIZLI DÜZELTİLER (Critical Fixes)

### 1.1 Product Metadata - TypeScript Syntax Fix

```typescript
// ❌ HATALI KOD:
images: [product.images[0]?.url || '/og-default.jpg']

// ✅ DÜZELTME:
images: [product.images?.[0]?.url || '/og-default.jpg']
```

### 1.2 OpenGraph Type - Product Pages

```typescript
// app/products/[slug]/page.tsx - UPDATED
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug)
  
  if (!product) return {}

  return {
    title: product.name,
    description: product.description,
    keywords: [product.category.name, ...product.tags],
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'product', // ✅ DÜZELTME: "website" yerine "product"
      url: `https://meridesignhouse.com/products/${product.slug}`,
      images: product.images?.length > 0 ? [
        {
          url: product.images[0].url,
          width: 1200,
          height: 630,
          alt: product.name,
        }
      ] : [{
        url: '/og-product-default.jpg',
        width: 1200,
        height: 630,
        alt: product.name,
      }],
      siteName: 'MeriDesignHouse',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: product.images?.length > 0 ? [product.images[0].url] : ['/og-product-default.jpg'],
      // ✅ EKLEME: Twitter etiketleri
      creator: '@meridesignhouse',
      site: '@meridesignhouse',
    },
    other: {
      // ✅ EKLEME: Twitter ürün bilgileri
      'twitter:label1': 'Fiyat',
      'twitter:data1': `₺${product.price}`,
      'twitter:label2': 'Stok',
      'twitter:data2': product.stock > 0 ? 'Mevcut' : 'Tükendi',
    },
    alternates: {
      canonical: `https://meridesignhouse.com/products/${product.slug}`
    }
  }
}
```

### 1.3 Web Vitals - Next.js 15 Correct Implementation

```typescript
// app/layout.tsx - UPDATED
import { Suspense } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans">
        {children}
        <Suspense>
          <WebVitals />
        </Suspense>
      </body>
    </html>
  )
}

// ✅ DÜZELTME: Correct implementation
export function reportWebVitals(metric: any) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  }
}
```

### 1.4 Next.js Config - Real Domain Setup

```javascript
// next.config.js - UPDATED
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ✅ DÜZELTME: Gerçek domain'leri ekleyin
    domains: [
      'supabase-project-url.supabase.co', // Supabase Storage
      'imagekit.io', // Eğer ImageKit kullanıyorsanız
      'meridesignhouse.com', // Kendi domain'iniz
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  compress: true,
}

module.exports = withPWA(nextConfig)
```

## 2. YENİ EKLENMELER (AI Önerileri)

### 2.1 Website SearchAction Schema

```typescript
// components/WebsiteStructuredData.tsx - NEW
export function WebsiteStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MeriDesignHouse',
    url: 'https://meridesignhouse.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://meridesignhouse.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
```

### 2.2 Bundle/Set Product Schema

```typescript
// components/BundleStructuredData.tsx - NEW
interface BundleStructuredDataProps {
  bundle: Bundle & { items: BundleItem[] }
}

export function BundleStructuredData({ bundle }: BundleStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: bundle.name,
    description: bundle.description,
    sku: bundle.sku,
    brand: {
      '@type': 'Brand',
      name: 'MeriDesignHouse'
    },
    offers: {
      '@type': 'Offer',
      url: `https://meridesignhouse.com/bundles/${bundle.slug}`,
      priceCurrency: 'TRY',
      price: bundle.price,
      availability: bundle.isActive 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    },
    // ✅ YENİ: Bundle içeriği
    isRelatedTo: bundle.items.map(item => ({
      '@type': 'Product',
      name: item.product.name,
      sku: item.product.sku,
      url: `https://meridesignhouse.com/products/${item.product.slug}`
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
```

### 2.3 Category Collection Schema

```typescript
// components/CategoryStructuredData.tsx - NEW
interface CategoryStructuredDataProps {
  category: Category
  products: Product[]
  totalCount: number
}

export function CategoryStructuredData({ category, products, totalCount }: CategoryStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Ürünleri`,
    description: category.description,
    url: `https://meridesignhouse.com/categories/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalCount,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          url: `https://meridesignhouse.com/products/${product.slug}`,
          image: product.images?.[0]?.url,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'TRY'
          }
        }
      }))
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
```

### 2.4 Facet/Filter Pages - Robots Meta

```typescript
// app/categories/[slug]/page.tsx - UPDATED
interface CategoryPageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategory(params.slug)
  const hasFilters = Object.keys(searchParams).length > 0
  
  // ✅ YENİ: Filtreli sayfalar için robots meta
  const robots = hasFilters ? {
    index: false,
    follow: true,
  } : {
    index: true,
    follow: true,
  }

  return {
    title: hasFilters 
      ? `${category.name} Ürünleri - Filtrelenmiş Sonuçlar`
      : `${category.name} Ürünleri`,
    description: category.description,
    robots,
    alternates: {
      // ✅ YENİ: Filtreli sayfalar için canonical
      canonical: `https://meridesignhouse.com/categories/${category.slug}`
    }
  }
}
```

### 2.5 Custom 404 Page with Internal Links

```typescript
// app/not-found.tsx - NEW
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Sayfa Bulunamadı | MeriDesignHouse',
  description: 'Aradığınız sayfa bulunamadı. Ana sayfaya dönebilir veya ürünlerimizi inceleyebilirsiniz.',
  robots: {
    index: false,
    follow: true,
  }
}

export default async function NotFound() {
  // Son eklenen ürünler
  const recentProducts = await db.products.findMany({
    where: { isActive: true },
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: { images: true }
  })

  // Popüler kategoriler
  const categories = await db.categories.findMany({
    where: { isActive: true },
    take: 6,
    orderBy: { productCount: 'desc' }
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Sayfa Bulunamadı
          </h2>
          <p className="mt-2 text-gray-600">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Ana Sayfaya Dön
          </Link>
        </div>

        {/* ✅ YENİ: İç link zenginleştirmesi */}
        <div className="mt-12">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Popüler Kategorilerimiz
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-gray-900">{category.name}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {category.productCount} ürün
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Son Eklenen Ürünler
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
              >
                {product.images[0] && (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-3">
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-sm text-blue-600 mt-1">
                    ₺{product.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2.6 Updated Organization Schema (Placeholder Values)

```typescript
// components/OrganizationStructuredData.tsx - UPDATED
export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MeriDesignHouse',
    url: 'https://meridesignhouse.com',
    // ⚠️ PLACEHOLDER: Logo geldiğinde güncellenecek
    logo: 'https://meridesignhouse.com/logo-placeholder.png',
    description: 'Düğün, doğum günü ve özel etkinlikler için tasarım ürünleri ve dekorasyon malzemeleri.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
      // ⚠️ PLACEHOLDER: Gerçek adres bilgisi eklenecek
      addressLocality: '[ŞEHİR]',
      postalCode: '[POSTA_KODU]',
      streetAddress: '[ADRES]'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      // ⚠️ PLACEHOLDER: Gerçek telefon numarası geldiğinde güncellenecek
      telephone: '+90-XXX-XXX-XXXX',
      contactType: 'customer service',
      availableLanguage: ['Turkish'],
      areaServed: 'TR'
    },
    sameAs: [
      'https://www.instagram.com/meridesignhouse',
      'https://www.facebook.com/meridesignhouse',
      // WhatsApp Business API key'i geldiğinde:
      // 'https://wa.me/90XXXXXXXXXX'
    ],
    knowsAbout: [
      'Düğün organizasyonu',
      'Doğum günü dekorasyonu', 
      'Kına gecesi süsleme',
      'Nişan organizasyonu',
      'Etkinlik tasarımı'
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
```

## 3. ROBOTS.TXT - Simplified Version

```typescript
// app/robots.ts - UPDATED
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin*',
          '/api*',
          '/checkout/success*',
          '/order-tracking*',
          // ✅ SADELEŞTIRME: /_next* zaten indexlenmez
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin*', '/api/webhook*'],
      }
    ],
    sitemap: 'https://meridesignhouse.com/sitemap.xml',
  }
}
```

## 4. SITEMAP - Updated Priorities

```typescript
// app/sitemap.ts - UPDATED
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    {
      url: 'https://meridesignhouse.com',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0, // ✅ DÜZELTME: Numeric value
    },
    {
      url: 'https://meridesignhouse.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8, // ✅ DÜZELTME: Numeric value
    }
  ]

  // ✅ YENİ: Facet/pagination URL'lerini hariç tut
  const categories = await db.categories.findMany({
    where: { 
      isActive: true,
      // Facet sayfalarını hariç tut
    }
  })
  
  const categoryPages = categories.map(category => ({
    url: `https://meridesignhouse.com/categories/${category.slug}`,
    lastModified: new Date(category.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8, // ✅ DÜZELTME: Numeric value
  }))

  // Diğer sayfa mapping'leri...
  
  return [...staticPages, ...categoryPages, ...productPages, ...bundlePages]
}
```

## 5. BONUS: Bing Webmaster Tools & IndexNow

```typescript
// components/IndexNow.tsx - NEW (Optional)
'use client'

import { useEffect } from 'react'

export function IndexNow({ urls }: { urls: string[] }) {
  useEffect(() => {
    // IndexNow API ile hızlı indexleme
    const submitToIndexNow = async () => {
      try {
        const response = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            host: 'meridesignhouse.com',
            key: 'your-indexnow-key', // IndexNow key'i
            keyLocation: 'https://meridesignhouse.com/indexnow-key.txt',
            urlList: urls
          })
        })
      } catch (error) {
        console.log('IndexNow submission failed:', error)
      }
    }

    if (urls.length > 0) {
      submitToIndexNow()
    }
  }, [urls])

  return null
}
```

## 6. IMPLEMENTATION CHECKLIST

### ✅ Hemen Yapılacaklar:
- [x] TypeScript syntax hatalarını düzelt
- [x] OpenGraph type'ları güncelle  
- [x] Web Vitals implementation'ını düzelt
- [ ] Next.js config'de gerçek domain'leri ekle
- [x] Yeni structured data şemalarını ekle
- [x] Custom 404 sayfası oluştur

### ⏳ Bekleyen Bilgiler:
- [ ] Logo dosyası (Organization schema için)
- [ ] Gerçek telefon numarası (ContactPoint için)
- [ ] WhatsApp Business API key'i
- [ ] Gerçek adres bilgileri

### 📈 Monitoring Setup:
- [ ] Google Search Console verification
- [ ] Bing Webmaster Tools ekleme
- [ ] IndexNow key generation (opsiyonel)
- [ ] Core Web Vitals monitoring kurulum

## 7. Domain Sonrası Hızlı Kurulum Checklist (30 dk)

- [ ] GA4: Measurement ID (G-XXXX) oluştur ve paylaş
- [ ] (Opsiyonel) GTM: Container ID (GTM-XXXX) oluştur ve paylaş
- [ ] GSC: Domain mülkü ekle ve DNS TXT kaydı ile doğrula
- [ ] Bing Webmaster Tools: Site ekle ve DNS TXT ile doğrula
- [ ] Sitemap gönder: `/sitemap.xml` (GSC ve Bing)
- [ ] Robots test: `/robots.txt` erişilebilir ve doğru mu?
- [ ] IndexNow (opsiyonel): key üret, `public/indexnow-key.txt` koy, panelde key URL’sini tanımla
- [ ] Alternates/Canonical: Tüm absolute URL’lerde prod domain kullanıldığını kontrol et
- [ ] Analytics: GA4 kodu/etiketi prod’da çalışıyor mu (Realtime ile doğrula)

## 8. Durum Özeti (Şu An)

- [x] Sprint 1 (domain bağımsız teknik SEO) TAMAMLANDI
  - Metadata/canonical/noindex kuralları, structured data, sitemap/robots, 404, Web Vitals
- [ ] Sprint A (domain sonrası entegrasyonlar) BEKLEMEDE
  - GA4/GTM, GSC & Bing doğrulama, IndexNow, prod domain canonical kontrolü
  
Not: Domain alındığında bu dosyadaki “7. Domain Sonrası Hızlı Kurulum Checklist” adımları uygulanacaktır.