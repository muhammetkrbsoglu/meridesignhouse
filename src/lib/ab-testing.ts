/**
 * MeriDesignHouse A/B Testing Infrastructure
 * Data-driven optimization for micro-motion and UX elements
 */

export type TestVariant = 'control' | 'variant_a' | 'variant_b' | 'variant_c'
export type TestStatus = 'draft' | 'running' | 'paused' | 'completed'
export type TestSegment = 'all' | 'new_users' | 'returning_users' | 'mobile' | 'desktop' | 'light_theme' | 'dark_theme'

export interface ABTest {
  id: string
  name: string
  description: string
  status: TestStatus
  variants: TestVariant[]
  trafficAllocation: Record<TestVariant, number> // 0-100
  segments: TestSegment[]
  startDate: Date
  endDate?: Date
  metrics: {
    primary: string[]
    secondary: string[]
  }
  hypothesis: string
  successCriteria: {
    metric: string
    threshold: number
    direction: 'increase' | 'decrease'
  }
}

export interface TestAssignment {
  testId: string
  variant: TestVariant
  userId: string
  sessionId: string
  assignedAt: Date
  expiresAt: Date
}

export interface TestEvent {
  testId: string
  variant: TestVariant
  userId: string
  sessionId: string
  eventType: string
  eventData: Record<string, any>
  timestamp: Date
  pageUrl: string
  userAgent: string
}

// Predefined A/B Tests
export const AB_TESTS: Record<string, ABTest> = {
  micro_motion_duration: {
    id: 'micro_motion_duration',
    name: 'Micro Motion Duration',
    description: 'Test different micro-motion durations for better UX',
    status: 'running',
    variants: ['control', 'variant_a', 'variant_b'],
    trafficAllocation: {
      control: 40,
      variant_a: 30,
      variant_b: 30
    },
    segments: ['all'],
    startDate: new Date('2024-01-01'),
    metrics: {
      primary: ['interaction_time', 'user_engagement'],
      secondary: ['lcp', 'inp', 'cls']
    },
    hypothesis: 'Shorter micro-motion durations will improve perceived performance and user engagement',
    successCriteria: {
      metric: 'interaction_time',
      threshold: 0.1, // 10% improvement
      direction: 'decrease'
    }
  },
  gesture_hints_timing: {
    id: 'gesture_hints_timing',
    name: 'Gesture Hints Timing',
    description: 'Test optimal timing for gesture hints display',
    status: 'running',
    variants: ['control', 'variant_a', 'variant_b'],
    trafficAllocation: {
      control: 50,
      variant_a: 25,
      variant_b: 25
    },
    segments: ['new_users', 'mobile'],
    startDate: new Date('2024-01-01'),
    metrics: {
      primary: ['gesture_discovery_rate', 'user_satisfaction'],
      secondary: ['bounce_rate', 'session_duration']
    },
    hypothesis: 'Earlier gesture hints will improve feature discovery and user satisfaction',
    successCriteria: {
      metric: 'gesture_discovery_rate',
      threshold: 0.15, // 15% improvement
      direction: 'increase'
    }
  },
  loader_animations: {
    id: 'loader_animations',
    name: 'Loader Animations',
    description: 'Test different loader animation styles and durations',
    status: 'running',
    variants: ['control', 'variant_a', 'variant_b'],
    trafficAllocation: {
      control: 40,
      variant_a: 30,
      variant_b: 30
    },
    segments: ['all'],
    startDate: new Date('2024-01-01'),
    metrics: {
      primary: ['perceived_performance', 'user_engagement'],
      secondary: ['lcp', 'inp', 'cls']
    },
    hypothesis: 'Branded loader animations will improve perceived performance',
    successCriteria: {
      metric: 'perceived_performance',
      threshold: 0.2, // 20% improvement
      direction: 'increase'
    }
  },
  glassmorphism_intensity: {
    id: 'glassmorphism_intensity',
    name: 'Glassmorphism Intensity',
    description: 'Test different glassmorphism intensity levels',
    status: 'running',
    variants: ['control', 'variant_a', 'variant_b'],
    trafficAllocation: {
      control: 50,
      variant_a: 25,
      variant_b: 25
    },
    segments: ['desktop', 'light_theme'],
    startDate: new Date('2024-01-01'),
    metrics: {
      primary: ['visual_appeal', 'user_engagement'],
      secondary: ['fps', 'memory_usage']
    },
    hypothesis: 'Subtle glassmorphism will improve visual appeal without performance impact',
    successCriteria: {
      metric: 'visual_appeal',
      threshold: 0.1, // 10% improvement
      direction: 'increase'
    }
  }
}

// Test Configuration
export const TEST_CONFIG = {
  // Feature flags for experimental features
  featureFlags: {
    microMotion_v1: false,
    gestureHints_v2: false,
    loaderAnimations_v3: false,
    glassmorphism_v1: false
  },
  
  // Rollout percentages
  rollout: {
    microMotion_v1: 10,
    gestureHints_v2: 30,
    loaderAnimations_v3: 50,
    glassmorphism_v1: 100
  },
  
  // Analytics endpoints
  analytics: {
    ga4: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
    custom: '/api/analytics/ab-testing'
  },
  
  // Performance thresholds
  performance: {
    lcp: 2.5, // seconds
    inp: 200, // milliseconds
    cls: 0.1, // score
    fps: 30 // minimum FPS for animations
  }
}

