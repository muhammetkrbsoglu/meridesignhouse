/**
 * MeriDesignHouse Glassmorphism Utilities
 * Premium glass effects with performance optimization
 */

import { cn } from '@/lib/utils'

export type GlassVariant = 'navbar' | 'bottom-bar' | 'modal' | 'card' | 'floating'
export type GlassIntensity = 'subtle' | 'medium' | 'strong'
export type GlassTheme = 'light' | 'dark' | 'auto'

interface GlassConfig {
  variant: GlassVariant
  intensity: GlassIntensity
  theme: GlassTheme
  hover?: boolean
  motion?: boolean
  reducedMotion?: boolean
}

const glassConfigs = {
  navbar: {
    subtle: {
      opacity: 'bg-white/60 dark:bg-gray-900/60',
      blur: 'backdrop-blur-md',
      border: 'border-white/20 dark:border-gray-700/20',
      shadow: 'shadow-lg shadow-black/5 dark:shadow-black/20'
    },
    medium: {
      opacity: 'bg-white/70 dark:bg-gray-900/70',
      blur: 'backdrop-blur-lg',
      border: 'border-white/30 dark:border-gray-700/30',
      shadow: 'shadow-xl shadow-black/10 dark:shadow-black/30'
    },
    strong: {
      opacity: 'bg-white/80 dark:bg-gray-900/80',
      blur: 'backdrop-blur-xl',
      border: 'border-white/40 dark:border-gray-700/40',
      shadow: 'shadow-2xl shadow-black/15 dark:shadow-black/40'
    }
  },
  'bottom-bar': {
    subtle: {
      opacity: 'bg-white/50 dark:bg-gray-900/50',
      blur: 'backdrop-blur-sm',
      border: 'border-white/15 dark:border-gray-700/15',
      shadow: 'shadow-lg shadow-black/5 dark:shadow-black/20'
    },
    medium: {
      opacity: 'bg-white/60 dark:bg-gray-900/60',
      blur: 'backdrop-blur-md',
      border: 'border-white/25 dark:border-gray-700/25',
      shadow: 'shadow-xl shadow-black/10 dark:shadow-black/30'
    },
    strong: {
      opacity: 'bg-white/70 dark:bg-gray-900/70',
      blur: 'backdrop-blur-lg',
      border: 'border-white/35 dark:border-gray-700/35',
      shadow: 'shadow-2xl shadow-black/15 dark:shadow-black/40'
    }
  },
  modal: {
    subtle: {
      opacity: 'bg-white/40 dark:bg-gray-900/40',
      blur: 'backdrop-blur-sm',
      border: 'border-white/10 dark:border-gray-700/10',
      shadow: 'shadow-md shadow-black/5 dark:shadow-black/15'
    },
    medium: {
      opacity: 'bg-white/50 dark:bg-gray-900/50',
      blur: 'backdrop-blur-md',
      border: 'border-white/20 dark:border-gray-700/20',
      shadow: 'shadow-lg shadow-black/10 dark:shadow-black/25'
    },
    strong: {
      opacity: 'bg-white/60 dark:bg-gray-900/60',
      blur: 'backdrop-blur-lg',
      border: 'border-white/30 dark:border-gray-700/30',
      shadow: 'shadow-xl shadow-black/15 dark:shadow-black/35'
    }
  },
  card: {
    subtle: {
      opacity: 'bg-white/30 dark:bg-gray-900/30',
      blur: 'backdrop-blur-sm',
      border: 'border-white/5 dark:border-gray-700/5',
      shadow: 'shadow-sm shadow-black/5 dark:shadow-black/10'
    },
    medium: {
      opacity: 'bg-white/40 dark:bg-gray-900/40',
      blur: 'backdrop-blur-md',
      border: 'border-white/15 dark:border-gray-700/15',
      shadow: 'shadow-md shadow-black/10 dark:shadow-black/20'
    },
    strong: {
      opacity: 'bg-white/50 dark:bg-gray-900/50',
      blur: 'backdrop-blur-lg',
      border: 'border-white/25 dark:border-gray-700/25',
      shadow: 'shadow-lg shadow-black/15 dark:shadow-black/30'
    }
  },
  floating: {
    subtle: {
      opacity: 'bg-white/20 dark:bg-gray-900/20',
      blur: 'backdrop-blur-xs',
      border: 'border-white/5 dark:border-gray-700/5',
      shadow: 'shadow-sm shadow-black/5 dark:shadow-black/10'
    },
    medium: {
      opacity: 'bg-white/30 dark:bg-gray-900/30',
      blur: 'backdrop-blur-sm',
      border: 'border-white/10 dark:border-gray-700/10',
      shadow: 'shadow-md shadow-black/10 dark:shadow-black/20'
    },
    strong: {
      opacity: 'bg-white/40 dark:bg-gray-900/40',
      blur: 'backdrop-blur-md',
      border: 'border-white/20 dark:border-gray-700/20',
      shadow: 'shadow-lg shadow-black/15 dark:shadow-black/30'
    }
  }
}

const hoverEffects = {
  subtle: 'hover:bg-white/70 dark:hover:bg-gray-900/70 hover:backdrop-blur-lg',
  medium: 'hover:bg-white/80 dark:hover:bg-gray-900/80 hover:backdrop-blur-xl',
  strong: 'hover:bg-white/90 dark:hover:bg-gray-900/90 hover:backdrop-blur-2xl'
}

