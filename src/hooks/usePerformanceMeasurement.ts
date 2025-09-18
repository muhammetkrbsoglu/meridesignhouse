'use client'

import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
}

export function usePerformanceMeasurement(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const renderStartRef = useRef<number>(Date.now())

  useEffect(() => {
    const loadTime = Date.now() - startTimeRef.current
    const renderTime = Date.now() - renderStartRef.current

    // Measure interaction time (time to first interaction)
    const measureInteraction = () => {
      const interactionTime = Date.now() - startTimeRef.current
      setMetrics({
        loadTime,
        renderTime,
        interactionTime
      })

      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName}:`, {
          loadTime: `${loadTime}ms`,
          renderTime: `${renderTime}ms`,
          interactionTime: `${interactionTime}ms`
        })
      }
    }

    // Listen for first user interaction
    const handleFirstInteraction = () => {
      measureInteraction()
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
      document.removeEventListener('scroll', handleFirstInteraction)
    }

    document.addEventListener('click', handleFirstInteraction, { once: true })
    document.addEventListener('keydown', handleFirstInteraction, { once: true })
    document.addEventListener('scroll', handleFirstInteraction, { once: true })

    // Fallback: measure after 5 seconds if no interaction
    const fallbackTimer = setTimeout(measureInteraction, 5000)

    return () => {
      clearTimeout(fallbackTimer)
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
      document.removeEventListener('scroll', handleFirstInteraction)
    }
  }, [componentName])

  const markRenderStart = () => {
    renderStartRef.current = Date.now()
  }

  const markRenderEnd = () => {
    const renderTime = Date.now() - renderStartRef.current
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} render time: ${renderTime}ms`)
    }
  }

  const measureAsync = async (operationName: string, operation: () => Promise<void>) => {
    const start = Date.now()
    try {
      await operation()
      const duration = Date.now() - start
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} - ${operationName}: ${duration}ms`)
      }
    } catch (error) {
      const duration = Date.now() - start
      if (process.env.NODE_ENV === 'development') {
        console.error(`[Performance] ${componentName} - ${operationName} failed after ${duration}ms:`, error)
      }
      throw error
    }
  }

  return {
    metrics,
    markRenderStart,
    markRenderEnd,
    measureAsync
  }
}