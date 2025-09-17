/**
 * MeriDesignHouse Micro Feedback Component
 * Tap/hover animations with haptic feedback
 */

'use client'

import { motion, MotionProps } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface MicroFeedbackProps extends Omit<MotionProps, 'whileTap' | 'whileHover'> {
  children: ReactNode
  className?: string
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
  hapticMessage?: string
  tapScale?: number
  hoverScale?: number
  hoverLift?: boolean
  shimmer?: boolean
  glow?: boolean
  sparkle?: boolean
  disabled?: boolean
  onClick?: () => void
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  'aria-controls'?: string
  'aria-pressed'?: boolean
  'aria-selected'?: boolean
  role?: string
  tabIndex?: number
}

export function MicroFeedback({
  children,
  className,
  hapticType = 'light',
  hapticMessage,
  tapScale = 0.98,
  hoverScale = 1.02,
  hoverLift = false,
  shimmer = false,
  glow = false,
  sparkle = false,
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHaspopup,
  'aria-controls': ariaControls,
  'aria-pressed': ariaPressed,
  'aria-selected': ariaSelected,
  role,
  tabIndex,
  ...motionProps
}: MicroFeedbackProps) {
  const { triggerHaptic } = useHapticFeedback()

  const handleTap = () => {
    if (disabled) return
    
    triggerHaptic(hapticType, { fallbackMessage: hapticMessage })
    onClick?.()
  }

  const tapAnimation = disabled ? {} : {
    scale: tapScale,
    transition: { duration: 0.1, ease: [0.4, 0, 0.2, 1] }
  }

  const hoverAnimation = disabled ? {} : {
    scale: hoverScale,
    y: hoverLift ? -2 : 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  }

  const shimmerAnimation = shimmer ? {
    x: ['-100%', '100%'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 2,
      ease: 'easeInOut'
    }
  } : {}

  const glowAnimation = glow ? {
    boxShadow: [
      '0 0 0 0 rgba(244, 63, 94, 0)',
      '0 0 0 4px rgba(244, 63, 94, 0.1)',
      '0 0 0 0 rgba(244, 63, 94, 0)'
    ],
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatDelay: 1,
      ease: 'easeInOut'
    }
  } : {}

  const sparkleAnimation = sparkle ? {
    rotate: [0, 5, -5, 0],
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 3,
      ease: 'easeInOut'
    }
  } : {}

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileTap={tapAnimation}
      whileHover={hoverAnimation}
      animate={{
        ...shimmerAnimation,
        ...glowAnimation,
        ...sparkleAnimation
      }}
      onClick={handleTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleTap()
        }
      }}
      role={role || 'button'}
      tabIndex={tabIndex !== undefined ? tabIndex : (disabled ? -1 : 0)}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      aria-controls={ariaControls}
      aria-pressed={ariaPressed}
      aria-selected={ariaSelected}
      aria-disabled={disabled}
      {...motionProps}
    >
      {children}
      
      {/* Shimmer effect */}
      {shimmer && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      )}
    </motion.div>
  )
}

// Specialized components for common use cases
export function TapButton({
  children,
  className,
  hapticType = 'light',
  hapticMessage,
  ...props
}: Omit<MicroFeedbackProps, 'tapScale' | 'hoverScale'>) {
  return (
    <MicroFeedback
      className={cn('cursor-pointer', className)}
      hapticType={hapticType}
      hapticMessage={hapticMessage}
      tapScale={0.95}
      hoverScale={1.05}
      {...props}
    >
      {children}
    </MicroFeedback>
  )
}

export function HoverCard({
  children,
  className,
  shimmer = true,
  ...props
}: Omit<MicroFeedbackProps, 'tapScale' | 'hoverScale' | 'hoverLift'>) {
  return (
    <MicroFeedback
      className={cn('cursor-pointer', className)}
      tapScale={0.98}
      hoverScale={1.02}
      hoverLift={true}
      shimmer={shimmer}
      {...props}
    >
      {children}
    </MicroFeedback>
  )
}

export function FavoriteButton({
  children,
  className,
  isFavorite,
  onToggle,
  ...props
}: Omit<MicroFeedbackProps, 'hapticType' | 'hapticMessage' | 'onClick'> & {
  isFavorite: boolean
  onToggle: () => void
}) {
  return (
    <MicroFeedback
      className={cn('cursor-pointer', className)}
      hapticType={isFavorite ? 'success' : 'light'}
      hapticMessage={isFavorite ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi'}
      tapScale={0.9}
      hoverScale={1.1}
      onClick={onToggle}
      {...props}
    >
      {children}
    </MicroFeedback>
  )
}

export function AddToCartButton({
  children,
  className,
  onAdd,
  ...props
}: Omit<MicroFeedbackProps, 'hapticType' | 'hapticMessage' | 'onClick'> & {
  onAdd: () => void
}) {
  return (
    <MicroFeedback
      className={cn('cursor-pointer', className)}
      hapticType="success"
      hapticMessage="Sepete eklendi"
      tapScale={0.95}
      hoverScale={1.05}
      shimmer={true}
      onClick={onAdd}
      {...props}
    >
      {children}
    </MicroFeedback>
  )
}
