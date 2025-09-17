/**
 * MeriDesignHouse Motion System
 * A/B testing integrated motion configurations
 */

import { useMicroMotionTesting } from '@/hooks/useABTesting'

// Base motion configurations
export const MOTION_CONFIG = {
  // Durations (in milliseconds)
  durations: {
    instant: 0,
    fast: 100,
    normal: 200,
    slow: 300,
    slower: 500,
    slowest: 700
  },
  
  // Easing functions
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  
  // Spring configurations
  spring: {
    gentle: { damping: 25, stiffness: 300 },
    wobbly: { damping: 20, stiffness: 300 },
    stiff: { damping: 30, stiffness: 400 },
    slow: { damping: 30, stiffness: 200 },
    bouncy: { damping: 15, stiffness: 400 }
  },
  
  // Stagger configurations
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15,
    slower: 0.2
  }
}

// A/B testing integrated motion utilities
export function getMotionDuration(baseDuration: number, testId?: string): number {
  if (typeof window === 'undefined') return baseDuration
  
  // Use A/B testing hook if available
  try {
    const { getMotionDuration: getTestDuration } = useMicroMotionTesting()
    return getTestDuration(baseDuration)
  } catch {
    // Fallback to base duration if hook is not available
    return baseDuration
  }
}

export function getMotionEasing(easing: keyof typeof MOTION_CONFIG.easing = 'spring'): string {
  return MOTION_CONFIG.easing[easing]
}

export function getSpringConfig(config: keyof typeof MOTION_CONFIG.spring = 'gentle') {
  return MOTION_CONFIG.spring[config]
}

export function getStaggerDelay(delay: keyof typeof MOTION_CONFIG.stagger = 'normal'): number {
  return MOTION_CONFIG.stagger[delay]
}

// Predefined motion variants
export const MOTION_VARIANTS = {
  // Fade animations
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  // Slide animations
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  
  // Scale animations
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  
  scaleIn: {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 }
  },
  
  // Rotate animations
  rotate: {
    hidden: { opacity: 0, rotate: -180 },
    visible: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: 180 }
  },
  
  // Bounce animations
  bounce: {
    hidden: { opacity: 0, y: -50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 400
      }
    },
    exit: { opacity: 0, y: -50 }
  },
  
  // Shimmer animations
  shimmer: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    },
    exit: { opacity: 0, scale: 0.95 }
  }
}

// Transition configurations
export const TRANSITIONS = {
  // Basic transitions
  fast: {
    duration: 0.1,
    ease: 'easeOut'
  },
  
  normal: {
    duration: 0.2,
    ease: 'easeOut'
  },
  
  slow: {
    duration: 0.3,
    ease: 'easeOut'
  },
  
  // Spring transitions
  spring: {
    type: 'spring',
    damping: 25,
    stiffness: 300
  },
  
  springBouncy: {
    type: 'spring',
    damping: 15,
    stiffness: 400
  },
  
  springGentle: {
    type: 'spring',
    damping: 30,
    stiffness: 200
  },
  
  // Stagger transitions
  stagger: {
    staggerChildren: 0.1,
    delayChildren: 0.1
  },
  
  staggerFast: {
    staggerChildren: 0.05,
    delayChildren: 0.05
  },
  
  staggerSlow: {
    staggerChildren: 0.15,
    delayChildren: 0.15
  }
}

// A/B testing integrated motion functions
export function createMotionConfig(
  baseDuration: number = 200,
  easing: keyof typeof MOTION_CONFIG.easing = 'spring',
  testId?: string
) {
  const duration = getMotionDuration(baseDuration, testId)
  
  if (easing === 'spring') {
    return {
      type: 'spring',
      damping: 25,
      stiffness: 300,
      duration: duration / 1000
    }
  }
  
  return {
    duration: duration / 1000,
    ease: getMotionEasing(easing)
  }
}

export function createStaggerConfig(
  staggerDelay: keyof typeof MOTION_CONFIG.stagger = 'normal',
  testId?: string
) {
  const delay = getStaggerDelay(staggerDelay)
  const baseDuration = 200
  const duration = getMotionDuration(baseDuration, testId)
  
  return {
    staggerChildren: delay,
    delayChildren: delay,
    duration: duration / 1000
  }
}

// Performance-optimized motion configurations
export function getOptimizedMotionConfig(
  baseDuration: number = 200,
  reducedMotion: boolean = false
) {
  if (reducedMotion) {
    return {
      duration: 0.1,
      ease: 'easeOut'
    }
  }
  
  const duration = getMotionDuration(baseDuration)
  
  return {
    type: 'spring',
    damping: 25,
    stiffness: 300,
    duration: duration / 1000
  }
}

// Motion presets for common use cases
export const MOTION_PRESETS = {
  // Button interactions
  button: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: createMotionConfig(150, 'spring')
  },
  
  // Card interactions
  card: {
    whileHover: { 
      scale: 1.02,
      y: -2,
      transition: createMotionConfig(200, 'spring')
    },
    whileTap: { scale: 0.98 },
    transition: createMotionConfig(200, 'spring')
  },
  
  // Modal animations
  modal: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: createMotionConfig(300, 'spring')
  },
  
  // Page transitions
  page: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: createMotionConfig(400, 'spring')
  },
  
  // List animations
  list: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: createStaggerConfig('normal')
  },
  
  // Loading animations
  loading: {
    animate: { 
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  }
}

// Utility functions
export function getReducedMotionConfig() {
  return {
    duration: 0.1,
    ease: 'easeOut'
  }
}

export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function getMotionConfig(
  baseDuration: number = 200,
  easing: keyof typeof MOTION_CONFIG.easing = 'spring',
  testId?: string
) {
  const reducedMotion = shouldReduceMotion()
  
  if (reducedMotion) {
    return getReducedMotionConfig()
  }
  
  return createMotionConfig(baseDuration, easing, testId)
}
