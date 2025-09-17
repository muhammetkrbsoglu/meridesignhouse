"use client"

import { motion, useDragControls, useMotionValue, useTransform, useReducedMotion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { cn } from '@/lib/utils'

interface SwipeAction {
  id: string
  label: string
  icon: React.ReactNode
  color: 'red' | 'green' | 'blue' | 'yellow' | 'gray'
  action: () => void
}

interface SwipeActionsProps {
  children: React.ReactNode
  leftActions?: SwipeAction[]
  rightActions?: SwipeAction[]
  threshold?: number
  className?: string
  disabled?: boolean
}

const colorClasses = {
  red: 'bg-red-500 hover:bg-red-600',
  green: 'bg-green-500 hover:bg-green-600',
  blue: 'bg-blue-500 hover:bg-blue-600',
  yellow: 'bg-yellow-500 hover:bg-yellow-600',
  gray: 'bg-gray-500 hover:bg-gray-600',
}

export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 100,
  className,
  disabled = false
}: SwipeActionsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  
  const dragControls = useDragControls()
  const x = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { light, medium, success } = useHapticFeedback()
  const shouldReduceMotion = useReducedMotion()
  
  // Velocity tracking for momentum-based swipe
  const velocityRef = useRef(0)
  const lastTimeRef = useRef(0)
  const lastXRef = useRef(0)

  // Transform values
  const leftOpacity = useTransform(x, [-threshold, 0], [1, 0])
  const rightOpacity = useTransform(x, [0, threshold], [0, 1])
  const leftScale = useTransform(x, [-threshold, 0], [1, 0.8])
  const rightScale = useTransform(x, [0, threshold], [0.8, 1])

  // Handle drag start
  const handleDragStart = () => {
    if (disabled) return
    setIsDragging(true)
    velocityRef.current = 0
    lastTimeRef.current = Date.now()
    lastXRef.current = 0
    if (!shouldReduceMotion) {
      light('Swipe başladı')
    }
  }

  // Handle drag
  const handleDrag = (event: any, info: any) => {
    if (disabled) return
    
    const currentX = info.offset.x
    const currentTime = Date.now()
    const deltaTime = currentTime - lastTimeRef.current
    const deltaX = currentX - lastXRef.current
    
    // Calculate velocity
    if (deltaTime > 0) {
      velocityRef.current = deltaX / deltaTime
    }
    
    lastTimeRef.current = currentTime
    lastXRef.current = currentX
    
    if (currentX < -50) {
      setSwipeDirection('left')
      if (leftActions.length > 0 && !isOpen && !shouldReduceMotion) {
        medium('Sol swipe aktif')
      }
    } else if (currentX > 50) {
      setSwipeDirection('right')
      if (rightActions.length > 0 && !isOpen && !shouldReduceMotion) {
        medium('Sağ swipe aktif')
      }
    } else {
      setSwipeDirection(null)
    }
  }

  // Handle drag end
  const handleDragEnd = (event: any, info: any) => {
    if (disabled) return
    
    setIsDragging(false)
    const currentX = info.offset.x
    const velocity = velocityRef.current
    
    // Dynamic threshold based on velocity (faster swipe = lower threshold)
    const dynamicThreshold = Math.max(threshold * 0.6, threshold - Math.abs(velocity) * 50)
    
    if (Math.abs(currentX) >= dynamicThreshold || Math.abs(velocity) > 0.5) {
      if (currentX < 0 && leftActions.length > 0) {
        // Left swipe - show left actions
        setIsOpen(true)
        setSwipeDirection('left')
        if (!shouldReduceMotion) {
          success('Sol eylemler açıldı')
        }
      } else if (currentX > 0 && rightActions.length > 0) {
        // Right swipe - show right actions
        setIsOpen(true)
        setSwipeDirection('right')
        if (!shouldReduceMotion) {
          success('Sağ eylemler açıldı')
        }
      }
    } else {
      // Snap back with spring physics
      x.set(0, { 
        type: shouldReduceMotion ? "tween" : "spring", 
        damping: shouldReduceMotion ? 30 : 25, 
        stiffness: shouldReduceMotion ? 300 : 400 
      })
      setSwipeDirection(null)
      setIsOpen(false)
    }
  }

  // Handle action click
  const handleActionClick = (action: SwipeAction) => {
    action.action()
    setIsOpen(false)
    x.set(0, { 
      type: shouldReduceMotion ? "tween" : "spring", 
      damping: shouldReduceMotion ? 30 : 25, 
      stiffness: shouldReduceMotion ? 300 : 400 
    })
    setSwipeDirection(null)
    if (!shouldReduceMotion) {
      success(`${action.label} eylemi gerçekleştirildi`)
    }
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        x.set(0, { 
          type: shouldReduceMotion ? "tween" : "spring", 
          damping: shouldReduceMotion ? 30 : 25, 
          stiffness: shouldReduceMotion ? 300 : 400 
        })
        setSwipeDirection(null)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, x])

  // Don't render on desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return <div className={className}>{children}</div>
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 flex items-center z-10"
          style={{
            opacity: leftOpacity,
            scale: leftScale,
          }}
        >
          <div className="flex h-full">
            {leftActions.map((action, index) => (
              <motion.button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={cn(
                  'flex items-center justify-center px-4 h-full text-white font-medium',
                  colorClasses[action.color]
                )}
                style={{ width: `${100 / leftActions.length}px` }}
                whileTap={{ scale: 0.95 }}
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex flex-col items-center gap-1">
                  {action.icon}
                  <span className="text-xs">{action.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 flex items-center z-10"
          style={{
            opacity: rightOpacity,
            scale: rightScale,
          }}
        >
          <div className="flex h-full">
            {rightActions.map((action, index) => (
              <motion.button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={cn(
                  'flex items-center justify-center px-4 h-full text-white font-medium',
                  colorClasses[action.color]
                )}
                style={{ width: `${100 / rightActions.length}px` }}
                whileTap={{ scale: 0.95 }}
                initial={{ x: 100 }}
                animate={{ x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex flex-col items-center gap-1">
                  {action.icon}
                  <span className="text-xs">{action.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        drag="x"
        dragControls={dragControls}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={shouldReduceMotion ? 0.05 : 0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          'relative z-20 bg-white',
          isDragging && 'cursor-grabbing'
        )}
        whileTap={{ scale: disabled ? 1 : (shouldReduceMotion ? 1 : 0.98) }}
      >
        {children}
      </motion.div>
    </div>
  )
}
