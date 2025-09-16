"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={4000} swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props} className="border-gray-200/50">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {variant === 'destructive' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : props.className?.includes('bg-green-50') ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : props.className?.includes('bg-blue-50') ? (
                  <Info className="h-5 w-5 text-blue-600" />
                ) : (
                  <Info className="h-5 w-5 text-rose-600" />
                )}
              </div>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}