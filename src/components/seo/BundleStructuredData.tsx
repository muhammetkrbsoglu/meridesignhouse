'use client'

type BundleItem = {
  product?: {
    name?: string
    slug?: string
    sku?: string | null
  } | null
  productId?: string
}

type BundleData = {
  id?: string
  name?: string
  description?: string | null
  sku?: string | null
  slug?: string
  bundlePrice?: number | null
  items?: BundleItem[]
}

interface BundleStructuredDataProps {
  bundle: BundleData
}

export function BundleStructuredData({ bundle }: BundleStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: bundle?.name,
    description: bundle?.description,
    sku: bundle?.sku || bundle?.id,
    brand: { '@type': 'Brand', name: 'Meri DesignHouse' },
    offers: {
      '@type': 'Offer',
      url: `https://meridesignhouse.com/bundles/${bundle?.slug}`,
      priceCurrency: 'TRY',
      price: bundle?.bundlePrice,
      availability: 'https://schema.org/InStock',
    },
    isRelatedTo: (bundle?.items || []).map((it: BundleItem) => ({
      '@type': 'Product',
      name: it?.product?.name,
      sku: it?.product?.sku || it?.productId,
      url: `https://meridesignhouse.com/products/${it?.product?.slug}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}


