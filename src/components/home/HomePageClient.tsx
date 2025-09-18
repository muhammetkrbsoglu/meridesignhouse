'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { FeaturedProduct, SimpleProduct } from '@/types/product'
import { HeroSection } from './HeroSection'
const EventConceptDesigner = dynamic(() => import('./EventConceptDesigner').then(m => ({ default: m.EventConceptDesigner })), { ssr: false })
const NewArrivals = dynamic(() => import('./NewArrivals').then(m => ({ default: m.NewArrivals })), { ssr: false })
const FeaturedProducts = dynamic(() => import('./FeaturedProducts').then(m => ({ default: m.FeaturedProducts })), { ssr: false })
const HappyCustomers = dynamic(() => import('./HappyCustomers'), { ssr: false })
const TestimonialsSection = dynamic(() => import('./TestimonialsSection').then(m => ({ default: m.TestimonialsSection })), { ssr: false })
import InstagramTemplate from './InstagramTemplate'
import WhatsAppTemplate from './WhatsAppTemplate'
import { UstaninNotu } from '@/components/brand/UstaninNotu'
const CollectionStory = dynamic(() => import('@/components/brand/CollectionStory').then(m => ({ default: m.CollectionStory })), { ssr: false })

interface HomePageClientProps {
  newArrivals: SimpleProduct[]
  featuredProducts: FeaturedProduct[]
}

export function HomePageClient({ newArrivals, featuredProducts }: HomePageClientProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <HeroSection />
      <EventConceptDesigner />
      <FeaturedProducts products={featuredProducts} />
      <NewArrivals products={newArrivals} />
      <HappyCustomers />
      <UstaninNotu variant="featured" showStats={true} />
      <CollectionStory variant="timeline" />
      <TestimonialsSection />
      <InstagramTemplate
        screenshotUrl="/placeholder-product.jpg"
        customerName="Musteri"
        altText="Instagram mesaj ekran goruntusu"
      />
      <WhatsAppTemplate
        screenshotUrl="/placeholder-product.jpg"
        customerName="Musteri"
        altText="WhatsApp mesaj ekran goruntusu"
      />
    </motion.div>
  )
}


