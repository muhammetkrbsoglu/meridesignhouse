'use client'

import { AuthProvider } from '@/contexts/AuthContext'

interface AuthProviderWrapperProps {
  children: React.ReactNode
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}