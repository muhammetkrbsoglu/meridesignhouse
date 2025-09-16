<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# MeriDesignHouse E-Ticaret SEO Rehberi: Kapsamlı Teknik SEO İmplementasyonu

Bu projenizde **sadece yazılımsal/teknik SEO optimizasyonu** yapacağım. İçerik üretimi, backlink building, PR çalışmaları gibi konular işletme sahibi tarafından yürütülecek. Rehber **Next.js 15 App Router** yapısına göre güncel 2025 best practice'leri içermektedir.[^1][^2]

![MeriDesignHouse E-Ticaret Sitesi - Teknik SEO Implementation Checklist](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/4a213c4e7274f7cb8bc371bd9994e6f5/00893f2d-946b-47b4-b3e2-efc384ebde24/c92570bb.png)

MeriDesignHouse E-Ticaret Sitesi - Teknik SEO Implementation Checklist

## 🎯 Temel Strateji

Projenizde şu teknik SEO alanlarında çalışacağız:

1. **Metadata API \& SEO Tags** - Search engine ve social media optimization
2. **Performance \& Core Web Vitals** - Sayfa hızı ve kullanıcı deneyimi
3. **Structured Data (JSON-LD)** - Rich snippets ve arama sonuçları
4. **Sitemap \& Robots** - Arama motoru keşfedilebilirlik
5. **Internal Linking \& Navigation** - Site mimarisi ve link equity
6. **Mobile \& PWA Optimization** - Mobil performans ve offline deneyim

## 📊 1. Metadata API \& SEO Tags

### 1.1 Static Metadata Export

Her sayfada temel metadata tanımlaması:

```typescript
// app/layout.tsx - Global metadata
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | MeriDesignHouse',
    default: 'MeriDesignHouse - Tasarım ve Etkinlik Ürünleri'
  },
  description: 'Düğün, doğum günü ve özel etkinlikler için tasarım ürünleri. Özgün konseptler ve tema paketleri.',
  keywords: ['tasarım ürünleri', 'düğün organizasyonu', 'doğum günü', 'etkinlik malzemeleri'],
  authors: [{ name: 'MeriDesignHouse' }],
  creator: 'MeriDesignHouse',
  publisher: 'MeriDesignHouse',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://meridesignhouse.com'
  }
}
```


### 1.2 Dynamic Metadata Generation

Ürün ve kategori sayfaları için dinamik metadata:

```typescript
// app/products/[slug]/page.tsx
import { Metadata } from 'next'

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
      type: 'website',
      url: `https://meridesignhouse.com/products/${product.slug}`,
      images: [
        {
          url: product.images[^0]?.url || '/og-default.jpg',
          width: 1200,
          height: 630,
          alt: product.name,
        }
      ],
      siteName: 'MeriDesignHouse',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.images[^0]?.url || '/og-default.jpg'],
    },
    alternates: {
      canonical: `https://meridesignhouse.com/products/${product.slug}`
    }
  }
}
```


### 1.3 Kategori Sayfaları Metadata

```typescript
// app/categories/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory(params.slug)
  
  return {
    title: `${category.name} Ürünleri`,
    description: `${category.name} kategorisinde ${category.productCount} farklı ürün. ${category.description}`,
    openGraph: {
      title: `${category.name} Ürünleri | MeriDesignHouse`,
      description: `${category.name} kategorisindeki tasarım ürünlerini keşfedin.`,
      type: 'website',
      url: `https://meridesignhouse.com/categories/${category.slug}`,
      images: [{
        url: category.image || '/og-category-default.jpg',
        width: 1200,
        height: 630,
        alt: `${category.name} ürünleri`
      }]
    }
  }
}
```


## ⚡ 2. Performance \& Core Web Vitals

### 2.1 Image Optimization

Next.js 15 Image component ile optimize edilmiş görseller:[^3][^4]

```typescript
// components/ProductImage.tsx
import Image from 'next/image'

interface ProductImageProps {
  product: Product
  priority?: boolean
}

export function ProductImage({ product, priority = false }: ProductImageProps) {
  return (
    <Image
      src={product.image}
      alt={product.name}
      width={400}
      height={400}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={priority} // Above-the-fold için
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHBEf/EABUBAQEAAAAAAAAAAAAAAAAAAAAAAAAB/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      className="rounded-lg object-cover"
    />
  )
}
```


### 2.2 Font Optimization

```typescript
// app/layout.tsx
import { Inter, Poppins } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // FOUT/FOIT önlemek için
  variable: '--font-inter'
})

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins'
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```


### 2.3 Code Splitting \& Lazy Loading

```typescript
// components/ProductReviews.tsx - Heavy component
import dynamic from 'next/dynamic'

