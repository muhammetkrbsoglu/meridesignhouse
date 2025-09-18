'use client'

import React, { Suspense } from 'react'
import { PageTransition } from '@/components/motion/PageTransition'
import { PullToRefresh } from '@/components/motion/PullToRefresh'
import { PullRefreshHint } from '@/components/motion/PullRefreshHint'
import { HeroSection } from '@/components/home/HeroSection'
import { EventConceptDesigner } from '@/components/home/EventConceptDesigner'
import { FABCluster } from '@/components/ui/FABCluster'

interface HomePageClientProps {
  children?: React.ReactNode
}

export function HomePageClient({ children }: HomePageClientProps) {
  const handleRefresh = async () => {
    console.log('Refreshing...')
    // Implement your refresh logic here
  }

  return (
    <>
      <PageTransition direction="fade">
        <PullRefreshHint showOnMount delay={600}>
          <PullToRefresh onRefresh={handleRefresh}>
            <HeroSection />
            <EventConceptDesigner />

            <Suspense fallback={<div>Loading products...</div>}>
              {children}
            </Suspense>
          </PullToRefresh>
        </PullRefreshHint>
      </PageTransition>

      {/* Mobile FABs */}
      <FABCluster />
    </>
  )
}


