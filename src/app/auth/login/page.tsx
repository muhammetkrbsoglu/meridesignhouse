import { LoginForm } from '@/components/auth/LoginForm'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <LoginForm />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Giriş Yap - Meri Design House',
  description: 'Hesabınıza giriş yapın',
}