"use client"

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
  children: ReactNode
  className?: string
  direction?: 'left' | 'right' | 'up' | 'down' | 'fade'
  duration?: number
  enabled?: boolean
}

const transitionVariants = {
  left: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  right: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
  },
  up: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 }
  },
  down: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 }
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }
}

export function PageTransition({
  children,
  className,
  direction = 'fade',
  duration = 0.3,
  enabled = true
}: PageTransitionProps) {
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Don't apply transitions on desktop or if reduced motion is preferred
  if (!isMobile || shouldReduceMotion || !enabled) {
    return <div className={cn('w-full motion-safe:transition-opacity motion-safe:duration-300', className)}>{children}</div>
  }

  const variants = transitionVariants[direction]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={cn('w-full', className)}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: shouldReduceMotion ? 0.1 : duration,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Specialized page transitions
export function ProductPageTransition({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <PageTransition 
      direction="left" 
      duration={0.4}
      className={className}
    >
      {children}
    </PageTransition>
  )
}

export function CartPageTransition({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <PageTransition 
      direction="up" 
      duration={0.3}
      className={className}
    >
      {children}
    </PageTransition>
  )
}

export function CheckoutPageTransition({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <PageTransition 
      direction="right" 
      duration={0.4}
      className={className}
    >
      {children}
    </PageTransition>
  )
}

// Hook for page transition direction
export function usePageTransitionDirection() {
  const pathname = usePathname()
  
  // Determine transition direction based on route
  const getDirection = (path: string) => {
    if (path.includes('/products/')) return 'left'
    if (path.includes('/cart')) return 'up'
    if (path.includes('/checkout')) return 'right'
    if (path.includes('/favorites')) return 'up'
    if (path.includes('/orders')) return 'up'
    return 'fade'
  }

  return getDirection(pathname)
}