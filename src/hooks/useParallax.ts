/**
 * MeriDesignHouse Parallax Hook
 * Subtle parallax effects for hero sections and banners
 */

"use client"

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

interface ParallaxConfig {
  speed?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  disabled?: boolean
  mobileDisabled?: boolean
}

export function useParallax(config: ParallaxConfig = {}) {
  const {
    speed = 0.3,
    direction = 'up',
    disabled = false,
    mobileDisabled = true
  } = config

  const elementRef = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (disabled || shouldReduceMotion) return

    // Disable on mobile if configured
    if (mobileDisabled && typeof window !== 'undefined' && window.innerWidth < 768) return

    const handleScroll = () => {
      if (!elementRef.current) return

      const rect = elementRef.current.getBoundingClientRect()
      const scrolled = window.pageYOffset
      const rate = scrolled * -speed

      let newOffset = 0
      switch (direction) {
        case 'up':
          newOffset = rate
          break
        case 'down':
          newOffset = -rate
          break
        case 'left':
          newOffset = rate
          break
        case 'right':
          newOffset = -rate
          break
      }

      setOffset(newOffset)
    }

    // Initial calculation
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, direction, disabled, mobileDisabled, shouldReduceMotion])

  const getTransform = () => {
    if (disabled || shouldReduceMotion) return 'translate3d(0, 0, 0)'
    
    switch (direction) {
      case 'up':
      case 'down':
        return `translate3d(0, ${offset}px, 0)`
      case 'left':
      case 'right':
        return `translate3d(${offset}px, 0, 0)`
      default:
        return 'translate3d(0, 0, 0)'
    }
  }

  return {
    ref: elementRef,
    style: {
      transform: getTransform(),
      willChange: 'transform'
    }
  }
}

// Specialized parallax hooks
export function useHeroParallax() {
  return useParallax({
    speed: 0.3,
    direction: 'up',
    mobileDisabled: true
  })
}

export function useBannerParallax() {
  return useParallax({
    speed: 0.2,
    direction: 'up',
    mobileDisabled: true
  })
}

export function useCardParallax() {
  return useParallax({
    speed: 0.1,
    direction: 'up',
    mobileDisabled: true
  })
}
