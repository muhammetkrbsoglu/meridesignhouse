'use client'

import React from 'react'
import { CartFAB, SearchFAB } from '@/components/ui/FloatingActionButton'

interface FABClusterProps {
  cartCount?: number
}

export function FABCluster({ cartCount = 0 }: FABClusterProps) {
  return (
    <>
      <CartFAB itemCount={cartCount} onClick={() => (window.location.href = '/cart')} />
      <SearchFAB onClick={() => (window.location.href = '/search')} />
    </>
  )
}


