import { HeroSection } from '@/components/home/HeroSection'
import { EventConceptDesigner } from '@/components/home/EventConceptDesigner'
import { NewArrivals } from '@/components/home/NewArrivals'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import HappyCustomers from '@/components/home/HappyCustomers'
import { fetchNewArrivals, fetchFeaturedProducts } from '@/lib/actions/products'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Suspense } from 'react'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import InstagramTemplate from '@/components/home/InstagramTemplate'
import WhatsAppTemplate from '@/components/home/WhatsAppTemplate'
import { HomePageClient } from './HomePageClient'


export default async function Home() {
  // Fetch new arrivals and featured products for the homepage
  const newArrivals = await fetchNewArrivals(8);
  const featuredProducts = await fetchFeaturedProducts(8);

  return (
    <CustomerLayout showMobileNav={true} showPullToRefresh={true}>
      <HomePageClient newArrivals={newArrivals} featuredProducts={featuredProducts} />
            </CustomerLayout>
          )
        }
