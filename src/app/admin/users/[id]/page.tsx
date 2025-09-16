import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserDetail } from '@/components/admin/UserDetail';
import { fetchUserById } from '@/lib/actions/users';

export const metadata: Metadata = {
  title: 'Kullanıcı Detayı | Admin Panel',
  description: 'Kullanıcı detay bilgileri ve yönetim sayfası',
};

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const resolvedParams = await params;
  const user = await fetchUserById(resolvedParams.id);

  if (!user) {
    notFound();
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Kullanıcı Detayı
              </h1>
              <p className="text-gray-600">
                {user.full_name || user.email} kullanıcısının detay bilgileri
              </p>
            </div>
          </div>

          {/* User Detail */}
          <UserDetail user={user} />
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}