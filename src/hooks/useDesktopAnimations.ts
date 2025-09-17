/**
 * MeriDesignHouse Desktop Animations Hook
 * Desktop-only hover effects and micro-animations
 */

"use client"

import { useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type ContextLevel = "hero" | "featured" | "minimal"

interface DesktopAnimationConfig {
  scale?: number
  y?: number
  x?: number
  rotate?: number
  duration?: number
  ease?: string | number[]
  disabled?: boolean
  staggerDelay?: number
  contextLevel?: ContextLevel
}

export function useDesktopAnimations() {
  const shouldReduceMotion = useReducedMotion()

  const resolveByContext = (config: DesktopAnimationConfig = {}) => {
    const level = config.contextLevel || "minimal"
    if (level === "hero") {
      return { scale: 1.05, y: -6, duration: 0.35 }
    }
    if (level === "featured") {
      return { scale: 1.03, y: -4, duration: 0.25 }
    }
    return { scale: 1.02, y: -2, duration: 0.2 }
  }

  const createHoverAnimation = useCallback((config: DesktopAnimationConfig = {}) => {
    const {
      scale = resolveByContext(config).scale!,
      y = resolveByContext(config).y!,
      x = 0,
      rotate = 0,
      duration = resolveByContext(config).duration!,
      ease = 'easeOut',
      disabled = false
    } = config

    // Disable animations if reduced motion is preferred or disabled
    if (shouldReduceMotion || disabled) {
      return {
        whileHover: {},
        transition: { duration: 0.1 }
      }
    }

    return {
      whileHover: {
        scale,
        y,
        x,
        rotate,
        transition: { duration, ease }
      },
      transition: { duration, ease }
    }
  }, [shouldReduceMotion])

  const createCardHoverAnimation = useCallback((config: DesktopAnimationConfig = {}) => {
    const {
      scale = resolveByContext(config).scale!,
      y = resolveByContext(config).y!,
      x = 0,
      rotate = 0,
      duration = resolveByContext(config).duration!,
      ease = "easeOut",
      disabled = false
    } = config

    if (shouldReduceMotion || disabled) {
      return {
        whileHover: {},
        whileTap: {},
        transition: { duration: 0.1 }
      }
    }

    return {
      whileHover: {
        scale,
        y,
        x,
        rotate,
        transition: { duration, ease }
      },
      whileTap: {
        scale: 0.98,
        transition: { duration: 0.1 }
      },
      transition: { duration, ease }
    }
  }, [shouldReduceMotion])

  const createButtonHoverAnimation = useCallback((config: DesktopAnimationConfig = {}) => {
    const {
      scale = resolveByContext(config).scale! + 0.01,
      y = Math.max(resolveByContext(config).y! - 1, -1),
      x = 0,
      rotate = 0,
      duration = Math.max(resolveByContext(config).duration! - 0.05, 0.1),
      ease = "easeOut",
      disabled = false
    } = config

    if (shouldReduceMotion || disabled) {
      return {
        whileHover: {},
        whileTap: {},
        transition: { duration: 0.1 }
      }
    }

    return {
      whileHover: {
        scale,
        y,
        x,
        rotate,
        transition: { duration, ease }
      },
      whileTap: {
        scale: 0.95,
        transition: { duration: 0.1 }
      },
      transition: { duration, ease }
    }
  }, [shouldReduceMotion])

  const createFadeInAnimation = useCallback((config: DesktopAnimationConfig = {}) => {
    const {
      duration = 0.6,
      ease = "easeOut",
      disabled = false
    } = config

    if (shouldReduceMotion || disabled) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0.1 }
      }
    }

    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration, ease }
    }
  }, [shouldReduceMotion])

  const createStaggerAnimation = useCallback((index: number, config: DesktopAnimationConfig = {}) => {
    const {
      duration = 0.5,
      ease = "easeOut",
      staggerDelay = 0.1,
      disabled = false
    } = config

    if (shouldReduceMotion || disabled) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0.1 }
      }
    }

    return {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { 
        duration, 
        ease, 
        delay: index * staggerDelay 
      }
    }
  }, [shouldReduceMotion])

  const createParallaxAnimation = useCallback((config: DesktopAnimationConfig = {}) => {
    const {
      y = 50,
      duration = 0.8,
      ease = "easeOut",
      disabled = false
    } = config

    if (shouldReduceMotion || disabled) {
      return {
        initial: { y: 0 },
        animate: { y: 0 },
        transition: { duration: 0.1 }
      }
    }

    return {
      initial: { y: y },
      animate: { y: 0 },
      transition: { duration, ease }
    }
  }, [shouldReduceMotion])

  return {
    createHoverAnimation,
    createCardHoverAnimation,
    createButtonHoverAnimation,
    createFadeInAnimation,
    createStaggerAnimation,
    createParallaxAnimation
  }
}
