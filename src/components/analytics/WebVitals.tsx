'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { useEffect } from 'react'

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP'
  value: number
  id: string
  delta: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

interface PerformanceThresholds {
  LCP: number // ms
  INP: number // ms
  CLS: number
  FCP: number // ms
  TTFB: number // ms
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

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = RATING_THRESHOLDS[name as keyof typeof RATING_THRESHOLDS]
  if (!thresholds) return 'good'
  
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

function logPerformanceIssue(metric: WebVitalsMetric) {
  const { name, value, rating } = metric
  const threshold = THRESHOLDS[name as keyof PerformanceThresholds]
  
  if (rating === 'poor') {
    console.error(`[WebVitals] ${name} is poor: ${value} (threshold: ${threshold})`)
  } else if (rating === 'needs-improvement') {
    console.warn(`[WebVitals] ${name} needs improvement: ${value} (threshold: ${threshold})`)
  }
}

function sendToAnalytics(metric: WebVitalsMetric) {
  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const value = metric.name === 'CLS' ? Math.round(metric.value * 1000) : Math.round(metric.value)
    
    ;(window as any).gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: value,
      custom_map: {
        metric_rating: metric.rating,
        metric_delta: metric.delta,
      },
      non_interaction: true,
    })
  }

  // Custom analytics endpoint (optional)
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {
      // Silently fail if analytics endpoint is not available
    })
  }
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    const rating = getRating(metric.name, metric.value)
    const enhancedMetric: WebVitalsMetric = {
      ...metric,
      rating,
    }

    // Log performance issues
    logPerformanceIssue(enhancedMetric)

    // Send to analytics
    sendToAnalytics(enhancedMetric)
  })

  return null
}

// Performance monitoring utilities
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  const start = performance.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now()
      const duration = end - start
      
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
      
      // Send custom performance metric
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', 'custom_performance', {
          event_category: 'Performance',
          event_label: name,
          value: Math.round(duration),
          non_interaction: true,
        })
      }
    })
  } else {
    const end = performance.now()
    const duration = end - start
    
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    
    // Send custom performance metric
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'custom_performance', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(duration),
        non_interaction: true,
      })
    }
  }
}

// Performance budget checker
export function checkPerformanceBudget() {
  if (typeof window === 'undefined') return

  const budget = {
    LCP: 2500,
    INP: 200,
    CLS: 0.1,
    FCP: 1800,
    TTFB: 800,
  }

  // Check if we're within budget
  const isWithinBudget = (metric: string, value: number) => {
    const threshold = budget[metric as keyof typeof budget]
    return value <= threshold
  }

  // This would be called after page load
  return {
    budget,
    isWithinBudget,
  }
}
