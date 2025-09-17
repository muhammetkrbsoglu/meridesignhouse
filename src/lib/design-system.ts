/**
 * MeriDesignHouse Design System
 * Light Language & Visual Consistency
 */

// Typography Scale - Mobile-first responsive
export const typography = {
  // Headings
  h1: {
    mobile: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
    desktop: 'text-4xl lg:text-5xl xl:text-6xl',
    weight: 'font-bold',
    leading: 'leading-tight',
    clamp: 'line-clamp-2'
  },
  h2: {
    mobile: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    desktop: 'text-3xl lg:text-4xl',
    weight: 'font-bold',
    leading: 'leading-tight',
    clamp: 'line-clamp-2'
  },
  h3: {
    mobile: 'text-lg sm:text-xl md:text-2xl',
    desktop: 'text-xl lg:text-2xl',
    weight: 'font-semibold',
    leading: 'leading-tight',
    clamp: 'line-clamp-2'
  },
  h4: {
    mobile: 'text-base sm:text-lg',
    desktop: 'text-lg',
    weight: 'font-semibold',
    leading: 'leading-snug',
    clamp: 'line-clamp-2'
  },
  // Body text
  body: {
    mobile: 'text-sm sm:text-base',
    desktop: 'text-base',
    weight: 'font-normal',
    leading: 'leading-relaxed'
  },
  bodyLarge: {
    mobile: 'text-base sm:text-lg',
    desktop: 'text-lg',
    weight: 'font-normal',
    leading: 'leading-relaxed'
  },
  // Micro typography
  caption: {
    mobile: 'text-xs sm:text-sm',
    desktop: 'text-sm',
    weight: 'font-medium',
    leading: 'leading-tight'
  },
  small: {
    mobile: 'text-xs',
    desktop: 'text-xs',
    weight: 'font-normal',
    leading: 'leading-tight'
  }
} as const

// Spacing System - 4px base unit
export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const

// Color Palette - Brand-aligned
export const colors = {
  primary: {
    50: 'rose-50',
    100: 'rose-100',
    200: 'rose-200',
    300: 'rose-300',
    400: 'rose-400',
    500: 'rose-500',
    600: 'rose-600',
    700: 'rose-700',
    800: 'rose-800',
    900: 'rose-900',
  },
  secondary: {
    50: 'pink-50',
    100: 'pink-100',
    200: 'pink-200',
    300: 'pink-300',
    400: 'pink-400',
    500: 'pink-500',
    600: 'pink-600',
    700: 'pink-700',
    800: 'pink-800',
    900: 'pink-900',
  },
  accent: {
    50: 'purple-50',
    100: 'purple-100',
    200: 'purple-200',
    300: 'purple-300',
    400: 'purple-400',
    500: 'purple-500',
    600: 'purple-600',
    700: 'purple-700',
    800: 'purple-800',
    900: 'purple-900',
  },
  neutral: {
    50: 'gray-50',
    100: 'gray-100',
    200: 'gray-200',
    300: 'gray-300',
    400: 'gray-400',
    500: 'gray-500',
    600: 'gray-600',
    700: 'gray-700',
    800: 'gray-800',
    900: 'gray-900',
  }
} as const

// Shadow System - Depth hierarchy
export const shadows = {
  subtle: 'shadow-sm shadow-gray-200/50',
  medium: 'shadow-md shadow-gray-300/50',
  strong: 'shadow-lg shadow-gray-400/50',
  dramatic: 'shadow-xl shadow-gray-500/50',
  // Brand shadows
  primary: 'shadow-lg shadow-rose-500/20',
  primaryStrong: 'shadow-xl shadow-rose-500/30',
  // Glow effects
  glow: 'shadow-lg shadow-rose-500/10',
  glowStrong: 'shadow-xl shadow-rose-500/20',
} as const

// Border Radius - Consistent rounded corners
export const radius = {
  sm: 'rounded-sm',     // 2px
  md: 'rounded-md',     // 6px
  lg: 'rounded-lg',     // 8px
  xl: 'rounded-xl',     // 12px
  '2xl': 'rounded-2xl', // 16px
  '3xl': 'rounded-3xl', // 24px
  full: 'rounded-full',
} as const