// User segmentation utilities
export function getUserSegment(): TestSegment[] {
  if (typeof window === 'undefined') return ['all']
  
  const segments: TestSegment[] = ['all']
  
  // Device type
  if (window.innerWidth < 768) {
    segments.push('mobile')
  } else {
    segments.push('desktop')
  }
  
  // Theme preference
  const theme = localStorage.getItem('meri-design-theme') || 'system'
  if (theme === 'light') {
    segments.push('light_theme')
  } else if (theme === 'dark') {
    segments.push('dark_theme')
  }
  
  // User type (simplified - in real app, check authentication)
  const isNewUser = !localStorage.getItem('meri-design-user-visited')
  if (isNewUser) {
    segments.push('new_users')
    localStorage.setItem('meri-design-user-visited', 'true')
  } else {
    segments.push('returning_users')
  }
  
  return segments
}

// Test assignment utilities
export function assignUserToTest(testId: string, userId: string, sessionId: string): TestVariant {
  const test = AB_TESTS[testId]
  if (!test || test.status !== 'running') {
    return 'control'
  }
  
  // Check if user is in target segments
  const userSegments = getUserSegment()
  const hasMatchingSegment = test.segments.some(segment => 
    segment === 'all' || userSegments.includes(segment)
  )
  
  if (!hasMatchingSegment) {
    return 'control'
  }
  
  // Generate consistent assignment based on user ID
  const hash = simpleHash(userId + testId)
  const random = hash % 100
  
  let cumulative = 0
  for (const [variant, allocation] of Object.entries(test.trafficAllocation)) {
    cumulative += allocation
    if (random < cumulative) {
      return variant as TestVariant
    }
  }
  
  return 'control'
}

// Simple hash function for consistent assignment
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Test event tracking
export function trackTestEvent(
  testId: string,
  variant: TestVariant,
  eventType: string,
  eventData: Record<string, any> = {}
): void {
  if (typeof window === 'undefined') return
  
  const userId = localStorage.getItem('meri-design-user-id') || 'anonymous'
  const sessionId = sessionStorage.getItem('meri-design-session-id') || 'anonymous'
  
  const event: TestEvent = {
    testId,
    variant,
    userId,
    sessionId,
    eventType,
    eventData,
    timestamp: new Date(),
    pageUrl: window.location.href,
    userAgent: navigator.userAgent
  }
  
  // Send to analytics
  sendToAnalytics(event)
  
  // Store locally for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('A/B Test Event:', event)
  }
}

// Analytics integration
async function sendToAnalytics(event: TestEvent): Promise<void> {
  try {
    // Send to custom endpoint
    await fetch('/api/analytics/ab-testing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    })
    
    // Send to GA4 if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ab_test_event', {
        test_id: event.testId,
        variant: event.variant,
        event_type: event.eventType,
        event_data: event.eventData
      })
    }
  } catch (error) {
    console.error('Failed to send A/B test event:', error)
  }
}

// Test result utilities
export function getTestResults(testId: string): Promise<any> {
  // This would typically fetch from your analytics backend
  return fetch(`/api/analytics/ab-testing/results/${testId}`)
    .then(res => res.json())
    .catch(error => {
      console.error('Failed to fetch test results:', error)
      return null
    })
}

// Feature flag utilities
export function isFeatureEnabled(feature: keyof typeof TEST_CONFIG.featureFlags): boolean {
  const flag = TEST_CONFIG.featureFlags[feature]
  const rollout = TEST_CONFIG.rollout[feature]
  
  if (!flag) return false
  
  // Check rollout percentage
  const userId = localStorage.getItem('meri-design-user-id') || 'anonymous'
  const hash = simpleHash(userId + feature)
  const random = hash % 100
  
  return random < rollout
}

// Performance monitoring for A/B tests
export function monitorTestPerformance(testId: string, variant: TestVariant): void {
  if (typeof window === 'undefined') return
  
  // Monitor Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        trackTestEvent(testId, variant, 'lcp_measured', {
          value: entry.startTime,
          threshold: TEST_CONFIG.performance.lcp
        })
      } else if (entry.entryType === 'layout-shift') {
        trackTestEvent(testId, variant, 'cls_measured', {
          value: (entry as any).value,
          threshold: TEST_CONFIG.performance.cls
        })
      }
    }
  })
  
  observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] })
  
  // Monitor FPS for animation tests
  let lastTime = performance.now()
  let frameCount = 0
  
  function measureFPS() {
    frameCount++
    const currentTime = performance.now()
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
      
      if (fps < TEST_CONFIG.performance.fps) {
        trackTestEvent(testId, variant, 'low_fps_detected', {
          fps,
          threshold: TEST_CONFIG.performance.fps
        })
      }
      
      frameCount = 0
      lastTime = currentTime
    }
    
    requestAnimationFrame(measureFPS)
  }
  
  requestAnimationFrame(measureFPS)
}
