'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Zap,
  Clock,
  Target,
  BarChart3,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface LiveMetric {
  name: string
  value: number
  unit: string
  threshold: number
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  change: number
  timestamp: number
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'critical'
  metric: string
  message: string
  timestamp: number
  resolved: boolean
}

export function LivePerformanceMonitor() {
  const [metrics, setMetrics] = useState<LiveMetric[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)

  // Simulate live data updates
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      // Simulate real-time performance data
      const newMetrics: LiveMetric[] = [
        {
          name: 'LCP',
          value: 1.8 + (Math.random() - 0.5) * 0.4,
          unit: 's',
          threshold: 2.0,
          status: Math.random() > 0.1 ? 'good' : 'warning',
          trend: Math.random() > 0.5 ? 'down' : 'up',
          change: (Math.random() - 0.5) * 0.2,
          timestamp: Date.now()
        },
        {
          name: 'INP',
          value: 120 + (Math.random() - 0.5) * 40,
          unit: 'ms',
          threshold: 150,
          status: Math.random() > 0.15 ? 'good' : 'warning',
          trend: Math.random() > 0.5 ? 'down' : 'up',
          change: (Math.random() - 0.5) * 20,
          timestamp: Date.now()
        },
        {
          name: 'CLS',
          value: 0.05 + (Math.random() - 0.5) * 0.02,
          unit: '',
          threshold: 0.08,
          status: Math.random() > 0.1 ? 'good' : 'warning',
          trend: Math.random() > 0.5 ? 'down' : 'up',
          change: (Math.random() - 0.5) * 0.01,
          timestamp: Date.now()
        },
        {
          name: 'FCP',
          value: 1.2 + (Math.random() - 0.5) * 0.3,
          unit: 's',
          threshold: 1.5,
          status: Math.random() > 0.1 ? 'good' : 'warning',
          trend: Math.random() > 0.5 ? 'down' : 'up',
          change: (Math.random() - 0.5) * 0.15,
          timestamp: Date.now()
        },
        {
          name: 'TTFB',
          value: 400 + (Math.random() - 0.5) * 100,
          unit: 'ms',
          threshold: 500,
          status: Math.random() > 0.1 ? 'good' : 'warning',
          trend: Math.random() > 0.5 ? 'down' : 'up',
          change: (Math.random() - 0.5) * 50,
          timestamp: Date.now()
        },
        {
          name: 'FPS',
          value: 55 + (Math.random() - 0.5) * 10,
          unit: 'fps',
          threshold: 30,
          status: Math.random() > 0.05 ? 'good' : 'warning',
          trend: Math.random() > 0.5 ? 'down' : 'up',
          change: (Math.random() - 0.5) * 5,
          timestamp: Date.now()
        }
      ]

      setMetrics(newMetrics)
      setLastUpdate(new Date())

      // Check for alerts
      const newAlerts: PerformanceAlert[] = []
      newMetrics.forEach(metric => {
        if (metric.status === 'critical' || (metric.status === 'warning' && Math.random() > 0.8)) {
          newAlerts.push({
            id: `${metric.name}-${Date.now()}`,
            type: metric.status === 'critical' ? 'critical' : 'warning',
            metric: metric.name,
            message: `${metric.name} ${metric.value}${metric.unit} - ${metric.status === 'critical' ? 'Critical threshold exceeded' : 'Warning threshold approaching'}`,
            timestamp: Date.now(),
            resolved: false
          })
        }
      })

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)) // Keep last 10 alerts
      }

      // Simulate connection issues
      if (Math.random() > 0.95) {
        setIsConnected(false)
        setTimeout(() => setIsConnected(true), 2000)
      }

    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [isMonitoring])

  const startMonitoring = () => {
    setIsMonitoring(true)
    setAlerts([])
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'critical':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === 'fps') return Math.round(value)
    if (unit === 's') return value.toFixed(2)
    if (unit === 'ms') return Math.round(value)
    return value.toFixed(3)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {lastUpdate && (
                <div className="text-sm text-gray-500">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              <Button 
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                className="flex items-center gap-2"
              >
                {isMonitoring ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isMonitoring ? (
            <div className="text-sm text-gray-600">
              Real-time performance monitoring active. Data updates every 2 seconds.
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Click "Start" to begin live performance monitoring.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'critical' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {alert.type === 'critical' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-medium text-sm">{alert.message}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Metrics */}
      {isMonitoring && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
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
                        {formatValue(metric.value, metric.unit)}{metric.unit}
                      </span>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          / {formatValue(metric.threshold, metric.unit)}{metric.unit}
                        </div>
                        <div className={`text-xs ${
                          metric.change > 0 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {metric.change > 0 ? '+' : ''}{formatValue(metric.change, metric.unit)}
                        </div>
                      </div>
                    </div>
                    
                    <Progress 
                      value={(metric.value / metric.threshold) * 100} 
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={getStatusColor(metric.status)}>
                        {metric.status}
                      </span>
                      <span className="text-gray-500">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Performance Summary */}
      {isMonitoring && metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.filter(m => m.status === 'good').length}
                </div>
                <div className="text-sm text-green-600">Good</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {metrics.filter(m => m.status === 'warning').length}
                </div>
                <div className="text-sm text-yellow-600">Warning</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {metrics.filter(m => m.status === 'critical').length}
                </div>
                <div className="text-sm text-red-600">Critical</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {alerts.length}
                </div>
                <div className="text-sm text-blue-600">Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
