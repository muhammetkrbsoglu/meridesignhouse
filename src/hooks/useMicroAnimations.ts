"use client"

import { useHapticFeedback } from './useHapticFeedback'
import { motion, useReducedMotion } from 'framer-motion'

interface MicroAnimationConfig {
  haptic?: boolean
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
  hapticMessage?: string
  scale?: number
  duration?: number
  disabled?: boolean
}

export function useMicroAnimations() {
  const { light, medium, heavy, success, warning, error } = useHapticFeedback()
  const shouldReduceMotion = useReducedMotion()

  const getHapticFunction = (type: string) => {
    switch (type) {
      case 'light': return light
      case 'medium': return medium
      case 'heavy': return heavy
      case 'success': return success
      case 'warning': return warning
      case 'error': return error
      default: return light
    }
  }

  const createTapAnimation = (config: MicroAnimationConfig = {}) => {
    const {
      haptic = true,
      hapticType = 'light',
      hapticMessage,
      scale = 0.98,
      duration = 0.1,
      disabled = false
    } = config

    // Disable animations if reduced motion is preferred
    if (shouldReduceMotion) {
      return {
        whileTap: {},
        onClick: () => {
          if (disabled) return
          if (haptic) {
            const hapticFn = getHapticFunction(hapticType)
            hapticFn(hapticMessage)
          }
        }
      }
    }

    return {
      whileTap: disabled ? {} : { 
        scale,
        transition: { duration }
      },
      onClick: () => {
        if (disabled) return
        if (haptic) {
          const hapticFn = getHapticFunction(hapticType)
          hapticFn(hapticMessage)
        }
      }
    }
  }

  const createHoverAnimation = (config: MicroAnimationConfig = {}) => {
    const {
      haptic = false,
      hapticType = 'light',
      hapticMessage,
      scale = 1.02,
      duration = 0.2,
      disabled = false
    } = config

    // Disable animations if reduced motion is preferred
    if (shouldReduceMotion) {
      return {
        whileHover: {},
        onHoverStart: () => {
          if (disabled || !haptic) return
          const hapticFn = getHapticFunction(hapticType)
          hapticFn(hapticMessage)
        }
      }
    }

    return {
      whileHover: disabled ? {} : { 
        scale,
        transition: { duration }
      },
      onHoverStart: () => {
        if (disabled || !haptic) return
        const hapticFn = getHapticFunction(hapticType)
        hapticFn(hapticMessage)
      }
    }
  }

  const createPressAnimation = (config: MicroAnimationConfig = {}) => {
    const {
      haptic = true,
      hapticType = 'medium',
      hapticMessage,
      scale = 0.95,
      duration = 0.15,
      disabled = false
    } = config

    return {
      whileTap: disabled ? {} : { 
        scale,
        transition: { duration }
      },
      onTap: () => {
        if (disabled) return
        if (haptic) {
          const hapticFn = getHapticFunction(hapticType)
          hapticFn(hapticMessage)
        }
      }
    }
  }

  const createCardAnimation = (config: MicroAnimationConfig = {}) => {
    const {
      haptic = true,
      hapticType = 'light',
      hapticMessage,
      scale = 1.02,
      y = -2,
      duration = 0.2,
      disabled = false
    } = config

    // Disable animations if reduced motion is preferred
    if (shouldReduceMotion) {
      return {
        whileHover: {},
        whileTap: {},
        onClick: () => {
          if (disabled) return
          if (haptic) {
            const hapticFn = getHapticFunction(hapticType)
            hapticFn(hapticMessage)
          }
        }
      }
    }

    return {
      whileHover: disabled ? {} : { 
        scale,
        y,
        transition: { duration }
      },
      whileTap: disabled ? {} : { 
        scale: 0.98,
        transition: { duration: 0.1 }
      },
      onClick: () => {
        if (disabled) return
        if (haptic) {
          const hapticFn = getHapticFunction(hapticType)
          hapticFn(hapticMessage)
        }
      }
    }
  }

  const createButtonAnimation = (config: MicroAnimationConfig = {}) => {
    const {
      haptic = true,
      hapticType = 'light',
      hapticMessage,
      scale = 0.98,
      duration = 0.1,
      disabled = false
    } = config

    return {
      whileTap: disabled ? {} : { 
        scale,
        transition: { duration }
      },
      whileHover: disabled ? {} : { 
        scale: 1.02,
        transition: { duration: 0.2 }
      },
      onClick: () => {
        if (disabled) return
        if (haptic) {
          const hapticFn = getHapticFunction(hapticType)
          hapticFn(hapticMessage)
        }
      }
    }
  }

  const createListAnimation = (index: number, config: MicroAnimationConfig = {}) => {
    const {
      haptic = false,
      hapticType = 'light',
      hapticMessage,
      scale = 0.98,
      duration = 0.1,
      disabled = false
    } = config

    return {
      initial: { opacity: 0, y: 20 },
      animate: { 
        opacity: 1, 
        y: 0,
        transition: { 
          delay: index * 0.1,
          duration: 0.3
        }
      },
      whileTap: disabled ? {} : { 
        scale,
        transition: { duration }
      },
      onClick: () => {
        if (disabled) return
        if (haptic) {
          const hapticFn = getHapticFunction(hapticType)
          hapticFn(hapticMessage)
        }
      }
    }
  }

  return {
    createTapAnimation,
    createHoverAnimation,
    createPressAnimation,
    createCardAnimation,
    createButtonAnimation,
    createListAnimation
  }
}

// Predefined animation presets
export const ANIMATION_PRESETS = {
  // Button animations
  primaryButton: {
    whileTap: { scale: 0.98 },
    whileHover: { scale: 1.02 },
    transition: { duration: 0.2 }
  },
  
  secondaryButton: {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.01 },
    transition: { duration: 0.15 }
  },
  
  // Card animations
  productCard: {
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 }
  },
  
  // List item animations
  listItem: {
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 }
  },
  
  // Modal animations
  modal: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3 }
  }
}
