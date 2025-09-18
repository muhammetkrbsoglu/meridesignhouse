"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getOptimalGlassConfig } from '@/lib/glassmorphism'
import { cn } from '@/lib/utils'

interface StickyCTAProps {
  children: React.ReactNode
  className?: string
  showOnScroll?: boolean
  scrollThreshold?: number
  position?: 'bottom' | 'top'
  glassEffect?: boolean
  haptic?: boolean
}

export function StickyCTA({
  children,
  className,
  showOnScroll = true,
  scrollThreshold = 100,
  position = 'bottom',
  glassEffect = true,
  haptic = true
}: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(!showOnScroll)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (!showOnScroll) return

    const handleScroll = () => {
      const scrolled = window.scrollY > scrollThreshold
      setIsScrolled(scrolled)
      setIsVisible(scrolled)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showOnScroll, scrollThreshold])

  // Don't show on desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null
  }

  const positionClasses = position === 'bottom' 
    ? 'fixed bottom-16 left-0 right-0 z-40 md:hidden'
    : 'fixed top-16 left-0 right-0 z-40 md:hidden'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            damping: 25, 
            stiffness: 300,
            duration: 0.3 
          }}
          className={cn(
            positionClasses,
            glassEffect && getOptimalGlassConfig('bottom-bar'),
            'px-4 py-3 safe-pb',
            className
          )}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Specialized CTA components
interface ProductCTABarProps {
  onAddToCart: () => void
  onAddToFavorites: () => void
  isInCart?: boolean
  isFavorite?: boolean
  price?: string
  disabled?: boolean
}

export function ProductCTABar({
  onAddToCart,
  onAddToFavorites,
  isInCart = false,
  isFavorite = false,
  price,
  disabled = false
}: ProductCTABarProps) {
  return (
    <StickyCTA showOnScroll={true} scrollThreshold={200}>
      <div className="flex items-center gap-3">
        {price && (
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-900">{price}</div>
            <div className="text-xs text-gray-500">KDV dahil</div>
          </div>
        )}
        
        <motion.button
          onClick={onAddToFavorites}
          className={cn(
            'p-3 rounded-full border-2 transition-colors',
            isFavorite 
              ? 'border-red-500 bg-red-50 text-red-500' 
              : 'border-gray-300 bg-white text-gray-500 hover:border-red-500 hover:text-red-500'
          )}
          whileTap={{ scale: 0.95 }}
          disabled={disabled}
        >
          <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </motion.button>

        <motion.button
          onClick={onAddToCart}
          className={cn(
            'flex-1 py-3 px-6 rounded-full font-semibold text-white transition-colors',
            isInCart 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          whileTap={{ scale: 0.98 }}
          disabled={disabled}
        >
          {isInCart ? 'Sepete Eklendi' : 'Sepete Ekle'}
        </motion.button>
      </div>
    </StickyCTA>
  )
}

interface CartCTABarProps {
  total: string
  itemCount: number
  onCheckout: () => void
  disabled?: boolean
}

export function CartCTABar({
  total,
  itemCount,
  onCheckout,
  disabled = false
}: CartCTABarProps) {
  return (
    <StickyCTA showOnScroll={false}>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500">{itemCount} ürün</div>
        </div>
        
        <motion.button
          onClick={onCheckout}
          className={cn(
            'flex-1 py-3 px-6 rounded-full font-semibold text-white transition-colors',
            'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          whileTap={{ scale: 0.98 }}
          disabled={disabled}
        >
          Sipariş Ver
        </motion.button>
      </div>
    </StickyCTA>
  )
}

