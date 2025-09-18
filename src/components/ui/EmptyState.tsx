/**
 * MeriDesignHouse Empty State Component
 * Enhanced empty states with fade-in illustrations and animations
 */

"use client"

import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { useDesktopAnimations } from '@/hooks/useDesktopAnimations'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  illustration?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

const sizeClasses = {
  sm: 'py-8',
  md: 'py-12',
  lg: 'py-16'
}

const iconSizes = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  className,
  size = 'md',
  animated = true
}: EmptyStateProps) {
  const shouldReduceMotion = useReducedMotion()
  const { createFadeInAnimation, createStaggerAnimation } = useDesktopAnimations()

  const containerAnimation = createFadeInAnimation({
    duration: 0.6,
    disabled: !animated
  })

  const iconAnimation = createStaggerAnimation(0, {
    duration: 0.8,
    staggerDelay: 0.2,
    disabled: !animated
  })

  const textAnimation = createStaggerAnimation(1, {
    duration: 0.6,
    staggerDelay: 0.1,
    disabled: !animated
  })

  const actionAnimation = createStaggerAnimation(2, {
    duration: 0.5,
    staggerDelay: 0.1,
    disabled: !animated
  })

  return (
    <motion.div
      {...containerAnimation}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses[size],
        className
      )}
    >
      {/* Illustration or Icon */}
      <div className="mb-6">
        {illustration ? (
          <motion.div
            {...iconAnimation}
            className="relative"
          >
            {illustration}
          </motion.div>
        ) : (
          <motion.div
            {...iconAnimation}
            className={cn(
              'mx-auto flex items-center justify-center rounded-full bg-gray-100 text-gray-400',
              iconSizes[size]
            )}
          >
            <Icon className={cn(
              size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'
            )} />
          </motion.div>
        )}
      </div>

      {/* Title */}
      <motion.h3
        {...textAnimation}
        className={cn(
          'font-semibold text-gray-900 mb-2',
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
        )}
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        {...textAnimation}
        className={cn(
          'text-gray-500 mb-6 max-w-md',
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
        )}
      >
        {description}
      </motion.p>

      {/* Action Button */}
      {action && (
        <motion.button
          {...actionAnimation}
          onClick={action.onClick}
          className={cn(
            'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md',
            'text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500',
            'motion-safe:transition-colors motion-safe:duration-200'
          )}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

// Specialized empty state components
export function EmptyCart({ onContinueShopping }: { onContinueShopping: () => void }) {
  return (
    <EmptyState
      icon={require('lucide-react').ShoppingCart}
      title="Sepetiniz boş"
      description="Henüz sepetinizde ürün bulunmuyor. Alışverişe başlamak için ürünleri keşfedin."
      action={{
        label: 'Alışverişe Başla',
        onClick: onContinueShopping
      }}
      size="lg"
    />
  )
}

export function EmptyFavorites({ onBrowseProducts }: { onBrowseProducts: () => void }) {
  return (
    <EmptyState
      icon={require('lucide-react').Heart}
      title="Favori ürününüz yok"
      description="Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz."
      action={{
        label: 'Ürünleri Keşfet',
        onClick: onBrowseProducts
      }}
      size="lg"
    />
  )
}

export function EmptyOrders({ onStartShopping }: { onStartShopping: () => void }) {
  return (
    <EmptyState
      icon={require('lucide-react').Package}
      title="Henüz siparişiniz yok"
      description="İlk siparişinizi vermek için alışverişe başlayın ve favori ürünlerinizi keşfedin."
      action={{
        label: 'Alışverişe Başla',
        onClick: onStartShopping
      }}
      size="lg"
    />
  )
}

export function EmptySearch({ onClearSearch }: { onClearSearch: () => void }) {
  return (
    <EmptyState
      icon={require('lucide-react').Search}
      title="Arama sonucu bulunamadı"
      description="Aradığınız kriterlere uygun ürün bulunamadı. Farklı anahtar kelimeler deneyin."
      action={{
        label: 'Filtreleri Temizle',
        onClick: onClearSearch
      }}
      size="md"
    />
  )
}

