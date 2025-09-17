/**
 * MeriDesignHouse Lazy Image Component
 * Optimized image loading with IntersectionObserver and skeleton fallback
 */

"use client"

import { useState } from 'react'
import Image from 'next/image'
import { useLazyImage } from '@/hooks/useLazyLoading'
import { SkeletonLoader } from './SkeletonLoader'
import { cn } from '@/lib/utils'
import { useReducedMotion } from 'framer-motion'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  onLoad?: () => void
  onError?: () => void
  skeleton?: boolean
  skeletonClassName?: string
  fallbackSrc?: string
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
  skeleton = true,
  skeletonClassName,
  fallbackSrc = '/placeholder-product.jpg'
}: LazyImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  
  const {
    isVisible,
    isLoaded,
    isError,
    ref,
    src: lazySrc,
    onLoad: handleLazyLoad,
    onError: handleLazyError
  } = useLazyImage(src, {
    threshold: 0.05,
    rootMargin: typeof window !== 'undefined' && window.innerWidth < 768 ? '200px' : '150px',
    triggerOnce: true,
    enabled: !priority
  })

  const handleLoad = () => {
    setImageLoaded(true)
    handleLazyLoad()
    onLoad?.()
  }

  const handleError = () => {
    setImageError(true)
    handleLazyError()
    onError?.()
  }

  // Show skeleton while loading
  if (!priority && !isVisible && skeleton) {
    return (
      <div ref={ref} className={cn('relative overflow-hidden', className)}>
        <SkeletonLoader
          width={width}
          height={height}
          className={cn('w-full h-full', skeletonClassName)}
          animation="shimmer"
        />
      </div>
    )
  }

  // Show error fallback
  if (isError || imageError) {
    return (
      <div className={cn('relative overflow-hidden bg-gray-100 flex items-center justify-center', className)}>
        <Image
          src={fallbackSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          className={cn(
            'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down'
          )}
          style={{ objectPosition }}
          quality={quality}
          priority={priority}
        />
      </div>
    )
  }

  const imageProps = {
    src: priority ? src : (lazySrc || src),
    alt,
    width: fill ? undefined : width,
    height: fill ? undefined : height,
    fill,
    className: cn(
      'motion-safe:transition-opacity motion-safe:duration-300',
      imageLoaded ? 'opacity-100' : 'opacity-0',
      className
    ),
    style: fill ? { objectFit, objectPosition } : undefined,
    quality,
    priority,
    sizes,
    onLoad: handleLoad,
    onError: handleError,
    ...(placeholder === 'blur' && blurDataURL && { placeholder: 'blur', blurDataURL })
  }

  return (
    <div ref={!priority ? ref : undefined} className="relative">
      <Image {...imageProps} />
      
      {/* Loading overlay */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  )
}

// Specialized components for common use cases
export function ProductImage({
  src,
  alt,
  className,
  ...props
}: Omit<LazyImageProps, 'width' | 'height' | 'fill' | 'objectFit'>) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      width={400}
      height={400}
      className={cn('aspect-square object-cover', className)}
      objectFit="cover"
      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      {...props}
    />
  )
}

export function HeroImage({
  src,
  alt,
  className,
  ...props
}: Omit<LazyImageProps, 'width' | 'height' | 'fill' | 'objectFit'>) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      fill
      className={cn('object-cover', className)}
      objectFit="cover"
      sizes="100vw"
      priority
      {...props}
    />
  )
}

export function AvatarImage({
  src,
  alt,
  className,
  size = 40,
  ...props
}: Omit<LazyImageProps, 'width' | 'height' | 'fill' | 'objectFit'> & { size?: number }) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      objectFit="cover"
      sizes={`${size}px`}
      {...props}
    />
  )
}
