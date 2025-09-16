import type { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://meridesignhouse.com'
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ]

  const supabase = getSupabaseAdmin()

  // Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updatedAt, isActive')
    .eq('isActive', true)

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((c: any) => ({
    url: `${base}/categories/${c.slug}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Products
  const { data: products } = await supabase
    .from('products')
    .select('slug, updatedAt, isActive')
    .eq('isActive', true)

  const productPages: MetadataRoute.Sitemap = (products || []).map((p: any) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Bundles
  const { data: bundles } = await supabase
    .from('bundles')
    .select('slug, updatedAt, isActive')
    .eq('isActive', true)

  const bundlePages: MetadataRoute.Sitemap = (bundles || []).map((b: any) => ({
    url: `${base}/bundles/${b.slug}`,
    lastModified: b.updatedAt ? new Date(b.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...productPages, ...bundlePages]
}


