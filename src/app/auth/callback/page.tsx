'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { user: _user, loading: _loading } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling OAuth callback...')
        
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('OAuth callback error:', error)
          setStatus('error')
          setErrorMessage(error.message)
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        if (data.session) {
          console.log('OAuth callback successful, user:', data.session.user.email)
          setStatus('success')
          setTimeout(() => router.push('/'), 2000)
        } else {
          console.log('No session found, redirecting to login')
          setStatus('error')
          setErrorMessage('Giriş yapılamadı')
          setTimeout(() => router.push('/auth/login'), 3000)
        }
      } catch (err) {
        console.error('Unexpected error in OAuth callback:', err)
        setStatus('error')
        setErrorMessage('Beklenmeyen bir hata oluştu')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    // Wait a bit for the auth state to settle
    const timer = setTimeout(handleAuthCallback, 1000)
    return () => clearTimeout(timer)
  }, [router])

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">Giriş Başarılı!</h2>
          <p className="text-muted-foreground">Ana sayfaya yönlendiriliyorsunuz...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Giriş Başarısız</h2>
          <p className="text-muted-foreground">{errorMessage}</p>
          <p className="text-sm text-muted-foreground">Giriş sayfasına yönlendiriliyorsunuz...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">Giriş yapılıyor...</p>
      </div>
    </div>
  )
}
