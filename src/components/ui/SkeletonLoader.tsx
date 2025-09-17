"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular' | 'card' | 'grid'
  width?: string | number
  height?: string | number
  count?: number
  animation?: 'pulse' | 'wave' | 'shimmer'
  microPulse?: boolean
}

const shimmerVariants = {
  initial: { x: '-100%' },
  animate: { 
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear'
    }
  }
}

export function SkeletonLoader({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
  animation = 'shimmer',
  microPulse = true
}: SkeletonLoaderProps) {
  const baseClasses = cn(
    'bg-gray-200 dark:bg-gray-700 rounded',
    {
      'h-4': variant === 'text' && !height,
      'h-32': variant === 'rectangular' && !height,
      'h-12 w-12 rounded-full': variant === 'circular' && !width && !height,
      'h-48': variant === 'card' && !height,
      'h-64': variant === 'grid' && !height,
    },
    className
  )

  const style = {
    width: width || '100%',
    height: height || 'auto',
  }

  if (count === 1) {
  return (
    <div className="relative overflow-hidden">
      <motion.div
        className={baseClasses}
        style={style}
        animate={microPulse ? { opacity: [0.95, 1, 0.95] } : undefined}
        transition={microPulse ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      {animation === 'shimmer' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent motion-safe:animate-pulse"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />
      )}
    </div>
  )
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="relative overflow-hidden">
          <motion.div
            className={baseClasses}
            style={style}
            animate={microPulse ? { opacity: [0.95, 1, 0.95] } : undefined}
            transition={microPulse ? { duration: 1.4 + index * 0.05, repeat: Infinity, ease: 'easeInOut' } : undefined}
          />
          {animation === 'shimmer' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: index * 0.1 }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Specialized skeleton components
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonLoader variant="rectangular" height="200px" className="rounded-lg" />
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="80%" />
        <SkeletonLoader variant="text" width="60%" />
        <SkeletonLoader variant="text" width="40%" height="20px" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function CartItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <SkeletonLoader variant="rectangular" width="80px" height="80px" className="rounded-lg" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader variant="text" width="70%" />
        <SkeletonLoader variant="text" width="50%" />
        <div className="flex items-center space-x-2">
          <SkeletonLoader variant="rectangular" width="30px" height="30px" className="rounded" />
          <SkeletonLoader variant="text" width="40px" />
          <SkeletonLoader variant="rectangular" width="30px" height="30px" className="rounded" />
        </div>
      </div>
    </div>
  )
}

export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <CartItemSkeleton key={index} />
      ))}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <SkeletonLoader variant="text" width="100px" />
          <SkeletonLoader variant="text" width="80px" />
        </div>
        <div className="flex justify-between">
          <SkeletonLoader variant="text" width="120px" />
          <SkeletonLoader variant="text" width="100px" />
        </div>
        <SkeletonLoader variant="rectangular" height="48px" className="rounded-lg" />
      </div>
    </div>
  )
}
