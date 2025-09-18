"use client"

import { useState } from 'react'
import { BottomSheet } from '@/components/motion/BottomSheet'
import { FilterFAB, BackToTopFAB } from '@/components/ui/FloatingActionButton'
import { useReducedMotion } from 'framer-motion'

export function ProductsFilterSheetClient({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const openSheet = () => setIsOpen(true)
  const closeSheet = () => setIsOpen(false)

  return (
    <>
      {/* Mobile FABs */}
      <FilterFAB onClick={openSheet} />
      <BackToTopFAB />

      {/* BottomSheet for Filters (mobile-first) */}
      <BottomSheet
        isOpen={isOpen}
        onClose={closeSheet}
        title="Filtreler"
        closeOnOverlayClick
        defaultSnapPoint={0.8}
        snapPoints={[0.5, 0.8, 1.0]}
      >
        <div className="p-4 space-y-4">
          {children}
          {/* Placeholder content - connect existing filter controls here or reuse sidebar on mobile */}
          <div className="text-sm text-gray-600">
            Filtre seçenekleri yakında burada görünecek. Åimdilik sol sütundaki filtreleri kullanabilirsiniz.
          </div>
        </div>
      </BottomSheet>
    </>
  )
}



