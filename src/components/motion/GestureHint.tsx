'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, ArrowDown, Search, Settings, Sparkles, Image, ShoppingCart } from 'lucide-react'
import { useGestureHint } from '@/contexts/GestureHintContext'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { cn } from '@/lib/utils'

interface GestureHintProps {
  gestureType: 'swipe-back' | 'swipe-card' | 'pull-refresh' | 'search-sheet' | 'filter-sheet' | 'bundle-wizard' | 'product-gallery' | 'cart-swipe'
  children: React.ReactNode
  delay?: number
  className?: string
  position?: 'top' | 'bottom' | 'center' | 'left' | 'right'
  showOnMount?: boolean
  showOnInteraction?: boolean
  triggerElement?: React.RefObject<HTMLElement>
}

const gestureIcons = {
  'swipe-back': ArrowLeft,
  'swipe-card': ArrowRight,
  'pull-refresh': ArrowDown,
  'search-sheet': Search,
  'filter-sheet': Settings,
  'bundle-wizard': Sparkles,
  'product-gallery': Image,
  'cart-swipe': ShoppingCart
}

const positionClasses = {
  top: 'top-4 left-1/2 transform -translate-x-1/2',
  bottom: 'bottom-4 left-1/2 transform -translate-x-1/2',
  center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  left: 'top-1/2 left-4 transform -translate-y-1/2',
  right: 'top-1/2 right-4 transform -translate-y-1/2'
}

export function GestureHint({
  gestureType,
  children,
  delay = 0,
  className,
  position,
  showOnMount = false,
  showOnInteraction = false,
  triggerElement
}: GestureHintProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const { showHint, hideHint, isHintShown, markHintAsShown, getHintConfig } = useGestureHint()
  const { light, medium } = useHapticFeedback()
  const shouldReduceMotion = useReducedMotion()

  const hintConfig = getHintConfig(gestureType)
  const IconComponent = gestureIcons[gestureType]

  // Show hint on mount if configured
  useEffect(() => {
    if (!showOnMount || !hintConfig) return

    const timer = setTimeout(() => {
      if (!isHintShown(gestureType)) {
        // Mobile-only guard at component level
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          showHint(gestureType)
          setIsVisible(true)
        }
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [showOnMount, delay, gestureType, hintConfig, isHintShown, showHint])

  // Show hint on interaction if configured
  useEffect(() => {
    if (!showOnInteraction || !triggerElement?.current || !hintConfig) return

    const element = triggerElement.current
    const handleInteraction = () => {
      if (!isHintShown(gestureType)) {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          showHint(gestureType)
          setIsVisible(true)
        }
      }
    }

    element.addEventListener('click', handleInteraction)
    element.addEventListener('touchstart', handleInteraction)

    return () => {
      element.removeEventListener('click', handleInteraction)
      element.removeEventListener('touchstart', handleInteraction)
    }
  }, [showOnInteraction, triggerElement, gestureType, hintConfig, isHintShown, showHint])

  // Auto-hide after duration
  useEffect(() => {
    if (!isVisible || !hintConfig) return

    const timer = setTimeout(() => {
      setIsVisible(false)
      markHintAsShown(gestureType)
    }, hintConfig.duration)

    return () => clearTimeout(timer)
  }, [isVisible, gestureType, hintConfig, markHintAsShown])

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
    hideHint(gestureType)
    markHintAsShown(gestureType)
    medium('Gesture hint kapatıldı')
  }

  const handleShow = () => {
    if (!isHintShown(gestureType)) {
      setIsVisible(true)
      showHint(gestureType)
      light('Gesture hint gösterildi')
    }
  }

  if (!hintConfig || isDismissed) {
    return <>{children}</>
  }

  const finalPosition = position || hintConfig.position

  return (
    <>
      {children}
      
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: shouldReduceMotion ? 0.1 : 0.3, ease: 'easeOut' }}
            className={cn(
              'fixed z-[9999] pointer-events-none',
              positionClasses[finalPosition],
              className
            )}
          >
            {!shouldReduceMotion && (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.2, repeat: 1, ease: 'easeInOut' }}
              >
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-xs pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ 
                      x: finalPosition === 'left' ? [-2, 2, -2] : 
                         finalPosition === 'right' ? [2, -2, 2] :
                         finalPosition === 'top' ? [0, 0, 0] :
                         finalPosition === 'bottom' ? [0, 0, 0] : [0, 0, 0],
                      y: finalPosition === 'top' ? [-2, 2, -2] :
                         finalPosition === 'bottom' ? [2, -2, 2] : [0, 0, 0]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      ease: 'easeInOut' 
                    }}
                    className="p-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full text-white"
                  >
                    <IconComponent className="w-4 h-4" />
                  </motion.div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {hintConfig.title}
                  </span>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Gesture hint'i kapat"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {hintConfig.description}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-3 py-1.5 bg-rose-500 text-white text-xs font-medium rounded-md hover:bg-rose-600 transition-colors"
                >
                  Anladım
                </button>
                <button
                  onClick={handleShow}
                  className="px-3 py-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Tekrar Göster
                </button>
              </div>

              {/* Arrow pointing to target */}
              {finalPosition !== 'center' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    'absolute w-0 h-0 border-4 border-transparent',
                    finalPosition === 'top' && 'top-full left-1/2 transform -translate-x-1/2 border-t-white dark:border-t-gray-800',
                    finalPosition === 'bottom' && 'bottom-full left-1/2 transform -translate-x-1/2 border-b-white dark:border-b-gray-800',
                    finalPosition === 'left' && 'left-full top-1/2 transform -translate-y-1/2 border-l-white dark:border-l-gray-800',
                    finalPosition === 'right' && 'right-full top-1/2 transform -translate-y-1/2 border-r-white dark:border-r-gray-800'
                  )}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Specialized gesture hint components
export function SwipeBackHint({ children, ...props }: Omit<GestureHintProps, 'gestureType'>) {
  return <GestureHint gestureType="swipe-back" {...props}>{children}</GestureHint>
}

export function SwipeCardHint({ children, ...props }: Omit<GestureHintProps, 'gestureType'>) {
  return <GestureHint gestureType="swipe-card" {...props}>{children}</GestureHint>
}

export function PullRefreshHint({ children, ...props }: Omit<GestureHintProps, 'gestureType'>) {
  return <GestureHint gestureType="pull-refresh" {...props}>{children}</GestureHint>
}

export function SearchSheetHint({ children, ...props }: Omit<GestureHintProps, 'gestureType'>) {
  return <GestureHint gestureType="search-sheet" {...props}>{children}</GestureHint>
}

export function FilterSheetHint({ children, ...props }: Omit<GestureHintProps, 'gestureType'>) {
  return <GestureHint gestureType="filter-sheet" {...props}>{children}</GestureHint>
}

export function BundleWizardHint({ children, ...props }: Omit<GestureHintProps, 'gestureType'>) {
  return <GestureHint gestureType="bundle-wizard" {...props}>{children}</GestureHint>
}

export function ProductGalleryHint({ children, ...props }: Omit<GestureHintProps, 'gestureType'>) {
  return <GestureHint gestureType="product-gallery" {...props}>{children}</GestureHint>
}

export function CartSwipeHint({ children, ...props }: Omit<GestureHintProps, 'gestureType'>) {
  return <GestureHint gestureType="cart-swipe" {...props}>{children}</GestureHint>
}
