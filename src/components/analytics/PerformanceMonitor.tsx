'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, XCircle, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PerformanceMetrics {
  LCP?: number
  INP?: number
  CLS?: number
  FCP?: number
  TTFB?: number
}

interface PerformanceStatus {
  metric: string
  value: number
  threshold: number
  rating: 'good' | 'needs-improvement' | 'poor'
  status: 'pass' | 'warning' | 'fail'
}

const THRESHOLDS = {
  LCP: 2500, // ms
  INP: 200,  // ms
  CLS: 0.1,  // 0.1
  FCP: 1800, // ms
  TTFB: 800, // ms
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

function getStatus(metric: string, value: number): 'pass' | 'warning' | 'fail' {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS]
  if (!threshold) return 'pass'
  
  if (value <= threshold) return 'pass'
  if (value <= threshold * 1.5) return 'warning'
  return 'fail'
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Listen for custom performance events
    const handlePerformanceEvent = (event: CustomEvent) => {
      const { name, value } = event.detail
      setMetrics(prev => ({ ...prev, [name]: value }))
    }

    window.addEventListener('performance-metric', handlePerformanceEvent as EventListener)
    
    return () => {
      window.removeEventListener('performance-metric', handlePerformanceEvent as EventListener)
    }
  }, [])

  const getPerformanceStatuses = (): PerformanceStatus[] => {
    return Object.entries(metrics).map(([metric, value]) => {
      const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS] || 0
      const rating = getRating(metric, value)
      const status = getStatus(metric, value)
      
      return {
        metric,
        value,
        threshold,
        rating,
        status,
      }
    })
  }

  const statuses = getPerformanceStatuses()
  const hasIssues = statuses.some(status => status.status !== 'pass')
  const hasWarnings = statuses.some(status => status.status === 'warning')
  const hasFailures = statuses.some(status => status.status === 'fail')

  // Show monitor if there are performance issues
  useEffect(() => {
    if (hasIssues && process.env.NODE_ENV === 'development') {
      setIsVisible(true)
    }
  }, [hasIssues])

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'fail':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatValue = (metric: string, value: number) => {
    if (metric === 'CLS') {
      return value.toFixed(3)
    }
    return `${Math.round(value)}ms`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={hasFailures ? 'bg-red-100 text-red-800' : hasWarnings ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
              >
                {hasFailures ? 'Issues' : hasWarnings ? 'Warnings' : 'Good'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? '−' : '+'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {statuses.map((status) => (
                    <div key={status.metric} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status.status)}
                        <span className="text-sm font-medium">{status.metric}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {formatValue(status.metric, status.value)}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(status.status)}`}
                        >
                          {status.rating}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {statuses.length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-4">
                      No performance metrics available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
