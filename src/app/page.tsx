import { fetchNewArrivals, fetchFeaturedProducts } from '@/lib/actions/products'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { HomePageClient } from './HomePageClient'

export default async function Home() {
  const [newArrivals, featuredProducts] = await Promise.all([
    fetchNewArrivals(8),
    fetchFeaturedProducts(8),
  ])

  return (
    <CustomerLayout>
      <HomePageClient newArrivals={newArrivals} featuredProducts={featuredProducts} />
    </CustomerLayout>
  )
}
