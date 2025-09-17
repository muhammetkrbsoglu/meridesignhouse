'use client'

import { useToast } from '@/contexts/ToastContext'
import { ToastContainer as SmartToastContainer } from './SmartToast'

export function ToastContainer() {
  const { toasts, dismissToast, handleAction } = useToast()

  const topToasts = toasts.filter(toast => toast.position === 'top')
  const bottomToasts = toasts.filter(toast => toast.position === 'bottom')

  return (
    <>
      {/* Top Toasts - Critical messages */}
      <SmartToastContainer
        toasts={topToasts}
        onDismiss={dismissToast}
        onAction={handleAction}
        position="top"
        maxToasts={2}
        className="top-0 left-0 right-0 safe-pt"
      />

      {/* Bottom Toasts - General messages */}
      <SmartToastContainer
        toasts={bottomToasts}
        onDismiss={dismissToast}
        onAction={handleAction}
        position="bottom"
        maxToasts={3}
        className="bottom-0 left-0 right-0 safe-pb"
      />
    </>
  )
}
