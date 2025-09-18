import type { MetadataRoute } from 'next'
import { fetchAllMainCategoriesWithHierarchy } from '@/lib/actions/categories'
import { fetchProducts } from '@/lib/actions/products'

const siteUrl = 'https://meridesignhouse.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ['', '/about', '/contact', '/products', '/design-studio', '/cart', '/favorites', '/orders', '/order-tracking']
  const staticRoutes = routes.map((route) => ({
    url: `${siteUrl}${route}`,
    priority: route === '' ? 1 : route === '/products' ? 0.9 : 0.7,
    changeFrequency: 'weekly' as const,
  }))

  const [categories, products] = await Promise.all([
    fetchAllMainCategoriesWithHierarchy(),
    fetchProducts(),
  ])

  const categoryRoutes = categories.flatMap((category) => {
    const paths = [category, ...(category.children ?? [])]
    return paths.map((item) => ({
      url: `${siteUrl}/categories/${item.slug}`,
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    }))
  })

  const productRoutes = products.map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    priority: 0.7,
    changeFrequency: 'weekly' as const,
  }))

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
