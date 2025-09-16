'use client'

interface CategoryStructuredDataProps {
  category: { name: string; slug: string; description?: string }
  products: Array<{ name: string; slug: string; images?: { url: string }[]; price?: number }>
}

export function CategoryStructuredData({ category, products }: CategoryStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Ürünleri`,
    description: category.description,
    url: `https://meridesignhouse.com/categories/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          url: `https://meridesignhouse.com/products/${product.slug}`,
          image: product.images?.[0]?.url,
          offers: product.price != null ? {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'TRY',
          } : undefined,
        },
      })),
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}


