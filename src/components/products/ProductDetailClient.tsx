'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ProductCTABar } from '@/components/motion/StickyCTA'

const CartFAB = dynamic(() => import('@/components/ui/FloatingActionButton').then(m => m.CartFAB), { ssr: false })
const BackToTopFAB = dynamic(() => import('@/components/ui/FloatingActionButton').then(m => m.BackToTopFAB), { ssr: false })

interface ProductDetailClientProps {
  product: any
  relatedProducts: any[]
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const [isInCart, setIsInCart] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <>
      {/* Mobile Sticky CTA */}
      <ProductCTABar
        onAddToCart={() => {
          // This will be handled by ProductDetail component
          const addToCartBtn = document.querySelector('[data-add-to-cart]') as HTMLButtonElement;
          if (addToCartBtn) addToCartBtn.click();
        }}
        onAddToFavorites={() => {
          // This will be handled by ProductDetail component
          const favoriteBtn = document.querySelector('[data-favorite-btn]') as HTMLButtonElement;
          if (favoriteBtn) favoriteBtn.click();
        }}
        price={`${product.price.toLocaleString('tr-TR')} ₺`}
        isInCart={isInCart}
        isFavorite={isFavorite}
      />

      {/* Mobile FABs */}
      <CartFAB itemCount={0} onClick={() => window.location.href = '/cart'} />
      <BackToTopFAB />
    </>
  )
}
