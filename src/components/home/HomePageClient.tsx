'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
const PullToRefresh = dynamic(() => import('@/components/motion/PullToRefresh').then(m => ({ default: m.PullToRefresh })), { ssr: false })
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
// import { PullRefreshHint } from '@/components/motion/GestureHint'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { usePerformanceMeasurement } from '@/hooks/usePerformanceMeasurement'

interface HomePageClientProps {
  newArrivals: any[]
  featuredProducts: any[]
}

export function HomePageClient({ newArrivals, featuredProducts }: HomePageClientProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { success, error } = useHapticFeedback()
  const { measureAsync } = usePerformanceMeasurement('HomePageClient')

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    
    try {
      await measureAsync('home-refresh', async () => {
        // Simulate refresh delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // In a real app, you would refetch data here
        // For now, we'll just update the refresh key to trigger re-renders
        setRefreshKey(prev => prev + 1)
        
        // Simulate potential errors (5% chance)
        if (Math.random() < 0.05) {
          throw new Error('Refresh failed')
        }
      })
      
      success('Ana sayfa yenilendi')
    } catch (err) {
      error('Yenileme sırasında hata oluştu')
      console.error('Home refresh error:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, measureAsync, success, error])

  return (
    <motion.div
      key={refreshKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Banner */}
      <HeroSection />

      {/* Event Concept Designer */}
      <EventConceptDesigner />

      {/* Featured Products */}
      <FeaturedProducts products={featuredProducts} />

      {/* New Arrivals */}
      <NewArrivals products={newArrivals} />

      {/* Happy Customers Section */}
      <HappyCustomers />

      {/* Brand Story Modules */}
      <UstaninNotu variant="featured" showStats={true} />
      
      <CollectionStory variant="timeline" />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Instagram Template */}
      <InstagramTemplate 
        screenshotUrl="/placeholder-product.jpg" 
        customerName="Müşteri" 
        altText="Instagram mesaj ekran görüntüsü"
      />

      {/* WhatsApp Template */}
      <WhatsAppTemplate 
        screenshotUrl="/placeholder-product.jpg" 
        customerName="Müşteri" 
        altText="WhatsApp mesaj ekran görüntüsü"
      />
    </motion.div>
  )
}
