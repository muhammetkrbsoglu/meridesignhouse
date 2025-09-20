/**
 * MeriDesignHouse Floating Action Button
 * Mobile-only FAB with haptic feedback and glassmorphism
 */

"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useMicroAnimations } from '@/hooks/useMicroAnimations'
import { getOptimalGlassConfig } from '@/lib/glassmorphism'
import { cn } from '@/lib/utils'
import { LucideIcon, LucideProps } from 'lucide-react'

interface FloatingActionButtonProps {
  icon: LucideIcon | React.ComponentType<LucideProps>
  label: string
  onClick: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  glassEffect?: boolean
  haptic?: boolean
  showOnScroll?: boolean
  scrollThreshold?: number
  className?: string
  disabled?: boolean
}

const getPositionClasses = (position: string, bottomTabBarHeight: number) => {
  const baseClasses = {
    'bottom-right': 'right-4 md:right-4',
    'bottom-left': 'left-4 md:left-4',
    'top-right': 'top-4 right-4 md:top-4 md:right-4',
    'top-left': 'top-4 left-4 md:top-4 md:left-4'
  }

  if (position === 'bottom-right' || position === 'bottom-left') {
    const bottomPadding = bottomTabBarHeight > 0 ? `bottom-[${bottomTabBarHeight + 16}px]` : 'bottom-4'
    const baseClass = baseClasses[position as keyof typeof baseClasses]
    return `${bottomPadding} ${baseClass}`
  }

  return baseClasses[position as keyof typeof baseClasses]
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
  lg: 'w-16 h-16'
}

const colorClasses = {
  primary: 'bg-rose-500 hover:bg-rose-600 text-white',
  secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
  accent: 'bg-blue-500 hover:bg-blue-600 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  error: 'bg-red-500 hover:bg-red-600 text-white'
}

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7'
}

export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  position = 'bottom-right',
  size = 'md',
  color = 'primary',
  glassEffect = true,
  haptic = true,
  showOnScroll = true,
  scrollThreshold = 100,
  className,
  disabled = false
}: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [bottomTabBarHeight, setBottomTabBarHeight] = useState(0)
  const { createButtonAnimation } = useMicroAnimations()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const evaluateViewport = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      if (!showOnScroll) {
        setIsVisible(mobile)
      } else if (!mobile) {
        setIsVisible(false)
      }
    }

    const updateBottomTabBarHeight = () => {
      if (typeof window !== 'undefined') {
        const bottomTabBar = document.querySelector('[data-bottom-tab-bar]') as HTMLElement
        if (bottomTabBar) {
          const height = bottomTabBar.offsetHeight
          setBottomTabBarHeight(height)
        }
      }
    }

    evaluateViewport()
    window.addEventListener('resize', evaluateViewport, { passive: true })

    // Initial check for bottom tab bar height
    updateBottomTabBarHeight()

    // Listen for bottom tab bar height changes
    const observer = new ResizeObserver(updateBottomTabBarHeight)
    const bottomTabBar = document.querySelector('[data-bottom-tab-bar]')
    if (bottomTabBar) {
      observer.observe(bottomTabBar)
    }

    return () => {
      window.removeEventListener('resize', evaluateViewport)
      observer.disconnect()
    }
  }, [showOnScroll])

  useEffect(() => {
    if (!showOnScroll || !isMobile) {
      setIsVisible(isMobile && !showOnScroll)
      return
    }

    const handleScroll = () => {
      const scrolled = window.scrollY > scrollThreshold
      setIsVisible(scrolled)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile, showOnScroll, scrollThreshold])

  if (!hasMounted || !isMobile) {
    return null
  }

  const handleClick = () => {
    if (disabled) return
    onClick()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
          transition={shouldReduceMotion ? { duration: 0.1 } : {
            type: 'spring',
            damping: 20,
            stiffness: 300,
            duration: 0.3
          }}
          {...createButtonAnimation({
            haptic,
            hapticType: 'medium',
            hapticMessage: label
          })}
          className={cn(
            'fixed z-40 rounded-full shadow-lg transition-all duration-200',
            'flex items-center justify-center',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
            getPositionClasses(position, bottomTabBarHeight),
            sizeClasses[size],
            colorClasses[color],
            glassEffect && getOptimalGlassConfig('floating'),
            isMobile && 'safe-pb', // Safe area padding for mobile only
            className
          )}
          onClick={handleClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon
            className={cn(
              iconSizes[size],
              'flex-shrink-0',
              'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' // Perfect centering
            )}
          />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// Specialized FAB components
export function CartFAB({ itemCount = 0, onClick }: { itemCount?: number; onClick: () => void }) {
  // Custom ShoppingCart icon for perfect centering
  const CustomShoppingCart = ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L6 6H3m4 7v6a1 1 0 001 1h10a1 1 0 001-1v-6M9 19a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z"
      />
    </svg>
  )

  return (
    <div className="relative">
      <FloatingActionButton
        icon={CustomShoppingCart}
        label="Sepet"
        onClick={onClick}
        position="bottom-right"
        size="md"
        color="primary"
        showOnScroll={true}
        scrollThreshold={200}
      />
      {itemCount > 0 && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </motion.div>
      )}
    </div>
  )
}

export function SearchFAB({ onClick }: { onClick: () => void }) {
  // Custom Search icon for perfect centering
  const CustomSearch = ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )

  return (
    <FloatingActionButton
      icon={CustomSearch}
      label="Ara"
      onClick={onClick}
      position="bottom-left"
      size="md"
      color="secondary"
      showOnScroll={true}
      scrollThreshold={100}
    />
  )
}

export function FilterFAB({ onClick }: { onClick: () => void }) {
  // Custom Filter icon for perfect centering
  const CustomFilter = ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  )

  return (
    <FloatingActionButton
      icon={CustomFilter}
      label="Filtrele"
      onClick={onClick}
      position="top-right"
      size="sm"
      color="accent"
      showOnScroll={false}
    />
  )
}

export function BackToTopFAB() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Custom ArrowUp icon for perfect centering
  const CustomArrowUp = ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 10l7-7m0 0l7 7m-7-7v18"
      />
    </svg>
  )

  return (
    <FloatingActionButton
      icon={CustomArrowUp}
      label="Yukari"
      onClick={scrollToTop}
      position="bottom-right"
      size="sm"
      color="secondary"
      showOnScroll={false}
      className={cn(
        isVisible ? 'block' : 'hidden',
        'z-[950]' // Higher z-index to appear above bottom tab bar
      )}
    />
  )
}

