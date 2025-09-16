'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { getOptimizedImageUrl, getPresetImageUrl, imagePresets } from '@/lib/imagekit'
import { cn } from '@/lib/utils'

interface ImageKitImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'jpg' | 'png'
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max'
  focus?: 'auto' | 'face' | 'center'
  preset?: keyof typeof imagePresets
  loading?: 'lazy' | 'eager'
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

export function ImageKitImage({
  src,
  alt,
  className,
  width,
  height,
  quality,
  format,
  crop,
  focus,
  preset,
  loading = 'lazy',
  placeholder,
  onLoad,
  onError
}: ImageKitImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Get optimized image URL
  const imageUrl = preset 
    ? getPresetImageUrl(src, preset)
    : getOptimizedImageUrl(src, {
        width,
        height,
        quality,
        format,
        crop,
        focus
      })


  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">Resim yüklenemedi</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Loading placeholder */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          {placeholder ? (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          ) : (
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          )}
        </div>
      )}
      
      {/* Actual image */}
      <Image
        src={imageUrl}
        alt={alt}
        {...(width && height ? { width, height } : { fill: true })}
        priority={loading === 'eager'}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          !width && !height && 'object-cover'
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

// Responsive ImageKit Image component
interface ResponsiveImageKitImageProps extends Omit<ImageKitImageProps, 'width' | 'height'> {
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape'
  sizes?: string
  breakpoints?: number[]
}

export function ResponsiveImageKitImage({
  src,
  alt,
  className,
  aspectRatio = 'square',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  breakpoints = [320, 640, 768, 1024, 1280, 1920],
  quality,
  format,
  crop,
  focus,
  loading = 'lazy',
  placeholder,
  onLoad,
  onError
}: ResponsiveImageKitImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Generate srcSet for responsive images
  const _srcSet = breakpoints
    .map(width => {
      const url = getOptimizedImageUrl(src, {
        width,
        quality,
        format,
        crop,
        focus
      })
      return `${url} ${width}w`
    })
    .join(', ')

  // Get base image URL (largest size)
  const imageUrl = getOptimizedImageUrl(src, {
    width: Math.max(...breakpoints),
    quality,
    format,
    crop,
    focus
  })

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  }

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        <span className="text-sm">Resim yüklenemedi</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClasses[aspectRatio], className)}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          ) : (
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          )}
        </div>
      )}
      
      {/* Actual image */}
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes={sizes}
        priority={loading === 'eager'}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}