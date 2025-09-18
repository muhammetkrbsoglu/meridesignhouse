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
import { LucideIcon } from 'lucide-react'

interface FloatingActionButtonProps {
  icon: LucideIcon
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

const positionClasses = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4'
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

    evaluateViewport()
    window.addEventListener('resize', evaluateViewport, { passive: true })
    return () => window.removeEventListener('resize', evaluateViewport)
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
            'fixed z-50 rounded-full shadow-lg transition-all duration-200',
            'flex items-center justify-center',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
            positionClasses[position],
            sizeClasses[size],
            colorClasses[color],
            glassEffect && getOptimalGlassConfig('floating'),
            'safe-pb', // Safe area padding for mobile
            className
          )}
          onClick={handleClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon className={iconSizes[size]} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// Specialized FAB components
export function CartFAB({ itemCount = 0, onClick }: { itemCount?: number; onClick: () => void }) {
  return (
    <FloatingActionButton
      icon={require('lucide-react').ShoppingCart}
      label="Sepet"
      onClick={onClick}
      position="bottom-right"
      size="md"
      color="primary"
      showOnScroll={true}
      scrollThreshold={200}
    >
      {itemCount > 0 && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </motion.div>
      )}
    </FloatingActionButton>
  )
}

export function SearchFAB({ onClick }: { onClick: () => void }) {
  return (
    <FloatingActionButton
      icon={require('lucide-react').Search}
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
  return (
    <FloatingActionButton
      icon={require('lucide-react').Filter}
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

  return (
    <FloatingActionButton
      icon={require('lucide-react').ArrowUp}
      label="Yukari"
      onClick={scrollToTop}
      position="bottom-right"
      size="sm"
      color="secondary"
      showOnScroll={false}
      className={isVisible ? 'block' : 'hidden'}
    />
  )
}

