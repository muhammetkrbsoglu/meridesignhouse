'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { BrandedLoader } from './BrandedLoader'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
  threshold?: number
  disabled?: boolean
  refreshText?: string
  releaseText?: string
  refreshingText?: string
  successText?: string
  errorText?: string
}

const DEFAULT_THRESHOLD = 80
const MAX_PULL_DISTANCE = 120
const SPRING_CONFIG = {
  damping: 30,
  stiffness: 300,
  mass: 0.8,
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = DEFAULT_THRESHOLD,
  disabled = false,
  refreshText = 'Yenilemek için çekin',
  releaseText = 'Bırakın',
  refreshingText = 'Yenileniyor...',
  successText = 'Yenilendi!',
  errorText = 'Hata oluştu',
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [hasReachedThreshold, setHasReachedThreshold] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const isDragging = useRef(false)
  const isAtTop = useRef(true)
  
  const { light, medium, success, error } = useHapticFeedback()
  
  // Motion values for smooth animations
  const y = useMotionValue(0)
  const springY = useSpring(y, SPRING_CONFIG)
  
  // Transform values for visual feedback
  const opacity = useTransform(springY, [0, threshold], [0, 1])
  const scale = useTransform(springY, [0, threshold], [0.8, 1])
  const rotation = useTransform(springY, [0, threshold * 2], [0, 180])
  
  // Check if user is at the top of the page
  const checkScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.scrollY <= 10
  }, [])
  
  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !checkScrollPosition()) return
    
    startY.current = e.touches[0].clientY
    currentY.current = e.touches[0].clientY
    isDragging.current = true
    isAtTop.current = checkScrollPosition()
    
    if (isAtTop.current) {
      e.preventDefault()
    }
  }, [disabled, isRefreshing, checkScrollPosition])
  
  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !isAtTop.current || disabled || isRefreshing) return
    
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      e.preventDefault()
      
      const distance = Math.min(deltaY * 0.6, MAX_PULL_DISTANCE) // Damping factor
      setPullDistance(distance)
      y.set(distance)
      
      if (!isPulling) {
        setIsPulling(true)
        light('Pull başladı')
      }
      
      const reachedThreshold = distance >= threshold
      if (reachedThreshold !== hasReachedThreshold) {
        setHasReachedThreshold(reachedThreshold)
        if (reachedThreshold) {
          medium('Threshold aşıldı')
        }
      }
    }
  }, [disabled, isRefreshing, threshold, hasReachedThreshold, isPulling, light, medium, y])
  
  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || !isAtTop.current || disabled || isRefreshing) return
    
    isDragging.current = false
    setIsPulling(false)
    
    if (pullDistance >= threshold) {
      // Trigger refresh
      setIsRefreshing(true)
      setRefreshStatus('idle')
      
      try {
        await onRefresh()
        setRefreshStatus('success')
        success('Yenileme tamamlandı')
        
        // Show success state briefly
        setTimeout(() => {
          setRefreshStatus('idle')
        }, 1500)
      } catch (err) {
        setRefreshStatus('error')
        error('Yenileme hatası')
        
        // Show error state briefly
        setTimeout(() => {
          setRefreshStatus('idle')
        }, 2000)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    // Reset position
    y.set(0)
    setPullDistance(0)
    setHasReachedThreshold(false)
  }, [pullDistance, threshold, disabled, isRefreshing, onRefresh, success, error, y])
  
  // Handle mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || isRefreshing || !checkScrollPosition()) return
    
    startY.current = e.clientY
    currentY.current = e.clientY
    isDragging.current = true
    isAtTop.current = checkScrollPosition()
    
    if (isAtTop.current) {
      e.preventDefault()
    }
  }, [disabled, isRefreshing, checkScrollPosition])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !isAtTop.current || disabled || isRefreshing) return
    
    currentY.current = e.clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      e.preventDefault()
      
      const distance = Math.min(deltaY * 0.6, MAX_PULL_DISTANCE)
      setPullDistance(distance)
      y.set(distance)
      
      if (!isPulling) {
        setIsPulling(true)
        light('Pull başladı')
      }
      
      const reachedThreshold = distance >= threshold
      if (reachedThreshold !== hasReachedThreshold) {
        setHasReachedThreshold(reachedThreshold)
        if (reachedThreshold) {
          medium('Threshold aşıldı')
        }
      }
    }
  }, [disabled, isRefreshing, threshold, hasReachedThreshold, isPulling, light, medium, y])
  
  const handleMouseUp = useCallback(() => {
    handleTouchEnd()
  }, [handleTouchEnd])
  
  // Add event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])
  
  // Get current status text
  const getStatusText = () => {
    if (isRefreshing) return refreshingText
    if (refreshStatus === 'success') return successText
    if (refreshStatus === 'error') return errorText
    if (hasReachedThreshold) return releaseText
    return refreshText
  }
  
  // Get status icon
  const getStatusIcon = () => {
    if (isRefreshing) {
      return (
        <BrandedLoader 
          variant="mini" 
          size="sm" 
          color="gradient" 
          showIcon={true}
          showShimmer={true}
          className="p-1"
        />
      )
    }
    if (refreshStatus === 'success') {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    if (refreshStatus === 'error') {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    }
    return <RefreshCw className="w-5 h-5" />
  }
  
  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Pull to refresh indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-sm border-b border-gray-100"
        style={{
          y: useTransform(springY, (value) => Math.max(0, value - 20)),
          opacity,
        }}
      >
        <div className="flex items-center gap-2 py-3 px-4">
          <motion.div
            style={{
              scale,
              rotate: rotation,
            }}
          >
            {getStatusIcon()}
          </motion.div>
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
        </div>
      </motion.div>
      
      {/* Content */}
      <motion.div
        style={{
          y: springY,
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
