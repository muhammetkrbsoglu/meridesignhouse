'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-browser'
import { Tables } from '@/lib/supabase'

type UserProfile = Tables<'users'>

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name?: string, phone?: string) => Promise<{ error: Error | null }>
  signInWithProvider: (provider: 'google' | 'facebook' | 'twitter' | 'spotify') => Promise<{ error: Error | null }>
  signUpWithProvider: (provider: 'google' | 'facebook' | 'twitter' | 'spotify') => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      let timeoutId: any
      try {
        // Skip refresh if no stored supabase keys
        let hasStoredSession = false
        if (typeof window !== 'undefined') {
          hasStoredSession = Object.keys(localStorage).some((k) => k.startsWith('sb-') || k.includes('supabase'))
        }
        if (hasStoredSession) {
          console.debug('[Auth] init: refreshing session...')
          await supabase.auth.refreshSession()
        } else {
          console.debug('[Auth] init: no stored session; skip refresh')
        }

        const { data: { session } } = await supabase.auth.getSession()
        console.debug('[Auth] init: session user =', session?.user?.id || null)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.debug('[Auth] init: fetching profile for', session.user.id)
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
      } catch (e) {
        console.error('Auth init error:', e)
      } finally {
        console.debug('[Auth] init: loading=false')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.debug('[Auth] onAuthStateChange:', event, 'user=', session?.user?.id || null)
        // react immediately to token/user updates
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile - Full error:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        
        // If user profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating new profile...')
          const { data: userData } = await supabase.auth.getUser()
          if (userData.user) {
            const newProfile = {
              id: userId,
              email: userData.user.email || '',
              name: userData.user.user_metadata?.name || '',
              role: 'CUSTOMER' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const { data: createdProfile, error: createError } = await supabase
              .from('users')
              .insert(newProfile)
              .select()
              .single()
            
            if (createError) {
              console.error('Error creating user profile:', createError)
            } else if (createdProfile) {
              console.log('Profile created successfully')
              setUserProfile(createdProfile)
              return
            }
          }
        } else {
          console.error('Error fetching user profile:', error)
        }
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Unexpected error in fetchUserProfile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, name?: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (!error && data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          name: name || null,
          phone: phone || null,
          role: 'CUSTOMER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }
    }

    return { error }
  }

  const signInWithProvider = async (provider: 'google' | 'facebook' | 'twitter' | 'spotify') => {
    try {
      console.log('Starting OAuth with provider:', provider)
      
      // Get the current origin safely
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      const redirectTo = `${origin}/auth/callback`
      
      console.log('Redirect URL:', redirectTo)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      if (error) {
        console.error('OAuth error:', error)
      } else {
        console.log('OAuth initiated successfully')
      }
      
      return { error }
    } catch (err) {
      console.error('Unexpected error in signInWithProvider:', err)
      return { error: err as Error }
    }
  }

  const signUpWithProvider = async (provider: 'google' | 'facebook' | 'twitter' | 'spotify') => {
    try {
      console.log('Starting OAuth signup with provider:', provider)
      
      // Get the current origin safely
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      const redirectTo = `${origin}/auth/callback`
      
      console.log('Redirect URL:', redirectTo)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      if (error) {
        console.error('OAuth error:', error)
      } else {
        console.log('OAuth initiated successfully')
      }
      
      return { error }
    } catch (err) {
      console.error('Unexpected error in signUpWithProvider:', err)
      return { error: err as Error }
    }
  }

  const signOut = async () => {
    try {
      console.debug('[Auth] signOut: calling supabase.auth.signOut')
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 1500)) // fallback timeout
      ])
    } finally {
      // Clear local state immediately
      try {
        console.debug('[Auth] signOut: clearing local state')
        setUser(null)
        setUserProfile(null)
        // Hard-clear Supabase tokens from storage as a fallback
        if (typeof window !== 'undefined') {
          Object.keys(localStorage)
            .filter((k) => k.startsWith('sb-') || k.includes('supabase'))
            .forEach((k) => localStorage.removeItem(k))
        }
      } catch (e) {
        console.error('[Auth] signOut: local cleanup error', e)
      }
      // Hard redirect to ensure all client caches/session artifacts are reset
      if (typeof window !== 'undefined') {
        console.debug('[Auth] signOut: redirecting to /')
        window.location.assign('/')
      }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setUserProfile(prev => prev ? { ...prev, ...updates } : null)
    }

    return { error }
  }

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithProvider,
    signUpWithProvider,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook for admin access
export function useRequireAuth(requiredRole?: 'ADMIN' | 'CUSTOMER') {
  const { user, userProfile, loading } = useAuth()
  
  const isAuthenticated = !!user
  const hasRequiredRole = !requiredRole || userProfile?.role === requiredRole
  const isAuthorized = isAuthenticated && hasRequiredRole
  
  return {
    user,
    user,
    userProfile,
    loading,
    isAuthenticated,
    isAuthorized,
    hasRequiredRole,
  }
}