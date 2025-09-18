'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'ADMIN' | 'CUSTOMER'
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  redirectTo = '/auth/login',
  fallback 
}: AuthGuardProps) {
  const router = useRouter()
  const { user, loading, isAuthenticated, isAuthorized, userProfile } = useRequireAuth(requiredRole)
  
  // Watchdog: if loading persists unusually long, fail-fast to login
  useEffect(() => {
    if (!loading) return
    const id = setTimeout(() => {
      // Only redirect if still not authenticated (avoid bouncing real admins)
      if (!user) {
        console.debug('[AuthGuard] watchdog redirect triggered: no user, redirecting to', redirectTo)
        router.push(redirectTo)
      }
    }, 7000)
    return () => clearTimeout(id)
  }, [loading, user, router, redirectTo])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo)
    } else if (!loading && isAuthenticated && !isAuthorized) {
      // User is authenticated but doesn't have required role
      if (userProfile?.role === 'CUSTOMER') {
        router.push('/')
      } else {
        router.push('/unauthorized')
      }
    }
  }, [loading, isAuthenticated, isAuthorized, router, redirectTo, userProfile])

  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAuthorized) {
    return null
  }

  return <>{children}</>
}

// Specific guards for common use cases
export function AdminGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="ADMIN" redirectTo="/admin/login" {...props}>
      {children}
    </AuthGuard>
  )
}

export function CustomerGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="CUSTOMER" {...props}>
      {children}
    </AuthGuard>
  )
}
