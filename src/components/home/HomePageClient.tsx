'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { FeaturedProduct, SimpleProduct } from '@/types/product'
import { HeroSection } from './HeroSection'
const EventConceptDesigner = dynamic(() => import('./EventConceptDesigner').then(m => ({ default: m.EventConceptDesigner })), { ssr: false })
const WeeklyFeaturedSlider = dynamic(() => import('./WeeklyFeaturedSlider').then(m => ({ default: m.WeeklyFeaturedSlider })), { ssr: false })
const NewArrivals = dynamic(() => import('./NewArrivals').then(m => ({ default: m.NewArrivals })), { ssr: false })
const FeaturedProducts = dynamic(() => import('./FeaturedProducts').then(m => ({ default: m.FeaturedProducts })), { ssr: false })
const HappyCustomers = dynamic(() => import('./HappyCustomers'), { ssr: false })
const TestimonialsSection = dynamic(() => import('./TestimonialsSection').then(m => ({ default: m.TestimonialsSection })), { ssr: false })
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
      <WeeklyFeaturedSlider />
      <FeaturedProducts products={featuredProducts} />
      <NewArrivals products={newArrivals} />
      <HappyCustomers />
      <UstaninNotu variant="featured" showStats={true} />
      <CollectionStory variant="timeline" />
      <TestimonialsSection />
    </motion.div>
  )
}


