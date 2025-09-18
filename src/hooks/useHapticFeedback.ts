/**
 * MeriDesignHouse Haptic Feedback Hook
 * Graceful fallback for devices without haptic support
 */

import { useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

interface HapticFeedbackOptions {
  fallbackToast?: boolean
  fallbackMessage?: string
}

export function useHapticFeedback() {
  const triggerHaptic = useCallback((
    type: HapticType = 'light',
    options: HapticFeedbackOptions = {}
  ) => {
    const { fallbackToast = true, fallbackMessage } = options

    // Check if device supports haptic feedback
    if ('vibrate' in navigator) {
      try {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30],
          success: [10, 50, 10],
          warning: [20, 50, 20],
          error: [30, 100, 30],
        }

        navigator.vibrate(patterns[type])
        return true
      } catch (error) {
        console.warn('Haptic feedback failed:', error)
      }
    }

    // Fallback to toast notification
    if (fallbackToast) {
      const messages = {
        light: fallbackMessage || 'Tıklama',
        medium: fallbackMessage || 'Orta seviye geri bildirim',
        heavy: fallbackMessage || 'Güçlü geri bildirim',
        success: fallbackMessage || 'Başarılı!',
        warning: fallbackMessage || 'Uyarı',
        error: fallbackMessage || 'Hata oluştu',
      }

      const toastType = type === 'success' ? 'success' : 
                       type === 'warning' ? 'warning' : 
                       type === 'error' ? 'error' : 'default'

      toast({
        intent: toastType as any,
        description: messages[type],
        duration: 1000,
      })
    }

    return false
  }, [])

  const success = useCallback((message?: string) => {
    return triggerHaptic('success', { fallbackMessage: message })
  }, [triggerHaptic])

  const warning = useCallback((message?: string) => {
    return triggerHaptic('warning', { fallbackMessage: message })
  }, [triggerHaptic])

  const error = useCallback((message?: string) => {
    return triggerHaptic('error', { fallbackMessage: message })
  }, [triggerHaptic])

  const light = useCallback((message?: string) => {
    return triggerHaptic('light', { fallbackMessage: message })
  }, [triggerHaptic])

  const medium = useCallback((message?: string) => {
    return triggerHaptic('medium', { fallbackMessage: message })
  }, [triggerHaptic])

  const heavy = useCallback((message?: string) => {
    return triggerHaptic('heavy', { fallbackMessage: message })
  }, [triggerHaptic])

  return {
    triggerHaptic,
    success,
    warning,
    error,
    light,
    medium,
    heavy,
  }
}

