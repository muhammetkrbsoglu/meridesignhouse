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
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook, FaTwitter, FaSpotify } from 'react-icons/fa'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

const registerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  redirectTo?: string
  title?: string
  description?: string
  showLoginLink?: boolean
}

export function RegisterForm({ 
  redirectTo = '/auth/login', 
  title = 'Kayıt Ol',
  description = 'Yeni hesap oluşturun',
  showLoginLink = true 
}: RegisterFormProps) {
  const router = useRouter()
  const { signUp } = useAuth()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await signUp(data.email, data.password, data.name, data.phone)

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('Bu email adresi zaten kayıtlı')
        } else if (error.message.includes('Password should be at least 6 characters')) {
          setError('Åifre en az 6 karakter olmalıdır')
        } else {
          setError('Kayıt olurken bir hata oluştu')
        }
        toast({ intent: 'error', description: 'Kayıt başarısız' })
        return
      }

      setSuccess(true)
      toast({ intent: 'success', description: 'Kayıt başarılı. E-postanızı doğrulayın.' })
      setTimeout(() => {
        router.push(redirectTo)
      }, 2000)
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

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Kayıt Başarılı!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Email adresinizi doğrulamak için gelen kutunuzu kontrol edin.
                Giriş sayfasına yönlendiriliyorsunuz...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              type="text"
              placeholder="Adınız Soyadınız"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

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
            <Label htmlFor="phone">Telefon Numarası (Opsiyonel)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+90 5XX XXX XX XX"
              {...register('phone')}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kayıt olunuyor...
              </>
            ) : (
              'Kayıt Ol'
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

          {showLoginLink && (
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
              <Link href="/auth/login" className="text-primary hover:underline">
                Giriş yapın
              </Link>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
