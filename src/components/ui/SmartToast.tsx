'use client'

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Copy, Undo, ExternalLink } from 'lucide-react'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition = 'top' | 'bottom'
export type ToastPriority = 'low' | 'normal' | 'high' | 'critical'

interface ToastAction {
  label: string
  action: () => void
  icon?: React.ElementType
}

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  position: ToastPosition
  priority: ToastPriority
  duration?: number
  action?: ToastAction
  dismissible?: boolean
  persistent?: boolean
  timestamp: number
}

interface SmartToastProps {
  toast: Toast
  onDismiss: (id: string) => void
  onAction?: (action: ToastAction, toastId: string) => void
  className?: string
}

const toastConfigs = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-500',
    shadowColor: 'shadow-green-500/20'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-500',
    shadowColor: 'shadow-red-500/20'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-500',
    shadowColor: 'shadow-yellow-500/20'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-500',
    shadowColor: 'shadow-blue-500/20'
  }
}

const priorityDurations = {
  low: 2000,
  normal: 3000,
  high: 4000,
  critical: 5000
}

export function SmartToast({ toast, onDismiss, onAction, className }: SmartToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReduceMotion = useReducedMotion()
  const { light, success, error } = useHapticFeedback()
  const dragRef = useRef<HTMLDivElement>(null)

  const config = toastConfigs[toast.type]
  const Icon = config.icon
  const duration = toast.duration || priorityDurations[toast.priority]

  // Auto-dismiss logic
  useEffect(() => {
    if (toast.persistent || isPaused || isHovered) return

    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(toast.id), 300) // Wait for exit animation
    }, duration)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [toast.id, toast.persistent, duration, isPaused, isHovered, onDismiss])

  // Haptic feedback on show
  useEffect(() => {
    if (toast.type === 'success') success()
    else if (toast.type === 'error') error()
    else light()
  }, [toast.type, success, error, light])

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onDismiss(toast.id), 300)
  }, [toast.id, onDismiss])

  const handleAction = useCallback(() => {
    if (toast.action && onAction) {
      onAction(toast.action, toast.id)
      light()
    }
  }, [toast.action, onAction, toast.id, light])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleTouchStart = useCallback(() => {
    setIsPaused(true)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsPaused(false)
  }, [])

  const getPositionClasses = () => {
    if (toast.position === 'top') {
      return 'top-4 left-1/2 -translate-x-1/2'
    }
    return 'bottom-4 left-1/2 -translate-x-1/2'
  }

  const getAnimationVariants = () => {
    const baseVariants = {
      hidden: { 
        opacity: 0, 
        scale: shouldReduceMotion ? 1 : 0.95,
        y: shouldReduceMotion ? 0 : (toast.position === 'top' ? -20 : 20)
      },
      visible: { 
        opacity: 1, 
        scale: 1,
        y: 0
      },
      exit: { 
        opacity: 0, 
        scale: shouldReduceMotion ? 1 : 0.95,
        y: shouldReduceMotion ? 0 : (toast.position === 'top' ? -20 : 20)
      }
    }

    return baseVariants
  }

  if (!isVisible) return null

  return (
    <motion.div
      ref={dragRef}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={getAnimationVariants()}
      transition={{ 
        type: 'spring', 
        damping: 20, 
        stiffness: 300,
        duration: shouldReduceMotion ? 0.1 : 0.3
      }}
      className={cn(
        'fixed z-[9999] max-w-sm w-full mx-4',
        getPositionClasses(),
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      drag={toast.dismissible !== false ? 'x' : false}
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 50) {
          handleDismiss()
        }
      }}
    >
      <motion.div
        className={cn(
          'relative p-4 rounded-xl border backdrop-blur-sm',
          'shadow-lg hover:shadow-xl transition-shadow duration-200',
          config.bgColor,
          config.borderColor,
          config.shadowColor
        )}
        whileHover={{ scale: shouldReduceMotion ? 1 : 1.02 }}
        whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
      >
        {/* Close Button */}
        {toast.dismissible !== false && (
          <button
            onClick={handleDismiss}
            className={cn(
              'absolute top-2 right-2 p-1 rounded-full',
              'hover:bg-black/5 dark:hover:bg-white/5',
              'transition-colors duration-200',
              config.textColor
            )}
            aria-label="Toast'ı kapat"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Content */}
        <div className="flex items-start gap-3 pr-6">
          {/* Icon */}
          <div className={cn('flex-shrink-0', config.iconColor)}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h4 className={cn('font-semibold text-sm', config.textColor)}>
              {toast.title}
            </h4>
            {toast.message && (
              <p className={cn('text-xs mt-1 leading-relaxed', config.textColor)}>
                {toast.message}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {toast.action && (
          <motion.button
            onClick={handleAction}
            className={cn(
              'mt-3 w-full px-3 py-2 rounded-lg text-xs font-medium',
              'bg-white/50 dark:bg-black/20',
              'hover:bg-white/70 dark:hover:bg-black/30',
              'transition-colors duration-200',
              'flex items-center justify-center gap-2',
              config.textColor
            )}
            whileHover={{ scale: shouldReduceMotion ? 1 : 1.02 }}
            whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
          >
            {toast.action.icon && (
              <toast.action.icon className="w-3 h-3" />
            )}
            {toast.action.label}
          </motion.button>
        )}

        {/* Progress Bar */}
        {!toast.persistent && !isPaused && !isHovered && (
          <motion.div
            className={cn(
              'absolute bottom-0 left-0 h-1 rounded-b-xl',
              config.iconColor.replace('text-', 'bg-')
            )}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
  onAction?: (action: ToastAction, toastId: string) => void
  position: ToastPosition
  maxToasts?: number
  className?: string
}

export function ToastContainer({ 
  toasts, 
  onDismiss, 
  onAction, 
  position, 
  maxToasts = 3,
  className 
}: ToastContainerProps) {
  const filteredToasts = toasts
    .filter(toast => toast.position === position)
    .slice(0, maxToasts)

  return (
    <div className={cn('fixed z-[9998]', className)}>
      <AnimatePresence mode="popLayout">
        {filteredToasts.map((toast) => (
          <SmartToast
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Toast Manager Hook
export function useSmartToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      timestamp: Date.now()
    }

    setToasts(prev => {
      // Remove old toasts of same type if critical
      if (toast.priority === 'critical') {
        return [newToast, ...prev.filter(t => t.priority !== 'critical')]
      }
      
      // Add to beginning, maintain max count
      const updated = [newToast, ...prev]
      return updated.slice(0, 6) // Max 6 toasts total
    })
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  const handleAction = useCallback((action: ToastAction, toastId: string) => {
    action.action()
    dismissToast(toastId)
  }, [dismissToast])

  return {
    toasts,
    addToast,
    dismissToast,
    dismissAll,
    handleAction
  }
}

// Convenience functions
export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => {
    // This will be used by the toast hook
    return { type: 'success' as const, title, message, ...options }
  },
  error: (title: string, message?: string, options?: Partial<Toast>) => {
    return { type: 'error' as const, title, message, ...options }
  },
  warning: (title: string, message?: string, options?: Partial<Toast>) => {
    return { type: 'warning' as const, title, message, ...options }
  },
  info: (title: string, message?: string, options?: Partial<Toast>) => {
    return { type: 'info' as const, title, message, ...options }
  }
}
