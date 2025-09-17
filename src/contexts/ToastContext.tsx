'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSmartToast, Toast, ToastAction } from '@/components/ui/SmartToast'

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void
  dismissToast: (id: string) => void
  dismissAll: () => void
  handleAction: (action: ToastAction, toastId: string) => void
  
  // Convenience methods
  success: (title: string, message?: string, options?: Partial<Toast>) => void
  error: (title: string, message?: string, options?: Partial<Toast>) => void
  warning: (title: string, message?: string, options?: Partial<Toast>) => void
  info: (title: string, message?: string, options?: Partial<Toast>) => void
  
  // Specialized methods
  criticalError: (title: string, message?: string) => void
  copySuccess: (text: string) => void
  undoAction: (action: () => void, label: string) => void
  networkError: () => void
  validationError: (field: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, dismissToast, dismissAll, handleAction } = useSmartToast()

  const success = (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'success',
      title,
      message,
      position: 'bottom',
      priority: 'normal',
      dismissible: true,
      ...options
    })
  }

  const error = (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'error',
      title,
      message,
      position: 'bottom',
      priority: 'normal',
      dismissible: true,
      ...options
    })
  }

  const warning = (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'warning',
      title,
      message,
      position: 'bottom',
      priority: 'normal',
      dismissible: true,
      ...options
    })
  }

  const info = (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'info',
      title,
      message,
      position: 'bottom',
      priority: 'low',
      dismissible: true,
      ...options
    })
  }

  const criticalError = (title: string, message?: string) => {
    addToast({
      type: 'error',
      title,
      message,
      position: 'top',
      priority: 'critical',
      dismissible: true,
      duration: 5000
    })
  }

  const copySuccess = (text: string) => {
    addToast({
      type: 'success',
      title: 'Kopyalandı!',
      message: text.length > 50 ? `${text.substring(0, 50)}...` : text,
      position: 'bottom',
      priority: 'low',
      dismissible: true,
      duration: 2000,
      action: {
        label: 'Tekrar Kopyala',
        action: () => navigator.clipboard.writeText(text),
        icon: Copy
      }
    })
  }

  const undoAction = (action: () => void, label: string) => {
    addToast({
      type: 'info',
      title: 'İşlem tamamlandı',
      message: 'Geri almak için tıklayın',
      position: 'bottom',
      priority: 'normal',
      dismissible: true,
      duration: 4000,
      action: {
        label,
        action,
        icon: Undo
      }
    })
  }

  const networkError = () => {
    addToast({
      type: 'error',
      title: 'Bağlantı Hatası',
      message: 'İnternet bağlantınızı kontrol edin',
      position: 'top',
      priority: 'high',
      dismissible: true,
      duration: 5000,
      action: {
        label: 'Tekrar Dene',
        action: () => window.location.reload(),
        icon: ExternalLink
      }
    })
  }

  const validationError = (field: string) => {
    addToast({
      type: 'warning',
      title: 'Eksik Bilgi',
      message: `${field} alanı zorunludur`,
      position: 'bottom',
      priority: 'normal',
      dismissible: true,
      duration: 3000
    })
  }

  const value: ToastContextType = {
    toasts,
    addToast,
    dismissToast,
    dismissAll,
    handleAction,
    success,
    error,
    warning,
    info,
    criticalError,
    copySuccess,
    undoAction,
    networkError,
    validationError
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
