import { HomePageClient } from '@/components/home/HomePageClient'
import { fetchNewArrivals, fetchFeaturedProducts } from '@/lib/actions/products'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Suspense } from 'react'


export default async function Home() {
  // Fetch new arrivals and featured products for the homepage
  const newArrivals = await fetchNewArrivals(8);
  const featuredProducts = await fetchFeaturedProducts(8);

  return (
    <CustomerLayout>
      <HomePageClient 
        newArrivals={newArrivals} 
        featuredProducts={featuredProducts} 
      />
    </CustomerLayout>
  )
}
