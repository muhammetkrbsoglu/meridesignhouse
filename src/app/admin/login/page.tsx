import { LoginForm } from '@/components/auth/LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-sm text-gray-600">
            Yönetici hesabınızla giriş yapın
          </p>
        </div>
        <LoginForm 
          redirectTo="/admin"
          title="Admin Girişi"
          description="Yönetici paneline erişim"
          showRegisterLink={false}
        />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Admin Giriş - Meri Design House',
  description: 'Yönetici paneli girişi',
}