const ProductReviews = dynamic(() => import('./ProductReviews'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  ),
})

export default function ProductPage() {
  return (
    <div>
      {/* Critical content */}
      <ProductDetails />
      
      {/* Lazy loaded content */}
      <ProductReviews />
    </div>
  )
}
```


### 2.4 Core Web Vitals Monitoring

```typescript
// app/layout.tsx - Web Vitals tracking
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Analytics'e gönder
    gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  })
  
  return null
}
```


## 🔧 3. Structured Data (JSON-LD)

### 3.1 Product Schema

```typescript
// components/ProductStructuredData.tsx
interface ProductStructuredDataProps {
  product: Product
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(img => img.url),
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'MeriDesignHouse'
    },
    offers: {
      '@type': 'Offer',
      url: `https://meridesignhouse.com/products/${product.slug}`,
      priceCurrency: 'TRY',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'MeriDesignHouse'
      }
    },
    aggregateRating: product.reviews.length > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviews.length
    } : undefined
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
```


### 3.2 Organization Schema

```typescript
// components/OrganizationStructuredData.tsx
export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MeriDesignHouse',
    url: 'https://meridesignhouse.com',
    logo: 'https://meridesignhouse.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+90-XXX-XXX-XXXX',
      contactType: 'customer service',
      availableLanguage: 'Turkish'
    },
    sameAs: [
      'https://www.instagram.com/meridesignhouse',
      'https://www.facebook.com/meridesignhouse'
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


### 3.3 Breadcrumb Schema

```typescript
// components/BreadcrumbStructuredData.tsx
interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
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


## 🗺️ 4. Sitemap \& Robots

### 4.1 Dynamic Sitemap.xml

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    {
      url: 'https://meridesignhouse.com',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://meridesignhouse.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: 'https://meridesignhouse.com/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }
  ]

  // Dynamic category pages
  const categories = await db.categories.findMany({
    where: { isActive: true }
  })
  
  const categoryPages = categories.map(category => ({
    url: `https://meridesignhouse.com/categories/${category.slug}`,
    lastModified: new Date(category.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic product pages
  const products = await db.products.findMany({
    where: { isActive: true }
  })
  
  const productPages = products.map(product => ({
    url: `https://meridesignhouse.com/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Bundle pages
  const bundles = await db.bundles.findMany({
    where: { isActive: true }
  })
  
  const bundlePages = bundles.map(bundle => ({
    url: `https://meridesignhouse.com/bundles/${bundle.slug}`,
    lastModified: new Date(bundle.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...productPages, ...bundlePages]
}
```


### 4.2 Robots.txt

```typescript
// app/robots.ts
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
          '/_next*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin*', '/api*'],
      }
    ],
    sitemap: 'https://meridesignhouse.com/sitemap.xml',
  }
}
```


## 🔗 5. Internal Linking \& Navigation

### 5.1 Breadcrumb Component

```typescript
// components/Breadcrumb.tsx
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

