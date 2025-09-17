'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { FilterSheetHint } from '@/components/motion/GestureHint'

const CartFAB = dynamic(() => import('@/components/ui/FloatingActionButton').then(m => m.CartFAB), { ssr: false })
const ProductsFilterSheetClient = dynamic(() => import('@/components/products/ProductsFilterSheetClient').then(m => m.ProductsFilterSheetClient), { ssr: false })
const BottomSheet = dynamic(() => import('@/components/motion/BottomSheet').then(m => m.BottomSheet), { ssr: false })

export function ProductsPageClient() {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  return (
    <>
      <FilterSheetHint showOnMount delay={800}>
        {/* Mobile FABs */}
        <CartFAB itemCount={0} onClick={() => window.location.href = '/cart'} />
        <ProductsFilterSheetClient />
        
        {/* Filter Bottom Sheet (Mobile Only) */}
        <BottomSheet
          isOpen={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          title="Filtreler"
          snapPoints={[0.6, 0.9]}
          defaultSnapPoint={0.9}
          className="md:hidden" // Mobile only
        >
          <ProductsFilterSheetClient
            onClose={() => setIsFilterSheetOpen(false)}
          />
        </BottomSheet>
      </FilterSheetHint>
    </>
  )
}
