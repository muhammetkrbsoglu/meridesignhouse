'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'

export default function TestAuthPage() {
  const { user, userProfile, signIn, signUp } = useAuth()
  const [testResults, setTestResults] = useState<Array<{test: string, result: unknown, success: boolean, timestamp: string}>>([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('test123456')
  const [loginLoading, setLoginLoading] = useState(false)

  const addResult = (test: string, result: unknown, success: boolean) => {
    setTestResults(prev => [...prev, { test, result, success, timestamp: new Date().toISOString() }])
  }

  const handleLogin = async () => {
    setLoginLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        addResult('Login Error', error.message, false)
      } else {
        addResult('Login Success', 'User logged in successfully', true)
      }
    } catch (error) {
      addResult('Login Error', error, false)
    }
    setLoginLoading(false)
  }

  const handleSignUp = async () => {
    setLoginLoading(true)
    try {
      const { error } = await signUp(email, password, 'Test User')
      if (error) {
        addResult('SignUp Error', error.message, false)
      } else {
        addResult('SignUp Success', 'User registered successfully', true)
      }
    } catch (error) {
      addResult('SignUp Error', error, false)
    }
    setLoginLoading(false)
  }

  const testSupabaseConnection = async () => {
    setLoading(true)
    setTestResults([])
    
    try {
      // Test 1: Basic connection
      addResult('Supabase Connection', 'Testing basic connection...', true)
      
      // Test 2: Auth status
      const { data: authData, error: authError } = await supabase.auth.getSession()
      addResult('Auth Session', { session: !!authData.session, error: authError }, !authError)
      
      // Test 3: User data
      if (authData.session?.user) {
        addResult('Current User', {
          id: authData.session.user.id,
          email: authData.session.user.email,
          metadata: authData.session.user.user_metadata
        }, true)
        
        // Test 4: Try to fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.session.user.id)
          .single()
        
        addResult('Profile Fetch', {
          data: profileData,
          error: profileError ? {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          } : null
        }, !profileError)
        
        // Test 5: Try to create profile if doesn't exist
        if (profileError?.code === 'PGRST116') {
          const newProfile = {
            id: authData.session.user.id,
            email: authData.session.user.email || '',
            name: authData.session.user.user_metadata?.name || 'Test User',
            role: 'CUSTOMER' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: createData, error: createError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single()
          
          addResult('Profile Creation', {
            data: createData,
            error: createError ? {
              code: createError.code,
              message: createError.message,
              details: createError.details,
              hint: createError.hint
            } : null
          }, !createError)
        }
      } else {
        addResult('No User Session', 'User is not logged in', false)
      }
      
    } catch (error) {
      addResult('Unexpected Error', error, false)
    }
    
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Auth Test Page</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
          <p><strong>Profile:</strong> {userProfile ? JSON.stringify(userProfile) : 'No profile'}</p>
        </div>
      </div>
      
      {!user && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Login</h2>
          <div className="bg-gray-50 p-4 rounded space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex space-x-2">
               <button
                 onClick={handleLogin}
                 disabled={loginLoading}
                 className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
               >
                 {loginLoading ? 'Logging in...' : 'Login'}
               </button>
               <button
                 onClick={handleSignUp}
                 disabled={loginLoading}
                 className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
               >
                 {loginLoading ? 'Signing up...' : 'Sign Up'}
               </button>
             </div>
          </div>
        </div>
      )}
      
      <button 
        onClick={testSupabaseConnection}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Supabase Tests'}
      </button>
      
      {testResults.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className={`p-4 rounded border ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h3 className="font-semibold">{result.test}</h3>
                <pre className="mt-2 text-sm overflow-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
                <p className="text-xs text-gray-500 mt-2">{result.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}