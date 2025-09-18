import { Suspense } from 'react'
import { getUserProfile, getUserOrders, getUserMessages, getOrderStats } from '@/lib/actions/profile'
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import ProfileContent from '@/components/profile/ProfileContent'
import ProfileSkeleton from '@/components/profile/ProfileSkeleton'
import { CustomerLayout } from '@/components/layout/CustomerLayout'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              👤 Profilim
            </h1>
            <p className="text-gray-600">
              Kişisel bilgilerinizi yönetin ve hesap durumunuzu görüntüleyin
            </p>
          </div>

          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileContent userId={user.id} />
          </Suspense>
        </div>
      </div>
    </CustomerLayout>
  )
}

