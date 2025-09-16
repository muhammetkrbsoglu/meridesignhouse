import { Metadata } from 'next';
import { AdminGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UsersTable } from '@/components/admin/UsersTable';
import { fetchUsers } from '@/lib/actions/users';

export const metadata: Metadata = {
  title: 'Kullanıcı Yönetimi | Admin Panel',
  description: 'Kullanıcıları görüntüle ve yönet',
};

interface UsersPageProps {
  searchParams: {
    page?: string;
    search?: string;
    role?: string;
  };
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || '';
  const role = resolvedSearchParams.role || '';
  const itemsPerPage = 10;

  const { users, totalCount } = await fetchUsers({
    page: currentPage,
    limit: itemsPerPage,
    search,
    role,
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Kullanıcı Yönetimi
              </h1>
              <p className="text-gray-600">
                Toplam {totalCount} kullanıcı
              </p>
            </div>
          </div>

          {/* Users Table */}
          <UsersTable 
            users={users}
            currentPage={currentPage}
            totalPages={totalPages}
            search={search}
            role={role}
          />
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}