interface BreadcrumbItem {
  name: string
  href: string
  current: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={item.href}>
            <div className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
              )}
              {item.current ? (
                <span className="text-sm font-medium text-gray-500">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  {item.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Usage in product page
export function ProductPage({ product }: { product: Product }) {
  const breadcrumbItems = [
    { name: 'Ana Sayfa', href: '/', current: false },
    { name: product.category.name, href: `/categories/${product.category.slug}`, current: false },
    { name: product.name, href: `/products/${product.slug}`, current: true },
  ]

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />
      <BreadcrumbStructuredData items={breadcrumbItems} />
      {/* Rest of the product page */}
    </div>
  )
}
```


### 5.2 Related Products Component

```typescript
// components/RelatedProducts.tsx
export function RelatedProducts({ categoryId, currentProductId }: Props) {
  const relatedProducts = await db.products.findMany({
    where: {
      categoryId,
      id: { not: currentProductId },
      isActive: true
    },
    take: 4
  })

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Benzer Ürünler
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {relatedProducts.map(product => (
          <Link 
            key={product.id}
            href={`/products/${product.slug}`}
            className="group"
          >
            <ProductImage product={product} />
            <h3 className="mt-2 text-sm font-medium group-hover:text-blue-600">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500">₺{product.price}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
```


## 📱 6. Mobile \& PWA Optimization

### 6.1 PWA Configuration

```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-imagekit-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true, // Gzip compression
}

module.exports = withPWA(nextConfig)
```


### 6.2 Web App Manifest

```typescript
// app/manifest.ts
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MeriDesignHouse - Tasarım Ürünleri',
    short_name: 'MeriDesign',
    description: 'Düğün, doğum günü ve özel etkinlikler için tasarım ürünleri',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```


### 6.3 Mobile-Optimized Components

```typescript
// components/MobileOptimizedProductCard.tsx
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="aspect-square relative">
        <ProductImage 
          product={product}
          sizes="(max-width: 768px) 50vw, 25vw" // Mobile-first sizing
        />
        {product.isNewArrival && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Yeni
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ₺{product.price}
            </span>
            {product.oldPrice && (
              <span className="text-sm text-gray-500 line-through">
                ₺{product.oldPrice}
              </span>
            )}
          </div>
          <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
            Sepete Ekle
          </button>
        </div>
      </div>
    </div>
  )
}
```


## 📈 Performance Monitoring

### 6.4 Real User Metrics

```typescript
// lib/analytics.ts
export function trackCoreWebVitals() {
  // Google Analytics 4
  window.gtag('config', 'GA_MEASUREMENT_ID', {
    custom_map: {
      'custom_parameter_1': 'metric_name'
    }
  })
}

// Track Core Web Vitals
export function reportWebVitals(metric: any) {
  switch (metric.name) {
    case 'LCP':
      // Largest Contentful Paint
      gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'LCP',
        value: Math.round(metric.value),
        non_interaction: true,
      })
      break
    case 'CLS':
      // Cumulative Layout Shift
      gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'CLS',
        value: Math.round(metric.value * 1000),
        non_interaction: true,
      })
      break
    case 'INP':
      // Interaction to Next Paint
      gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'INP',
        value: Math.round(metric.value),
        non_interaction: true,
      })
      break
  }
}
```


## 🚀 Deployment Checklist

### Son Kontroller:

1. **✅ Metadata Kontrolü**: Tüm sayfalarda title, description, OG tags var mı?
2. **✅ Image Optimization**: next/image kullanılıyor mu? Alt tags ekli mi?
3. **✅ Sitemap Test**: `/sitemap.xml` erişilebilir mi?
4. **✅ Robots Test**: `/robots.txt` doğru yapılandırılmış mı?
5. **✅ Structured Data**: Google Rich Results Test ile kontrol et
6. **✅ Core Web Vitals**: PageSpeed Insights ile mobile/desktop testleri
7. **✅ PWA Test**: Lighthouse PWA audit'i geçiyor mu?
8. **✅ Internal Links**: Breadcrumb ve related products çalışıyor mu?

## 📊 Monitoring \& Analytics

### Google Search Console Setup:

```typescript
// Sitemap submission
// https://search.google.com/search-console/
// Property ekle: https://meridesignhouse.com
// Sitemap gönder: /sitemap.xml

