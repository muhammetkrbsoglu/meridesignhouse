'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Zap,
  Shield,
  Database,
  Globe,
  Settings,
  Code,
  Image,
  Palette,
  Smartphone,
  Monitor,
  Eye,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'

interface ChecklistItem {
  id: string
  title: string
  description: string
  category: 'performance' | 'accessibility' | 'responsive' | 'security' | 'analytics' | 'deployment'
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
  dependencies?: string[]
  notes?: string
}

interface DeploymentStatus {
  overall: 'ready' | 'not-ready' | 'in-progress'
  completed: number
  total: number
  criticalIssues: number
  warnings: number
}

export function DeploymentChecklist() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [status, setStatus] = useState<DeploymentStatus>({
    overall: 'not-ready',
    completed: 0,
    total: 0,
    criticalIssues: 0,
    warnings: 0
  })
  const [isRunning, setIsRunning] = useState(false)

  // Initialize checklist
  useEffect(() => {
    const initialChecklist: ChecklistItem[] = [
      // Performance
      {
        id: 'perf-lcp',
        title: 'LCP Optimization',
        description: 'Largest Contentful Paint < 2.0s',
        category: 'performance',
        status: 'completed',
        priority: 'high',
        estimatedTime: '2h',
        notes: 'Hero images optimized, critical CSS inlined'
      },
      {
        id: 'perf-inp',
        title: 'INP Optimization',
        description: 'Interaction to Next Paint < 150ms',
        category: 'performance',
        status: 'completed',
        priority: 'high',
        estimatedTime: '3h',
        notes: 'JavaScript execution optimized, code splitting implemented'
      },
      {
        id: 'perf-cls',
        title: 'CLS Prevention',
        description: 'Cumulative Layout Shift < 0.08',
        category: 'performance',
        status: 'completed',
        priority: 'high',
        estimatedTime: '1h',
        notes: 'Image dimensions set, dynamic content space reserved'
      },
      {
        id: 'perf-bundle',
        title: 'Bundle Size Optimization',
        description: 'JavaScript bundle < 250KB gzipped',
        category: 'performance',
        status: 'in-progress',
        priority: 'medium',
        estimatedTime: '2h',
        notes: 'Tree shaking implemented, dynamic imports added'
      },
      {
        id: 'perf-images',
        title: 'Image Optimization',
        description: 'WebP format, lazy loading, responsive images',
        category: 'performance',
        status: 'completed',
        priority: 'high',
        estimatedTime: '1h',
        notes: 'ImageKit integration, blur-up effects'
      },

      // Accessibility
      {
        id: 'a11y-keyboard',
        title: 'Keyboard Navigation',
        description: 'All interactive elements keyboard accessible',
        category: 'accessibility',
        status: 'completed',
        priority: 'high',
        estimatedTime: '2h',
        notes: 'Tab order, focus management, ARIA labels'
      },
      {
        id: 'a11y-screen-reader',
        title: 'Screen Reader Support',
        description: 'ARIA labels, roles, and live regions',
        category: 'accessibility',
        status: 'completed',
        priority: 'high',
        estimatedTime: '3h',
        notes: 'Comprehensive ARIA implementation'
      },
      {
        id: 'a11y-contrast',
        title: 'Color Contrast',
        description: 'WCAG AA compliance (4.5:1 ratio)',
        category: 'accessibility',
        status: 'completed',
        priority: 'high',
        estimatedTime: '1h',
        notes: 'Dark/light mode contrast verified'
      },
      {
        id: 'a11y-motion',
        title: 'Reduced Motion Support',
        description: 'prefers-reduced-motion implementation',
        category: 'accessibility',
        status: 'completed',
        priority: 'medium',
        estimatedTime: '1h',
        notes: 'Motion system respects user preferences'
      },

      // Responsive Design
      {
        id: 'resp-mobile',
        title: 'Mobile Layout (320px-768px)',
        description: 'Touch-friendly, mobile-first design',
        category: 'responsive',
        status: 'completed',
        priority: 'high',
        estimatedTime: '4h',
        notes: 'Card-based layout, gesture support'
      },
      {
        id: 'resp-tablet',
        title: 'Tablet Layout (768px-1024px)',
        description: 'Adaptive grid and spacing',
        category: 'responsive',
        status: 'completed',
        priority: 'medium',
        estimatedTime: '2h',
        notes: 'Grid adjustments, hover states'
      },
      {
        id: 'resp-desktop',
        title: 'Desktop Layout (1024px+)',
        description: 'Hover states, advanced interactions',
        category: 'responsive',
        status: 'completed',
        priority: 'medium',
        estimatedTime: '2h',
        notes: 'Hover effects, advanced micro-feedback'
      },
      {
        id: 'resp-orientation',
        title: 'Orientation Changes',
        description: 'Portrait/landscape adaptation',
        category: 'responsive',
        status: 'in-progress',
        priority: 'low',
        estimatedTime: '1h',
        notes: 'Minor layout shifts on orientation change'
      },

      // Security
      {
        id: 'sec-https',
        title: 'HTTPS Configuration',
        description: 'SSL/TLS certificate and redirects',
        category: 'security',
        status: 'pending',
        priority: 'high',
        estimatedTime: '30m',
        notes: 'Production SSL setup required'
      },
      {
        id: 'sec-headers',
        title: 'Security Headers',
        description: 'CSP, HSTS, X-Frame-Options',
        category: 'security',
        status: 'pending',
        priority: 'high',
        estimatedTime: '1h',
        notes: 'Security headers configuration'
      },
      {
        id: 'sec-auth',
        title: 'Authentication Security',
        description: 'Secure auth flow, session management',
        category: 'security',
        status: 'completed',
        priority: 'high',
        estimatedTime: '2h',
        notes: 'Supabase auth integration'
      },

      // Analytics
      {
        id: 'analytics-ga4',
        title: 'Google Analytics 4',
        description: 'GA4 tracking and events',
        category: 'analytics',
        status: 'completed',
        priority: 'medium',
        estimatedTime: '1h',
        notes: 'Web Vitals, custom events tracking'
      },
      {
        id: 'analytics-ab',
        title: 'A/B Testing Setup',
        description: 'Feature flags and test infrastructure',
        category: 'analytics',
        status: 'completed',
        priority: 'medium',
        estimatedTime: '2h',
        notes: 'Motion, gesture, loader testing'
      },
      {
        id: 'analytics-monitoring',
        title: 'Performance Monitoring',
        description: 'Real-time performance tracking',
        category: 'analytics',
        status: 'completed',
        priority: 'medium',
        estimatedTime: '1h',
        notes: 'Live performance dashboard'
      },

      // Deployment
      {
        id: 'deploy-build',
        title: 'Production Build',
        description: 'Optimized build, minification, tree-shaking',
        category: 'deployment',
        status: 'in-progress',
        priority: 'high',
        estimatedTime: '1h',
        notes: 'Next.js production build optimization'
      },
      {
        id: 'deploy-cdn',
        title: 'CDN Configuration',
        description: 'Static assets, caching strategy',
        category: 'deployment',
        status: 'pending',
        priority: 'high',
        estimatedTime: '2h',
        notes: 'ImageKit CDN, cache headers'
      },
      {
        id: 'deploy-env',
        title: 'Environment Variables',
        description: 'Production environment configuration',
        category: 'deployment',
        status: 'pending',
        priority: 'high',
        estimatedTime: '30m',
        notes: 'Supabase, ImageKit, analytics keys'
      },
      {
        id: 'deploy-monitoring',
        title: 'Error Monitoring',
        description: 'Sentry or similar error tracking',
        category: 'deployment',
        status: 'pending',
        priority: 'medium',
        estimatedTime: '1h',
        notes: 'Error logging and alerting setup'
      }
    ]

    setChecklist(initialChecklist)
  }, [])

  // Update status when checklist changes
  useEffect(() => {
    const completed = checklist.filter(item => item.status === 'completed').length
    const total = checklist.length
    const criticalIssues = checklist.filter(item => 
      item.status === 'failed' && item.priority === 'high'
    ).length
    const warnings = checklist.filter(item => 
      item.status === 'in-progress' || (item.status === 'failed' && item.priority !== 'high')
    ).length

    const overall = criticalIssues > 0 ? 'not-ready' : 
                   warnings > 0 ? 'in-progress' : 'ready'

    setStatus({
      overall,
      completed,
      total,
      criticalIssues,
      warnings
    })
  }, [checklist])

  const updateItemStatus = (id: string, newStatus: ChecklistItem['status']) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ))
  }

  const runAutoCheck = async () => {
    setIsRunning(true)
    
    // Simulate automated checks
    const checks = [
      { id: 'perf-lcp', status: 'completed' as const },
      { id: 'perf-inp', status: 'completed' as const },
      { id: 'perf-cls', status: 'completed' as const },
      { id: 'perf-images', status: 'completed' as const },
      { id: 'a11y-keyboard', status: 'completed' as const },
      { id: 'a11y-screen-reader', status: 'completed' as const },
      { id: 'a11y-contrast', status: 'completed' as const },
      { id: 'a11y-motion', status: 'completed' as const },
      { id: 'resp-mobile', status: 'completed' as const },
      { id: 'resp-tablet', status: 'completed' as const },
      { id: 'resp-desktop', status: 'completed' as const },
      { id: 'sec-auth', status: 'completed' as const },
      { id: 'analytics-ga4', status: 'completed' as const },
      { id: 'analytics-ab', status: 'completed' as const },
      { id: 'analytics-monitoring', status: 'completed' as const },
      { id: 'perf-bundle', status: 'in-progress' as const },
      { id: 'resp-orientation', status: 'in-progress' as const },
      { id: 'deploy-build', status: 'in-progress' as const }
    ]

    for (const check of checks) {
      await new Promise(resolve => setTimeout(resolve, 200))
      updateItemStatus(check.id, check.status)
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <Zap className="w-4 h-4" />
      case 'accessibility':
        return <Eye className="w-4 h-4" />
      case 'responsive':
        return <Smartphone className="w-4 h-4" />
      case 'security':
        return <Shield className="w-4 h-4" />
      case 'analytics':
        return <BarChart3 className="w-4 h-4" />
      case 'deployment':
        return <Globe className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getOverallStatus = (overall: string) => {
    switch (overall) {
      case 'ready':
        return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, text: 'Ready for Deployment' }
      case 'in-progress':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock, text: 'In Progress' }
      case 'not-ready':
        return { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, text: 'Not Ready' }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', icon: AlertTriangle, text: 'Unknown' }
    }
  }

  const overallStatus = getOverallStatus(status.overall)
  const OverallIcon = overallStatus.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Deployment Readiness Checklist
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button 
                onClick={runAutoCheck} 
                disabled={isRunning}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Auto Check
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg ${overallStatus.bg}`}>
            <div className="flex items-center gap-3 mb-2">
              <OverallIcon className={`w-6 h-6 ${overallStatus.color}`} />
              <h3 className={`text-lg font-semibold ${overallStatus.color}`}>
                {overallStatus.text}
              </h3>
              <Badge className={overallStatus.color}>
                {status.completed}/{status.total} Complete
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.completed}</div>
                <div className="text-green-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{status.warnings}</div>
                <div className="text-yellow-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{status.criticalIssues}</div>
                <div className="text-red-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {Math.round((status.completed / status.total) * 100)}%
                </div>
                <div className="text-gray-600">Progress</div>
              </div>
            </div>
            <Progress 
              value={(status.completed / status.total) * 100} 
              className="h-2 mt-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {['performance', 'accessibility', 'responsive', 'security', 'analytics', 'deployment'].map(category => {
          const categoryItems = checklist.filter(item => item.category === category)
          const categoryCompleted = categoryItems.filter(item => item.status === 'completed').length
          const categoryTotal = categoryItems.length

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {getCategoryIcon(category)}
                  <CardTitle className="capitalize">{category}</CardTitle>
                  <Badge variant="secondary">
                    {categoryCompleted}/{categoryTotal}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <Checkbox
                        checked={item.status === 'completed'}
                        onCheckedChange={(checked) => 
                          updateItemStatus(item.id, checked ? 'completed' : 'pending')
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(item.status)}
                          <span className="font-medium text-sm">{item.title}</span>
                          <Badge className={getPriorityColor(item.priority)} size="sm">
                            {item.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">{item.description}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>⏱️ {item.estimatedTime}</span>
                          {item.notes && <span>📝 {item.notes}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
