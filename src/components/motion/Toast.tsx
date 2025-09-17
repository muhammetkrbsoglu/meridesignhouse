/**
 * MeriDesignHouse Toast Component
 * Positioned at bottom with haptic feedback
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: (id: string) => void
}

const toastVariants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
}

const typeConfig = {
  success: {
    icon: CheckCircle2,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-600',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-600',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-600',
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-600',
  },
}

export function Toast({
  id,
  title,
  description,
  type = 'info',
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const { triggerHaptic } = useHapticFeedback()

  useEffect(() => {
    // Trigger haptic feedback on show
    triggerHaptic(type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success')

    // Auto close after duration
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300) // Wait for exit animation
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose, type, triggerHaptic])

  const config = typeConfig[type]
  const Icon = config.icon

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
          variants={toastVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm',
              config.className
            )}
          >
            <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconClassName)} />
            
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className="text-sm font-semibold mb-1">{title}</h4>
              )}
              {description && (
                <p className="text-sm opacity-90">{description}</p>
              )}
            </div>
            
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(() => onClose(id), 300)
              }}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
              aria-label="Toast'u kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// Toast Manager Hook
export function useToastManager() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast,
    }
    
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, description?: string) => {
    addToast({ title, description, type: 'success' })
  }

  const error = (title: string, description?: string) => {
    addToast({ title, description, type: 'error' })
  }

  const warning = (title: string, description?: string) => {
    addToast({ title, description, type: 'warning' })
  }

  const info = (title: string, description?: string) => {
    addToast({ title, description, type: 'info' })
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}

// Toast Container Component
export function ToastContainer() {
  const { toasts } = useToastManager()

  return (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  )
}