const motionEffects = {
  subtle: 'transition-all duration-200 ease-out',
  medium: 'transition-all duration-300 ease-out',
  strong: 'transition-all duration-400 ease-out'
}

const reducedMotionEffects = {
  subtle: 'transition-opacity duration-200 ease-out',
  medium: 'transition-opacity duration-300 ease-out',
  strong: 'transition-opacity duration-400 ease-out'
}

export function getGlassClasses(config: GlassConfig): string {
  const { variant, intensity, theme, hover = false, motion = true, reducedMotion = false } = config
  
  const baseConfig = glassConfigs[variant][intensity]
  const hoverEffect = hover ? hoverEffects[intensity] : ''
  const motionEffect = motion 
    ? (reducedMotion ? reducedMotionEffects[intensity] : motionEffects[intensity])
    : ''

  return cn(
    baseConfig.opacity,
    baseConfig.blur,
    baseConfig.border,
    baseConfig.shadow,
    hoverEffect,
    motionEffect
  )
}

// Convenience functions for common glass effects
export const glass = {
  navbar: (intensity: GlassIntensity = 'medium', options?: Partial<GlassConfig>) => 
    getGlassClasses({ variant: 'navbar', intensity, theme: 'auto', ...options }),
  
  bottomBar: (intensity: GlassIntensity = 'medium', options?: Partial<GlassConfig>) => 
    getGlassClasses({ variant: 'bottom-bar', intensity, theme: 'auto', ...options }),
  
  modal: (intensity: GlassIntensity = 'medium', options?: Partial<GlassConfig>) => 
    getGlassClasses({ variant: 'modal', intensity, theme: 'auto', ...options }),
  
  card: (intensity: GlassIntensity = 'subtle', options?: Partial<GlassConfig>) => 
    getGlassClasses({ variant: 'card', intensity, theme: 'auto', ...options }),
  
  floating: (intensity: GlassIntensity = 'subtle', options?: Partial<GlassConfig>) => 
    getGlassClasses({ variant: 'floating', intensity, theme: 'auto', ...options })
}

// Performance-optimized glass effects
export const glassOptimized = {
  // For low-end devices - opacity only
  navbar: (theme: GlassTheme = 'auto') => 
    cn(
      'bg-white/60 dark:bg-gray-900/60',
      'border-white/20 dark:border-gray-700/20',
      'shadow-lg shadow-black/5 dark:shadow-black/20',
      'transition-opacity duration-200'
    ),
  
  bottomBar: (theme: GlassTheme = 'auto') => 
    cn(
      'bg-white/50 dark:bg-gray-900/50',
      'border-white/15 dark:border-gray-700/15',
      'shadow-lg shadow-black/5 dark:shadow-black/20',
      'transition-opacity duration-200'
    ),
  
  // For high-end devices - full glass effect
  navbarFull: (theme: GlassTheme = 'auto') => 
    cn(
      'bg-white/70 dark:bg-gray-900/70',
      'backdrop-blur-lg',
      'border-white/30 dark:border-gray-700/30',
      'shadow-xl shadow-black/10 dark:shadow-black/30',
      'hover:bg-white/80 dark:hover:bg-gray-900/80',
      'hover:backdrop-blur-xl',
      'transition-all duration-300 ease-out'
    ),
  
  bottomBarFull: (theme: GlassTheme = 'auto') => 
    cn(
      'bg-white/60 dark:bg-gray-900/60',
      'backdrop-blur-md',
      'border-white/25 dark:border-gray-700/25',
      'shadow-xl shadow-black/10 dark:shadow-black/30',
      'hover:bg-white/70 dark:hover:bg-gray-900/70',
      'hover:backdrop-blur-lg',
      'transition-all duration-300 ease-out'
    )
}

// Glass effect with brand accent
export const glassBranded = {
  navbar: (accent: 'rose' | 'pink' | 'purple' = 'rose') => 
    cn(
      glass.navbar('medium', { hover: true, motion: true }),
      `hover:shadow-${accent}-500/10 dark:hover:shadow-${accent}-500/20`,
      `hover:border-${accent}-200/30 dark:hover:border-${accent}-700/30`
    ),
  
  bottomBar: (accent: 'rose' | 'pink' | 'purple' = 'rose') => 
    cn(
      glass.bottomBar('medium', { hover: true, motion: true }),
      `hover:shadow-${accent}-500/10 dark:hover:shadow-${accent}-500/20`,
      `hover:border-${accent}-200/30 dark:hover:border-${accent}-700/30`
    )
}

// Utility to detect device performance
export function getGlassIntensity(): GlassIntensity {
  if (typeof window === 'undefined') return 'medium'
  
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'subtle'
  }
  
  // Check for low-end device indicators
  const isLowEnd = 
    navigator.hardwareConcurrency <= 2 ||
    navigator.deviceMemory <= 4 ||
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  return isLowEnd ? 'subtle' : 'medium'
}

// Utility to get optimal glass config
export function getOptimalGlassConfig(variant: GlassVariant): string {
  const intensity = getGlassIntensity()
  const reducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false
  
  return getGlassClasses({
    variant,
    intensity,
    theme: 'auto',
    hover: true,
    motion: !reducedMotion,
    reducedMotion
  })
}
