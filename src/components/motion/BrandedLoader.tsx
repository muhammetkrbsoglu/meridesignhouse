'use client'

import { motion } from 'framer-motion'
import { Sparkles, Heart, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
// A/B testing hook fallback (module optional). We always use safe defaults here to avoid bundler resolution errors.
const useLoaderAnimationsTesting = () => ({
  getLoaderConfig: () => ({ showIcon: true, showShimmer: true }),
  trackLoaderEvent: (_e: string) => {}
})

interface BrandedLoaderProps {
  variant?: 'mini' | 'full' | 'inline' | 'overlay'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'rose' | 'pink' | 'purple' | 'gradient'
  text?: string
  showIcon?: boolean
  showShimmer?: boolean
  className?: string
}

const variants = {
  mini: {
    container: 'p-2',
    spinner: 'w-4 h-4',
    text: 'text-xs',
    icon: 'w-3 h-3'
  },
  full: {
    container: 'p-8',
    spinner: 'w-12 h-12',
    text: 'text-lg',
    icon: 'w-8 h-8'
  },
  inline: {
    container: 'p-3',
    spinner: 'w-6 h-6',
    text: 'text-sm',
    icon: 'w-4 h-4'
  },
  overlay: {
    container: 'p-6',
    spinner: 'w-8 h-8',
    text: 'text-base',
    icon: 'w-6 h-6'
  }
}

const colors = {
  rose: {
    spinner: 'border-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    icon: 'text-rose-500',
    shimmer: 'from-rose-500/20 to-pink-500/20'
  },
  pink: {
    spinner: 'border-pink-500',
    text: 'text-pink-600 dark:text-pink-400',
    icon: 'text-pink-500',
    shimmer: 'from-pink-500/20 to-purple-500/20'
  },
  purple: {
    spinner: 'border-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-500',
    shimmer: 'from-purple-500/20 to-rose-500/20'
  },
  gradient: {
    spinner: 'border-transparent bg-gradient-to-r from-rose-500 to-pink-500',
    text: 'text-transparent bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text',
    icon: 'text-transparent bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text',
    shimmer: 'from-rose-500/30 to-pink-500/30'
  }
}

const icons = {
  mini: Sparkles,
  full: Heart,
  inline: Star,
  overlay: Zap
}

export function BrandedLoader({
  variant = 'mini',
  size = 'md',
  color = 'gradient',
  text,
  showIcon = true,
  showShimmer = true,
  className
}: BrandedLoaderProps) {
  const { getLoaderConfig, trackLoaderEvent } = useLoaderAnimationsTesting()
  const loaderConfig = getLoaderConfig()
  
  const variantConfig = variants[variant]
  const colorConfig = colors[color]
  const IconComponent = icons[variant]
  
  // Override with A/B test configuration
  const effectiveShowIcon = showIcon && loaderConfig.showIcon
  const effectiveShowShimmer = showShimmer && loaderConfig.showShimmer

  const sizeMultiplier = {
    sm: 0.75,
    md: 1,
    lg: 1.25,
    xl: 1.5
  }[size]

  const actualSpinnerSize = {
    width: `${parseInt(variantConfig.spinner.split(' ')[1]) * sizeMultiplier}px`,
    height: `${parseInt(variantConfig.spinner.split(' ')[1]) * sizeMultiplier}px`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        variantConfig.container,
        className
      )}
    >
      {/* Spinner Container */}
      <div className="relative">
        {/* Main Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={cn(
            'rounded-full border-2 border-t-transparent',
            colorConfig.spinner,
            'relative'
          )}
          style={actualSpinnerSize}
        >
          {/* Inner Glow */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/20 to-pink-500/20"
          />
        </motion.div>

        {/* Icon Overlay */}
        {effectiveShowIcon && (
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <IconComponent 
              className={cn(
                colorConfig.icon,
                variantConfig.icon
              )}
            />
          </motion.div>
        )}

        {/* Shimmer Effect */}
        {effectiveShowShimmer && (
          <motion.div
            animate={{ 
              x: ['-100%', '100%'],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: 'easeInOut',
              repeatDelay: 1
            }}
            className={cn(
              'absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent',
              colorConfig.shimmer
            )}
          />
        )}
      </div>

      {/* Text */}
      {text && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'font-medium text-center',
            colorConfig.text,
            variantConfig.text
          )}
        >
          {text}
        </motion.p>
      )}

      {/* Pulse Dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-1"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: index * 0.2
            }}
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              color === 'gradient' 
                ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                : 'bg-rose-500'
            )}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}

// Specialized loader components
export function MiniLoader({ 
  text = 'Yükleniyor...', 
  className,
  ...props 
}: Omit<BrandedLoaderProps, 'variant'>) {
  return (
    <BrandedLoader 
      variant="mini" 
      text={text} 
      className={className}
      {...props} 
    />
  )
}

export function FullPageLoader({ 
  text = 'Sayfa yükleniyor...', 
  className,
  ...props 
}: Omit<BrandedLoaderProps, 'variant'>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
    >
      <BrandedLoader 
        variant="full" 
        text={text} 
        className={className}
        {...props} 
      />
    </motion.div>
  )
}

export function InlineLoader({ 
  text = 'Yükleniyor...', 
  className,
  ...props 
}: Omit<BrandedLoaderProps, 'variant'>) {
  return (
    <BrandedLoader 
      variant="inline" 
      text={text} 
      className={className}
      {...props} 
    />
  )
}

export function OverlayLoader({ 
  text = 'İşleniyor...', 
  className,
  ...props 
}: Omit<BrandedLoaderProps, 'variant'>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg"
    >
      <BrandedLoader 
        variant="overlay" 
        text={text} 
        className={className}
        {...props} 
      />
    </motion.div>
  )
}

// Skeleton Loader with Branded Elements
export function BrandedSkeleton({ 
  className,
  lines = 3,
  showIcon = true
}: { 
  className?: string
  lines?: number
  showIcon?: boolean
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {showIcon && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-8 h-8 bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-full"
        />
      )}
      
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: 'easeInOut',
            delay: index * 0.2
          }}
          className={cn(
            'h-4 bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded',
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}
