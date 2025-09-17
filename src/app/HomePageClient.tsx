'use client'

import React, { Suspense } from 'react'
import { PageTransition } from '@/components/motion/PageTransition'
import { PullToRefresh } from '@/components/motion/PullToRefresh'
import { PullRefreshHint } from '@/components/motion/GestureHint'
import { HeroSection } from '@/components/home/HeroSection'
import { EventConceptDesigner } from '@/components/home/EventConceptDesigner'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { NewArrivals } from '@/components/home/NewArrivals'
import HappyCustomers from '@/components/home/HappyCustomers'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import InstagramTemplate from '@/components/home/InstagramTemplate'
import WhatsAppTemplate from '@/components/home/WhatsAppTemplate'
import { FABCluster } from '@/components/ui/FABCluster'

interface HomePageClientProps {
  newArrivals: any[]
  featuredProducts: any[]
}

export function HomePageClient({ newArrivals, featuredProducts }: HomePageClientProps) {
  const handleRefresh = async () => {
    window.location.reload()
  }

  return (
    <>
      <PageTransition direction="fade">
        <PullRefreshHint showOnMount delay={600}>
          <PullToRefresh onRefresh={handleRefresh}>
            <HeroSection />
            <EventConceptDesigner />

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

            <HappyCustomers />
            <Suspense fallback={null}>
              <TestimonialsSection />
            </Suspense>
            <Suspense fallback={null}>
              <InstagramTemplate />
            </Suspense>
            <Suspense fallback={null}>
              <WhatsAppTemplate />
            </Suspense>
          </PullToRefresh>
        </PullRefreshHint>
      </PageTransition>

      {/* Mobile FABs */}
      <FABCluster cartCount={0} />
    </>
  )
}


