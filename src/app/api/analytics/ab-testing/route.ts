import { NextRequest, NextResponse } from 'next/server'
import { AB_TESTS, TestEvent } from '@/lib/ab-testing'

// In-memory storage for demo purposes
// In production, use a proper database
const testEvents: TestEvent[] = []
const testAssignments: Record<string, string> = {}

export async function POST(request: NextRequest) {
  try {
    const event: TestEvent = await request.json()
    
    // Validate event
    if (!event.testId || !event.variant || !event.eventType) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      )
    }
    
    // Store event
    testEvents.push(event)
    
    // Store assignment for consistency
    const assignmentKey = `${event.userId}-${event.testId}`
    testAssignments[assignmentKey] = event.variant
    
    // Log for debugging
    console.log('A/B Test Event:', {
      testId: event.testId,
      variant: event.variant,
      eventType: event.eventType,
      userId: event.userId,
      timestamp: event.timestamp
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('A/B Testing API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('testId')
    const variant = searchParams.get('variant')
    const eventType = searchParams.get('eventType')
    
    // Filter events based on query parameters
    let filteredEvents = testEvents
    
    if (testId) {
      filteredEvents = filteredEvents.filter(event => event.testId === testId)
    }
    
    if (variant) {
      filteredEvents = filteredEvents.filter(event => event.variant === variant)
    }
    
    if (eventType) {
      filteredEvents = filteredEvents.filter(event => event.eventType === eventType)
    }
    
    // Get test results
    const results = analyzeTestResults(filteredEvents)
    
    return NextResponse.json({
      events: filteredEvents,
      results,
      totalEvents: filteredEvents.length
    })
  } catch (error) {
    console.error('A/B Testing API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Analyze test results
function analyzeTestResults(events: TestEvent[]) {
  const testResults: Record<string, any> = {}
  
  // Group events by test ID and variant
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.testId]) {
      acc[event.testId] = {}
    }
    if (!acc[event.testId][event.variant]) {
      acc[event.testId][event.variant] = []
    }
    acc[event.testId][event.variant].push(event)
    return acc
  }, {} as Record<string, Record<string, TestEvent[]>>)
  
  // Calculate metrics for each test
  Object.entries(groupedEvents).forEach((entry) => {
    const [testId, variantEvents] = entry as [string, Record<string, TestEvent[]>]
    const test = AB_TESTS[testId]
    if (!test) return
    
    const variantResults: Record<string, any> = {}
    
    Object.entries(variantEvents).forEach(([variant, events]) => {
      const metrics = calculateVariantMetrics(events, test)
      variantResults[variant] = metrics
    })
    
    testResults[testId] = {
      test,
      variants: variantResults,
      summary: calculateTestSummary(variantResults, test)
    }
  })
  
  return testResults
}

// Calculate metrics for a specific variant
function calculateVariantMetrics(events: TestEvent[], test: any) {
  const metrics: Record<string, any> = {
    totalEvents: events.length,
    uniqueUsers: new Set(events.map(e => e.userId)).size,
    uniqueSessions: new Set(events.map(e => e.sessionId)).size,
    eventTypes: {},
    performance: {},
    conversions: 0
  }
  
  // Count event types
  events.forEach(event => {
    if (!metrics.eventTypes[event.eventType]) {
      metrics.eventTypes[event.eventType] = 0
    }
    metrics.eventTypes[event.eventType]++
  })
  
  // Calculate performance metrics
  const performanceEvents = events.filter(e => e.eventType.includes('performance'))
  if (performanceEvents.length > 0) {
    const lcpEvents = performanceEvents.filter(e => e.eventData.metric === 'lcp')
    const inpEvents = performanceEvents.filter(e => e.eventData.metric === 'inp')
    const clsEvents = performanceEvents.filter(e => e.eventData.metric === 'cls')
    
    if (lcpEvents.length > 0) {
      metrics.performance.lcp = {
        average: lcpEvents.reduce((sum, e) => sum + e.eventData.value, 0) / lcpEvents.length,
        count: lcpEvents.length
      }
    }
    
    if (inpEvents.length > 0) {
      metrics.performance.inp = {
        average: inpEvents.reduce((sum, e) => sum + e.eventData.value, 0) / inpEvents.length,
        count: inpEvents.length
      }
    }
    
    if (clsEvents.length > 0) {
      metrics.performance.cls = {
        average: clsEvents.reduce((sum, e) => sum + e.eventData.value, 0) / clsEvents.length,
        count: clsEvents.length
      }
    }
  }
  
  // Count conversions
  const conversionEvents = events.filter(e => e.eventType === 'conversion')
  metrics.conversions = conversionEvents.length
  
  return metrics
}

// Calculate test summary
function calculateTestSummary(variantResults: Record<string, any>, test: any) {
  const variants = Object.keys(variantResults)
  if (variants.length < 2) return null
  
  const control = variantResults.control
  if (!control) return null
  
  const summary: Record<string, any> = {
    control: control,
    variants: {},
    winner: null,
    confidence: 0
  }
  
  // Compare each variant to control
  variants.forEach(variant => {
    if (variant === 'control') return
    
    const variantData = variantResults[variant]
    const comparison = compareVariants(control, variantData, test)
    
    summary.variants[variant] = {
      ...variantData,
      comparison
    }
    
    // Determine winner based on success criteria
    if (test.successCriteria) {
      const metric = test.successCriteria.metric
      const threshold = test.successCriteria.threshold
      const direction = test.successCriteria.direction
      
      if (comparison[metric]) {
        const improvement = comparison[metric].improvement
        const isSignificant = Math.abs(improvement) >= threshold
        
        if (isSignificant && 
            ((direction === 'increase' && improvement > 0) || 
             (direction === 'decrease' && improvement < 0))) {
          summary.winner = variant
          summary.confidence = Math.min(95, Math.abs(improvement) * 100)
        }
      }
    }
  })
  
  return summary
}

// Compare two variants
function compareVariants(control: any, variant: any, test: any) {
  const comparison: Record<string, any> = {}
  
  // Compare basic metrics
  const metrics = ['totalEvents', 'uniqueUsers', 'uniqueSessions', 'conversions']
  metrics.forEach(metric => {
    if (control[metric] && variant[metric]) {
      const improvement = ((variant[metric] - control[metric]) / control[metric]) * 100
      comparison[metric] = {
        control: control[metric],
        variant: variant[metric],
        improvement: improvement
      }
    }
  })
  
  // Compare performance metrics
  if (control.performance && variant.performance) {
    comparison.performance = {}
    
    Object.keys(control.performance).forEach(metric => {
      if (control.performance[metric] && variant.performance[metric]) {
        const controlAvg = control.performance[metric].average
        const variantAvg = variant.performance[metric].average
        
        const improvement = ((variantAvg - controlAvg) / controlAvg) * 100
        comparison.performance[metric] = {
          control: controlAvg,
          variant: variantAvg,
          improvement: improvement
        }
      }
    })
  }
  
  return comparison
}
