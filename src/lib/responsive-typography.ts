/**
 * MeriDesignHouse Responsive Typography System
 * Mobile-first typography scaling with breakpoint controls
 */

import { cn } from '@/lib/utils'

export interface TypographyScale {
  xs: string
  sm: string
  base: string
  lg: string
  xl: string
  '2xl': string
  '3xl': string
  '4xl': string
  '5xl': string
  '6xl': string
}

export const mobileTypography: TypographyScale = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl'
}

export const desktopTypography: TypographyScale = {
  xs: 'md:text-xs',
  sm: 'md:text-sm',
  base: 'md:text-base',
  lg: 'md:text-lg',
  xl: 'md:text-xl',
  '2xl': 'md:text-2xl',
  '3xl': 'md:text-3xl',
  '4xl': 'md:text-4xl',
  '5xl': 'md:text-5xl',
  '6xl': 'md:text-6xl'
}

export const responsiveTypography = {
  // Headings
  h1: cn(mobileTypography['4xl'], desktopTypography['5xl'], 'font-bold leading-tight'),
  h2: cn(mobileTypography['3xl'], desktopTypography['4xl'], 'font-bold leading-tight'),
  h3: cn(mobileTypography['2xl'], desktopTypography['3xl'], 'font-semibold leading-snug'),
  h4: cn(mobileTypography['xl'], desktopTypography['2xl'], 'font-semibold leading-snug'),
  h5: cn(mobileTypography['lg'], desktopTypography['xl'], 'font-medium leading-normal'),
  h6: cn(mobileTypography['base'], desktopTypography['lg'], 'font-medium leading-normal'),
  
  // Body text
  body: cn(mobileTypography['base'], desktopTypography['base'], 'leading-relaxed'),
  bodyLarge: cn(mobileTypography['lg'], desktopTypography['lg'], 'leading-relaxed'),
  bodySmall: cn(mobileTypography['sm'], desktopTypography['sm'], 'leading-relaxed'),
  
  // UI text
  caption: cn(mobileTypography['xs'], desktopTypography['xs'], 'leading-tight'),
  label: cn(mobileTypography['sm'], desktopTypography['sm'], 'font-medium leading-tight'),
  button: cn(mobileTypography['sm'], desktopTypography['base'], 'font-medium leading-none'),
  
  // Special
  hero: cn(mobileTypography['5xl'], desktopTypography['6xl'], 'font-bold leading-tight tracking-tight'),
  display: cn(mobileTypography['6xl'], desktopTypography['7xl'], 'font-black leading-none tracking-tight')
}

export const responsiveSpacing = {
  // Mobile-first spacing
  section: 'py-8 md:py-12 lg:py-16',
  container: 'px-4 sm:px-6 lg:px-8',
  grid: 'gap-4 md:gap-6 lg:gap-8',
  card: 'p-4 md:p-6',
  button: 'px-4 py-2 md:px-6 md:py-3',
  
  // Safe areas
  safeTop: 'pt-safe-top',
  safeBottom: 'pb-safe-bottom',
  safeHorizontal: 'px-safe-left pr-safe-right',
  
  // Mobile-specific
  mobileOnly: 'md:hidden',
  desktopOnly: 'hidden md:block',
  
  // Touch targets
  touchTarget: 'min-h-[44px] min-w-[44px]', // iOS/Android minimum touch target
  touchTargetLarge: 'min-h-[48px] min-w-[48px]'
}

export const responsiveGrid = {
  // Product grids
  productGrid: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6',
  productGridDense: 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4',
  
  // Content grids
  contentGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8',
  sidebarGrid: 'grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8',
  
  // Mobile-specific grids
  mobileStack: 'flex flex-col space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6',
  mobileHorizontal: 'flex space-x-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:space-x-0 md:overflow-visible'
}

export const responsiveLayout = {
  // Container widths
  container: 'max-w-7xl mx-auto',
  containerNarrow: 'max-w-4xl mx-auto',
  containerWide: 'max-w-full mx-auto',
  
  // Mobile-specific layouts
  mobileFullWidth: 'w-full md:max-w-none',
  mobileCentered: 'mx-auto md:mx-0',
  
  // Sticky elements
  stickyTop: 'sticky top-0 z-30',
  stickyBottom: 'sticky bottom-0 z-30',
  
  // Mobile navigation
  mobileNavHeight: 'h-16 md:h-auto',
  mobileContentPadding: 'pt-16 md:pt-0 pb-20 md:pb-0'
}

// Utility function to create responsive classes
export function createResponsiveClasses(
  mobile: string,
  desktop?: string,
  tablet?: string
): string {
  const classes = [mobile]
  
  if (tablet) {
    classes.push(`sm:${tablet}`)
  }
  
  if (desktop) {
    classes.push(`md:${desktop}`)
  }
  
  return cn(...classes)
}

// Typography hook for dynamic scaling
export function useResponsiveTypography() {
  return {
    responsiveTypography,
    responsiveSpacing,
    responsiveGrid,
    responsiveLayout,
    createResponsiveClasses
  }
}
