'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  ABTest, 
  TestVariant, 
  TestSegment, 
  assignUserToTest, 
  trackTestEvent, 
  getUserSegment,
  monitorTestPerformance,
  isFeatureEnabled
} from '@/lib/ab-testing'

interface UseABTestingOptions {
  testId: string
  userId?: string
  sessionId?: string
  autoTrack?: boolean
  trackPerformance?: boolean
}

interface UseABTestingReturn {
  variant: TestVariant
  isControl: boolean
  isVariantA: boolean
  isVariantB: boolean
  isVariantC: boolean
  trackEvent: (eventType: string, eventData?: Record<string, any>) => void
  trackConversion: (conversionType: string, value?: number) => void
  trackPerformance: (metric: string, value: number) => void
  isLoading: boolean
  error: string | null
}

export function useABTesting({
  testId,
  userId,
  sessionId,
  autoTrack = true,
  trackPerformance = true
}: UseABTestingOptions): UseABTestingReturn {
  const [variant, setVariant] = useState<TestVariant>('control')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generate user and session IDs if not provided
  const effectiveUserId = userId || (typeof window !== 'undefined' ? 
    localStorage.getItem('meri-design-user-id') || 'anonymous' : 'anonymous')
  const effectiveSessionId = sessionId || (typeof window !== 'undefined' ? 
    sessionStorage.getItem('meri-design-session-id') || 'anonymous' : 'anonymous')

  // Assign user to test variant
  useEffect(() => {
    try {
      const assignedVariant = assignUserToTest(testId, effectiveUserId, effectiveSessionId)
      setVariant(assignedVariant)
      
      // Store assignment for consistency
      if (typeof window !== 'undefined') {
        localStorage.setItem(`meri-design-test-${testId}`, assignedVariant)
        sessionStorage.setItem(`meri-design-session-${testId}`, assignedVariant)
      }
      
      // Track assignment
      if (autoTrack) {
        trackTestEvent(testId, assignedVariant, 'test_assigned', {
          user_id: effectiveUserId,
          session_id: effectiveSessionId,
          user_segments: getUserSegment()
        })
      }
      
      // Monitor performance if enabled
      if (trackPerformance) {
        monitorTestPerformance(testId, assignedVariant)
      }
      
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign test variant')
      setIsLoading(false)
    }
  }, [testId, effectiveUserId, effectiveSessionId, autoTrack, trackPerformance])

  // Event tracking functions
  const trackEvent = useCallback((eventType: string, eventData: Record<string, any> = {}) => {
    trackTestEvent(testId, variant, eventType, eventData)
  }, [testId, variant])

  const trackConversion = useCallback((conversionType: string, value?: number) => {
    trackTestEvent(testId, variant, 'conversion', {
      conversion_type: conversionType,
      value,
      timestamp: Date.now()
    })
  }, [testId, variant])

  const trackPerformanceMetric = useCallback((metric: string, value: number) => {
    trackTestEvent(testId, variant, 'performance_metric', {
      metric,
      value,
      timestamp: Date.now()
    })
  }, [testId, variant])

  return {
    variant,
    isControl: variant === 'control',
    isVariantA: variant === 'variant_a',
    isVariantB: variant === 'variant_b',
    isVariantC: variant === 'variant_c',
    trackEvent,
    trackConversion,
    trackPerformance: trackPerformanceMetric,
    isLoading,
    error
  }
}

// Specialized hooks for specific tests
export function useMicroMotionTesting() {
  const { variant, trackEvent, trackPerformance } = useABTesting({
    testId: 'micro_motion_duration',
    autoTrack: true,
    trackPerformance: true
  })

  const getMotionDuration = useCallback((baseDuration: number): number => {
    switch (variant) {
      case 'variant_a':
        return baseDuration * 0.7 // 30% faster
      case 'variant_b':
        return baseDuration * 1.3 // 30% slower
      default:
        return baseDuration
    }
  }, [variant])

  const trackMotionEvent = useCallback((eventType: string, duration: number) => {
    trackEvent(eventType, { duration, variant })
  }, [trackEvent, variant])

  return {
    variant,
    getMotionDuration,
    trackMotionEvent,
    trackPerformance
  }
}