// Light Language - Premium effects with scarcity
export const lightLanguage = {
  // Sparkle - Only for primary CTAs, very rare
  sparkle: {
    primary: 'bg-gradient-to-r from-rose-500 to-pink-500',
    hover: 'hover:from-rose-600 hover:to-pink-600',
    shadow: 'shadow-lg shadow-rose-500/20',
    text: 'text-white',
    icon: 'text-white/90'
  },
  
  // Shimmer - Hover effects, loading states
  shimmer: {
    base: 'bg-gradient-to-r from-transparent via-white/20 to-transparent',
    animation: 'animate-shimmer',
    duration: 'duration-1000',
    timing: 'ease-out'
  },
  
  // Glow - Focus states, active elements
  glow: {
    subtle: 'shadow-lg shadow-rose-500/10',
    medium: 'shadow-xl shadow-rose-500/20',
    strong: 'shadow-2xl shadow-rose-500/30',
    // Focus ring
    focus: 'focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2'
  },
  
  // Gradient patterns
  gradient: {
    primary: 'bg-gradient-to-r from-rose-500 to-pink-500',
    primaryHover: 'hover:from-rose-600 hover:to-pink-600',
    secondary: 'bg-gradient-to-r from-rose-400 to-pink-400',
    accent: 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600',
    // Text gradients
    textPrimary: 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent',
    textSecondary: 'bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent'
  }
} as const

// Motion System - Consistent durations and easing
export const motion = {
  // Durations (ms)
  duration: {
    instant: 100,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
    slowest: 800
  },
  
  // Easing curves
  easing: {
    // iOS-like natural easing
    natural: [0.4, 0, 0.2, 1],
    // Smooth entrance
    smooth: [0.25, 0.46, 0.45, 0.94],
    // Bounce for playful elements
    bounce: [0.68, -0.55, 0.265, 1.55],
    // Linear for continuous animations
    linear: [0, 0, 1, 1]
  },
  
  // Common transitions
  transitions: {
    // Micro interactions
    tap: {
      scale: 0.98,
      duration: 100,
      ease: [0.4, 0, 0.2, 1]
    },
    // Hover effects
    hover: {
      scale: 1.02,
      duration: 200,
      ease: [0.4, 0, 0.2, 1]
    },
    // Page transitions
    page: {
      duration: 300,
      ease: [0.4, 0, 0.2, 1]
    },
    // Modal/sheet animations
    modal: {
      duration: 250,
      ease: [0.4, 0, 0.2, 1]
    }
  }
} as const

// Component Variants - Consistent styling patterns
export const variants = {
  button: {
    primary: {
      base: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold',
      hover: 'hover:from-rose-600 hover:to-pink-600',
      shadow: 'shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed'
    },
    secondary: {
      base: 'border-2 border-rose-300 text-rose-600 font-semibold',
      hover: 'hover:bg-rose-50 hover:border-rose-400',
      shadow: 'shadow-sm hover:shadow-md'
    },
    ghost: {
      base: 'text-rose-600 font-medium',
      hover: 'hover:bg-rose-50',
      shadow: 'hover:shadow-sm'
    }
  },
  
  card: {
    base: 'bg-white rounded-xl border border-gray-100',
    hover: 'hover:shadow-lg hover:shadow-rose-500/10',
    shadow: 'shadow-sm',
    padding: 'p-3 sm:p-4'
  },
  
  input: {
    base: 'border border-gray-300 rounded-lg px-3 py-2 text-sm',
    focus: 'focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500',
    error: 'border-red-500 focus:ring-red-500/50'
  }
} as const

// Utility functions
export const getTypographyClass = (variant: keyof typeof typography, responsive: 'mobile' | 'desktop' = 'mobile') => {
  const type = typography[variant]
  return `${type[responsive]} ${type.weight} ${type.leading} ${type.clamp || ''}`.trim()
}

export const getShadowClass = (level: keyof typeof shadows) => {
  return shadows[level]
}

export const getRadiusClass = (size: keyof typeof radius) => {
  return radius[size]
}

export const getMotionTransition = (type: keyof typeof motion.transitions) => {
  return motion.transitions[type]
}
