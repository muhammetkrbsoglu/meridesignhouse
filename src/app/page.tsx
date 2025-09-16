import { HeroSection } from '@/components/home/HeroSection'
import { EventConceptDesigner } from '@/components/home/EventConceptDesigner'
import { NewArrivals } from '@/components/home/NewArrivals'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import dynamic from 'next/dynamic'
const HappyCustomers = dynamic(() => import('@/components/home/HappyCustomers'), { ssr: false })
import { fetchNewArrivals, fetchFeaturedProducts } from '@/lib/actions/products'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Suspense } from 'react'
const TestimonialsSection = dynamic(() => import('@/components/home/TestimonialsSection'), { ssr: false })
const InstagramTemplate = dynamic(() => import('@/components/home/InstagramTemplate'), { ssr: false })
const WhatsAppTemplate = dynamic(() => import('@/components/home/WhatsAppTemplate'), { ssr: false })


export default async function Home() {
  // Fetch new arrivals and featured products for the homepage
  const newArrivals = await fetchNewArrivals(8);
  const featuredProducts = await fetchFeaturedProducts(8);

  return (
    <CustomerLayout>
      {/* Hero Banner */}
      <HeroSection />
      
      {/* Event Concept Designer */}
      <EventConceptDesigner />
      
      {/* Featured Products */}
      <Suspense fallback={
        <div className="py-16 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <FeaturedProducts products={featuredProducts} />
      </Suspense>
      
      {/* New Arrivals */}
      <Suspense fallback={
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <NewArrivals products={newArrivals} />
      </Suspense>

      {/* Happy Customers Section */}
      <HappyCustomers />

      {/* Other below-the-fold sections */}
      <Suspense fallback={null}>
        <TestimonialsSection />
      </Suspense>
      <Suspense fallback={null}>
        <InstagramTemplate />
      </Suspense>
      <Suspense fallback={null}>
        <WhatsAppTemplate />
      </Suspense>
    </CustomerLayout>
  )
}
