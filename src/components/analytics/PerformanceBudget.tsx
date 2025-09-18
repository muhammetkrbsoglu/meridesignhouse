'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface PerformanceBudget {
  LCP: number // ms
  INP: number // ms
  CLS: number
  FCP: number // ms
  TTFB: number // ms
}

interface BudgetStatus {
  metric: string
  current: number
  budget: number
  percentage: number
  status: 'good' | 'warning' | 'critical'
  description: string
}

const BUDGET: PerformanceBudget = {
  LCP: 2000, // 2.0s (stricter)
  INP: 150,  // 150ms (stricter)
  CLS: 0.08, // 0.08 (stricter)
  FCP: 1500, // 1.5s (stricter)
  TTFB: 500, // 500ms (stricter)
}

const BUDGET_DESCRIPTIONS = {
  LCP: 'Largest Contentful Paint - En büyük içerik boyanma süresi',
  INP: 'Interaction to Next Paint - Etkileşimden sonraki boyama süresi',
  CLS: 'Cumulative Layout Shift - Kümülatif düzen kayması',
  FCP: 'First Contentful Paint - İlk içerik boyama süresi',
  TTFB: 'Time to First Byte - İlk byte süresi',
}

export function PerformanceBudget() {
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([])

  useEffect(() => {
    // Listen for performance metrics
    const handlePerformanceEvent = (event: CustomEvent) => {
      const { name, value } = event.detail
      
      setBudgetStatuses(prev => {
        const budget = BUDGET[name as keyof PerformanceBudget]
        if (!budget) return prev
        
        const percentage = Math.min((value / budget) * 100, 200) // Cap at 200%
        let status: 'good' | 'warning' | 'critical' = 'good'
        
        if (percentage > 100) {
          status = percentage > 150 ? 'critical' : 'warning'
        }
        
        const newStatus: BudgetStatus = {
          metric: name,
          current: value,
          budget,
          percentage,
          status,
          description: BUDGET_DESCRIPTIONS[name as keyof typeof BUDGET_DESCRIPTIONS] || '',
        }
        
        return prev.filter(s => s.metric !== name).concat(newStatus)
      })
    }

    window.addEventListener('performance-metric', handlePerformanceEvent as EventListener)
    
    return () => {
      window.removeEventListener('performance-metric', handlePerformanceEvent as EventListener)
    }
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
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatValue = (metric: string, value: number) => {
    if (metric === 'CLS') {
      return value.toFixed(3)
    }
    return `${Math.round(value)}ms`
  }

  const formatBudget = (metric: string, budget: number) => {
    if (metric === 'CLS') {
      return budget.toFixed(3)
    }
    return `${budget}ms`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Performance Budget
        </CardTitle>
        <p className="text-sm text-gray-600">
          Core Web Vitals ve performans hedefleri
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {budgetStatuses.map((status) => (
            <motion.div
              key={status.metric}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.status)}
                  <span className="font-medium">{status.metric}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {formatValue(status.metric, status.current)} / {formatBudget(status.metric, status.budget)}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getStatusColor(status.status)}`}
                  >
                    {status.status}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1">
                <Progress 
                  value={Math.min(status.percentage, 100)} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span className="font-medium">
                    {status.percentage.toFixed(1)}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-600">
                {status.description}
              </p>
            </motion.div>
          ))}
          
          {budgetStatuses.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-8">
              Performance metrics will appear here as they are collected
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

