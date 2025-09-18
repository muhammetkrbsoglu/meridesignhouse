'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Clock,
  Target,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  threshold: number
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  description: string
  recommendations: string[]
}

interface AuditResult {
  overall: 'excellent' | 'good' | 'needs-improvement' | 'poor'
  score: number
  metrics: PerformanceMetric[]
  summary: {
    totalIssues: number
    criticalIssues: number
    warnings: number
    optimizations: string[]
  }
}

export function PerformanceAudit() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)

  // Run performance audit
  const runAudit = async () => {
    setIsRunning(true)
    setIsLoading(true)

    try {
      // Simulate audit process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock audit results - in real app, this would come from actual performance data
      const mockResult: AuditResult = {
        overall: 'good',
        score: 85,
        metrics: [
          {
            name: 'LCP',
            value: 1.8,
            unit: 's',
            threshold: 2.0,
            status: 'good',
            trend: 'down',
            description: 'Largest Contentful Paint',
            recommendations: [
              'Optimize hero images with WebP format',
              'Implement critical CSS inlining',
              'Consider image preloading for above-the-fold content'
            ]
          },
          {
            name: 'INP',
            value: 120,
            unit: 'ms',
            threshold: 150,
            status: 'good',
            trend: 'stable',
            description: 'Interaction to Next Paint',
            recommendations: [
              'Optimize JavaScript execution',
              'Reduce main thread blocking time',
              'Implement code splitting for non-critical features'
            ]
          },
          {
            name: 'CLS',
            value: 0.05,
            unit: '',
            threshold: 0.08,
            status: 'good',
            trend: 'down',
            description: 'Cumulative Layout Shift',
            recommendations: [
              'Set explicit dimensions for images',
              'Reserve space for dynamic content',
              'Avoid inserting content above existing content'
            ]
          },
          {
            name: 'FCP',
            value: 1.2,
            unit: 's',
            threshold: 1.5,
            status: 'good',
            trend: 'down',
            description: 'First Contentful Paint',
            recommendations: [
              'Minimize render-blocking resources',
              'Optimize font loading',
              'Reduce server response time'
            ]
          },
          {
            name: 'TTFB',
            value: 400,
            unit: 'ms',
            threshold: 500,
            status: 'good',
            trend: 'stable',
            description: 'Time to First Byte',
            recommendations: [
              'Optimize server response time',
              'Use CDN for static assets',
              'Implement caching strategies'
            ]
          },
          {
            name: 'FPS',
            value: 55,
            unit: 'fps',
            threshold: 30,
            status: 'good',
            trend: 'stable',
            description: 'Frames Per Second',
            recommendations: [
              'Optimize animation performance',
              'Use transform and opacity for animations',
              'Implement requestAnimationFrame for smooth animations'
            ]
          }
        ],
        summary: {
          totalIssues: 2,
          criticalIssues: 0,
          warnings: 2,
          optimizations: [
            'Image optimization with WebP format',
            'Critical CSS inlining',
            'JavaScript code splitting',
            'Font loading optimization'
          ]
        }
      }

      setAuditResult(mockResult)
    } catch (error) {
      console.error('Performance audit failed:', error)
    } finally {
      setIsLoading(false)
      setIsRunning(false)
    }
  }

  // Run audit on mount
  useEffect(() => {
    runAudit()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />
      default:
        return <Target className="w-4 h-4 text-gray-500" />
    }
  }

  const getOverallStatus = (overall: string) => {
    switch (overall) {
      case 'excellent':
        return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle }
      case 'good':
        return { color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle }
      case 'needs-improvement':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle }
      case 'poor':
        return { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', icon: Activity }
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full"
            />
            <span className="ml-3 text-gray-600">Audit çalıştırılıyor...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!auditResult) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Audit çalıştırılamadı</p>
            <Button onClick={runAudit} disabled={isRunning}>
              {isRunning ? 'Çalıştırılıyor...' : 'Tekrar Dene'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const overallStatus = getOverallStatus(auditResult.overall)
  const OverallIcon = overallStatus.icon

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Audit
            </CardTitle>
            <Button 
              onClick={runAudit} 
              disabled={isRunning}
              variant="outline"
              size="sm"
            >
              {isRunning ? 'Çalıştırılıyor...' : 'Yeniden Çalıştır'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg ${overallStatus.bg}`}>
            <div className="flex items-center gap-3 mb-2">
              <OverallIcon className={`w-6 h-6 ${overallStatus.color}`} />
              <h3 className={`text-lg font-semibold ${overallStatus.color}`}>
                {auditResult.overall === 'excellent' ? 'Mükemmel' :
                 auditResult.overall === 'good' ? 'İyi' :
                 auditResult.overall === 'needs-improvement' ? 'İyileştirme Gerekli' :
                 'Zayıf'}
              </h3>
              <Badge variant="secondary" className="ml-auto">
                {auditResult.score}/100
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {auditResult.summary.totalIssues} sorun tespit edildi, 
              {auditResult.summary.criticalIssues} kritik, 
              {auditResult.summary.warnings} uyarı
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {auditResult.metrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {metric.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(metric.status)}
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {metric.value}{metric.unit}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {metric.threshold}{metric.unit}
                    </span>
                  </div>
                  
                  <Progress 
                    value={(metric.value / metric.threshold) * 100} 
                    className="h-2"
                  />
                  
                  <p className="text-xs text-gray-600">
                    {metric.description}
                  </p>
                  
                  {metric.recommendations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700">
                        Öneriler:
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {metric.recommendations.slice(0, 2).map((rec, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-rose-500 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Optimizasyon Önerileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auditResult.summary.optimizations.map((optimization, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <Clock className="w-4 h-4 text-rose-500" />
                <span className="text-sm text-gray-700">{optimization}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