// Core Web Vitals tracking
// Performance raporu ile LCP, CLS, INP değerlerini takip et
```

Bu implementasyonla **MeriDesignHouse** e-ticaret siteniz teknik SEO açısından Google'ın güncel standartlarına uygun hale gelecek. Tüm ayarlar **Next.js 15 App Router** yapısında optimize edilmiştir.[^5][^6]

**Sonraki adımlar:**

1. Bu kodu implement edin
2. Google Search Console'da sitenizi kaydedin
3. 2-4 hafta içinde SEO metriklerinizdeki gelişmeyi takip edin
4. Core Web Vitals'ı sürekli monitör edin

**Not**: Content writing, link building, social media marketing gibi off-page SEO çalışmalarını işletme sahibi yürütecek.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61][^62][^63][^64][^7][^8][^9]</span>

<div style="text-align: center">⁂</div>

[^1]: package.json

[^2]: package-lock.json

[^3]: tsconfig.json

[^4]: https://sustainability.hapres.com/htmls/JSR_1695_Detail.html

[^5]: https://bmcsurg.biomedcentral.com/articles/10.1186/s12893-025-02763-6

[^6]: https://dx.plos.org/10.1371/journal.pmed.1004589

[^7]: https://javascript.plainenglish.io/next-js-15-tutorial-part-15-mastering-seo-with-metadata-in-the-app-router-b11ab196d51f

[^8]: https://dev.to/abhay1kumar/optimizing-nextjs-websites-for-core-web-vitals-and-page-performance-5713

[^9]: https://reliasoftware.com/blog/nextjs-ecommerce-optimization-for-better-seo-and-performance

[^10]: https://www.digitalapplied.com/blog/nextjs-seo-guide

[^11]: https://www.patterns.dev/react/nextjs-vitals/

[^12]: https://dev.to/khalisspasha/boost-your-websites-seo-with-structured-data-and-schema-in-nextjs-34pl

[^13]: https://dev.to/joodi/maximizing-seo-with-meta-data-in-nextjs-15-a-comprehensive-guide-4pa7

[^14]: https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025

[^15]: https://www.wisp.blog/blog/implementing-json-ld-in-nextjs-for-seo

[^16]: https://www.youtube.com/watch?v=OldUurB0Wx8

[^17]: https://vercel.com/guides/optimizing-core-web-vitals-in-2024

[^18]: https://www.reddit.com/r/nextjs/comments/1ccr79j/tutorial_add_structured_data_to_your_nextjs_sites/

[^19]: https://nextjs.org/docs/app/getting-started/metadata-and-og-images

[^20]: https://nextjs.org/learn/seo/improve

[^21]: https://payloadcms.com/posts/guides/add-schema-markup-to-payload--nextjs-for-better-seo

[^22]: https://nextjs.org/learn/dashboard-app/adding-metadata

[^23]: https://nextjs.org/learn/seo/web-performance

[^24]: https://nextjs.org/docs/app/guides/json-ld

[^25]: https://www.wisp.blog/blog/how-to-choose-between-app-router-and-pages-router-in-nextjs-15-a-complete-guide-for-seo-conscious-developers

[^26]: https://strapi.io/blog/web-performance-optimization-in-nextjs

[^27]: https://www.youtube.com/watch?v=N6JqaELYdFw

[^28]: https://mikebifulco.com/posts/self-healing-urls-nextjs-seo

[^29]: https://uploadcare.com/blog/image-optimization-in-nextjs/

[^30]: https://mikebifulco.com/posts/migrate-from-next-sitemap-to-app-directory-sitemap

[^31]: https://www.reddit.com/r/nextjs/comments/1mckybr/nextjs_seo_flexible_and_clean_url_patterns_vs/

[^32]: https://nextjs.org/learn/seo/images

[^33]: https://dev.to/arfatapp/generating-dynamic-robotstxt-and-sitemapxml-in-a-nextjs-app-router-with-typescript-35l9

[^34]: https://bitrock.it/blog/how-to-make-your-next-js-site-seo-friendly.html

[^35]: https://prismic.io/blog/nextjs-image-component-optimization

[^36]: https://stackoverflow.com/questions/79455802/how-to-set-up-next-sitemap-to-properly-generate-robots-txt-and-sitemap-xml-for-n

[^37]: https://strapi.io/blog/nextjs-seo

[^38]: https://nextjs.org/docs/14/app/building-your-application/optimizing/images

[^39]: https://payloadcms.com/posts/guides/how-to-create-a-robotstxt-file-in-payload-with-nextjs

[^40]: https://nextjs.org/learn/seo/url-structure

[^41]: https://dev.to/vsnikhilvs/nextjs-image-optimization-c3p

[^42]: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

[^43]: https://dev.to/svobik7/step-by-step-guide-for-seo-friendly-i18n-routes-in-nextjs-13-3j0f

[^44]: https://javascript.plainenglish.io/handling-500-images-in-a-gallery-with-lazy-loading-in-next-js-15-f103b228a200

[^45]: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

[^46]: https://nextjs.org/docs/app/getting-started/project-structure

[^47]: https://aca.pensoft.net/article/129388/

[^48]: https://seranking.com/blog/breadcrumb-navigation/

[^49]: https://nextjsstarter.com/blog/10-nextjs-optimization-tips-for-mobile-e-commerce/

[^50]: https://inlinks.com/how-to-do-internal-link-audit/

[^51]: https://prateeksha.com/blog/how-to-build-a-pwa-with-next-js-for-blazing-fast-mobile-experience

[^52]: https://searchendurance.com/internal-links-seo/

[^53]: https://www.wisp.blog/blog/mastering-mobile-performance-a-complete-guide-to-improving-nextjs-lighthouse-scores

[^54]: https://blog.stackademic.com/core-web-vitals-optimisation-in-next-js-1b8d4ba6074d

[^55]: https://www.reddit.com/r/nextjs/comments/1jdvosx/nextjs_seo_issue_csr_hiding_internal_links_need/

[^56]: https://dev.to/stormsidali2001/turn-your-nextjs-app-into-a-mobile-powerhouse-easy-pwa-guide-3560

[^57]: https://nitropack.io/blog/post/most-important-core-web-vitals-metrics

[^58]: https://dev.to/dan_starner/building-dynamic-breadcrumbs-in-nextjs-17oa

[^59]: https://nextjs.org/docs/app/guides/progressive-web-apps

[^60]: https://www.valido.ai/en/optimize-core-web-vitals/

[^61]: https://purecode.ai/components/nextjs/breadcrumbs

[^62]: https://www.iflair.com/next-js-mobile-optimization-enhancing-ux-with-adaptive-rendering-strategies/

[^63]: https://nextjs.org/learn/dashboard-app/mutating-data

[^64]: https://moldstud.com/articles/p-step-by-step-tips-for-creating-a-fast-and-responsive-nextjs-pwa

