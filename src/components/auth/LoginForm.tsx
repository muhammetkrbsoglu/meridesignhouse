'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook, FaTwitter, FaSpotify } from 'react-icons/fa'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  redirectTo?: string
  title?: string
  description?: string
  showRegisterLink?: boolean
}

export function LoginForm({ 
  redirectTo = '/', 
  title = 'Giriş Yap',
  description = 'Hesabınıza giriş yapın',
  showRegisterLink = true 
}: LoginFormProps) {
  const router = useRouter()
  const { signIn } = useAuth()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email veya şifre hatalı')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Email adresinizi doğrulamanız gerekiyor')
        } else {
          setError('Giriş yapılırken bir hata oluştu')
        }
        toast({ intent: 'error', description: 'Giriş başarısız' })
        return
      }

      toast({ intent: 'success', description: 'Giriş başarılı' })
      router.push(redirectTo)
    } catch (_) {
      setError('Beklenmeyen bir hata oluştu')
      toast({ intent: 'error', description: 'Beklenmeyen bir hata oluştu' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter' | 'spotify') => {
    // Symbolic only for now
    try {
      alert(`${provider} ile giriş yakında aktif edilecek.`)
    } catch (_) {
      // no-op
    }
    return
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Giriş yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Veya
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="w-full"
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('facebook')}
              disabled={isLoading}
              className="w-full"
            >
              <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
              Facebook
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('twitter')}
              disabled={isLoading}
              className="w-full"
            >
              <FaTwitter className="mr-2 h-4 w-4 text-blue-400" />
              Twitter
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('spotify')}
              disabled={isLoading}
              className="w-full"
            >
              <FaSpotify className="mr-2 h-4 w-4 text-green-500" />
              Spotify
            </Button>
          </div>

          {showRegisterLink && (
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Hesabınız yok mu? </span>
              <Link href="/auth/register" className="text-primary hover:underline">
                Kayıt olun
              </Link>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}