export function useGestureHintsTesting() {
  const { variant, trackEvent } = useABTesting({
    testId: 'gesture_hints_timing',
    autoTrack: true,
    trackPerformance: false
  })

  const getHintDelay = useCallback((): number => {
    switch (variant) {
      case 'variant_a':
        return 1000 // 1 second
      case 'variant_b':
        return 3000 // 3 seconds
      default:
        return 2000 // 2 seconds (control)
    }
  }, [variant])

  const trackHintEvent = useCallback((eventType: string, hintType: string) => {
    trackEvent(eventType, { hint_type: hintType, variant })
  }, [trackEvent, variant])

  return {
    variant,
    getHintDelay,
    trackHintEvent
  }
}

export function useLoaderAnimationsTesting() {
  const { variant, trackEvent, trackPerformance } = useABTesting({
    testId: 'loader_animations',
    autoTrack: true,
    trackPerformance: true
  })

  const getLoaderConfig = useCallback(() => {
    switch (variant) {
      case 'variant_a':
        return {
          duration: 150,
          showShimmer: true,
          showIcon: false
        }
      case 'variant_b':
        return {
          duration: 250,
          showShimmer: false,
          showIcon: true
        }
      default:
        return {
          duration: 200,
          showShimmer: true,
          showIcon: true
        }
    }
  }, [variant])

  const trackLoaderEvent = useCallback((eventType: string, config: any) => {
    trackEvent(eventType, { config, variant })
  }, [trackEvent, variant])

  return {
    variant,
    getLoaderConfig,
    trackLoaderEvent,
    trackPerformance
  }
}

export function useGlassmorphismTesting() {
  const { variant, trackEvent, trackPerformance } = useABTesting({
    testId: 'glassmorphism_intensity',
    autoTrack: true,
    trackPerformance: true
  })

  const getGlassIntensity = useCallback((): 'subtle' | 'medium' | 'strong' => {
    switch (variant) {
      case 'variant_a':
        return 'subtle'
      case 'variant_b':
        return 'strong'
      default:
        return 'medium'
    }
  }, [variant])

  const trackGlassEvent = useCallback((eventType: string, intensity: string) => {
    trackEvent(eventType, { intensity, variant })
  }, [trackEvent, variant])

  return {
    variant,
    getGlassIntensity,
    trackGlassEvent,
    trackPerformance
  }
}

// Feature flag hook
export function useFeatureFlag(feature: string): boolean {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const enabled = isFeatureEnabled(feature as any)
      setIsEnabled(enabled)
      setIsLoading(false)
    } catch (err) {
      console.error('Failed to check feature flag:', err)
      setIsEnabled(false)
      setIsLoading(false)
    }
  }, [feature])

  return isEnabled
}

// Performance monitoring hook
export function usePerformanceMonitoring(testId: string) {
  const [metrics, setMetrics] = useState<Record<string, number>>({})
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      const newMetrics: Record<string, number> = {}
      
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          newMetrics.lcp = entry.startTime
        } else if (entry.entryType === 'layout-shift') {
          newMetrics.cls = (entry as any).value
        } else if (entry.entryType === 'first-input') {
          newMetrics.inp = (entry as any).processingStart - entry.startTime
        }
      }
      
      if (Object.keys(newMetrics).length > 0) {
        setMetrics(prev => ({ ...prev, ...newMetrics }))
      }
    })

    observer.observe({ 
      entryTypes: ['largest-contentful-paint', 'layout-shift', 'first-input'] 
    })

    setIsMonitoring(true)

    return () => {
      observer.disconnect()
      setIsMonitoring(false)
    }
  }, [testId])

  return {
    metrics,
    isMonitoring
  }
}
