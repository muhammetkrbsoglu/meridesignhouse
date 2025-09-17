'use client'

import { useEffect, useCallback } from 'react'

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

interface PerformanceThresholds {
  LCP: number
  INP: number
  CLS: number
  FCP: number
  TTFB: number
}

const THRESHOLDS: PerformanceThresholds = {
  LCP: 2500, // 2.5s
  INP: 200,  // 200ms
  CLS: 0.1,  // 0.1
  FCP: 1800, // 1.8s
  TTFB: 800, // 800ms
}

const RATING_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
}

function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = RATING_THRESHOLDS[metric as keyof typeof RATING_THRESHOLDS]
  if (!thresholds) return 'good'
  
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

export function usePerformanceMeasurement() {
  const measureCustomMetric = useCallback((name: string, fn: () => void | Promise<void>) => {
    const start = performance.now()
    
    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now()
        const duration = end - start
        
        // Dispatch custom performance event
        const event = new CustomEvent('performance-metric', {
          detail: {
            name,
            value: duration,
            rating: getRating(name, duration),
            delta: duration,
            id: `${name}-${Date.now()}`,
          }
        })
        
        window.dispatchEvent(event)
      })
    } else {
      const end = performance.now()
      const duration = end - start
      
      // Dispatch custom performance event
      const event = new CustomEvent('performance-metric', {
        detail: {
          name,
          value: duration,
          rating: getRating(name, duration),
          delta: duration,
          id: `${name}-${Date.now()}`,
        }
      })
      
      window.dispatchEvent(event)
    }
  }, [])

  const measureAsync = useCallback(async (name: string, fn: () => Promise<void>) => {
    const start = performance.now()
    
    try {
      await fn()
    } finally {
      const end = performance.now()
      const duration = end - start
      
      // Dispatch custom performance event
      const event = new CustomEvent('performance-metric', {
        detail: {
          name,
          value: duration,
          rating: getRating(name, duration),
          delta: duration,
          id: `${name}-${Date.now()}`,
        }
      })
      
      window.dispatchEvent(event)
    }
  }, [])

  const measureComponentRender = useCallback((componentName: string, renderFn: () => void) => {
    const start = performance.now()
    
    renderFn()
    
    const end = performance.now()
    const duration = end - start
    
    // Dispatch custom performance event
    const event = new CustomEvent('performance-metric', {
      detail: {
        name: `${componentName}-render`,
        value: duration,
        rating: getRating(`${componentName}-render`, duration),
        delta: duration,
        id: `${componentName}-render-${Date.now()}`,
      }
    })
    
    window.dispatchEvent(event)
  }, [])

  const measureImageLoad = useCallback((imageSrc: string) => {
    const start = performance.now()
    
    const img = new Image()
    img.onload = () => {
      const end = performance.now()
      const duration = end - start
      
      // Dispatch custom performance event
      const event = new CustomEvent('performance-metric', {
        detail: {
          name: 'image-load',
          value: duration,
          rating: getRating('image-load', duration),
          delta: duration,
          id: `image-load-${Date.now()}`,
          metadata: { src: imageSrc }
        }
      })
      
      window.dispatchEvent(event)
    }
    
    img.src = imageSrc
  }, [])

  const measureApiCall = useCallback(async (endpoint: string, fn: () => Promise<any>) => {
    const start = performance.now()
    
    try {
      const result = await fn()
      return result
    } finally {
      const end = performance.now()
      const duration = end - start
      
      // Dispatch custom performance event
      const event = new CustomEvent('performance-metric', {
        detail: {
          name: 'api-call',
          value: duration,
          rating: getRating('api-call', duration),
          delta: duration,
          id: `api-call-${Date.now()}`,
          metadata: { endpoint }
        }
      })
      
      window.dispatchEvent(event)
    }
  }, [])

  return {
    measureCustomMetric,
    measureAsync,
    measureComponentRender,
    measureImageLoad,
    measureApiCall,
    thresholds: THRESHOLDS,
  }
}
