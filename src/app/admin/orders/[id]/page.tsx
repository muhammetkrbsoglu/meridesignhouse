import { Suspense } from 'react';
import { AdminGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import OrderDetailContent from './OrderDetailContent';

interface AdminOrderDetailPageProps {
  params: {
    id: string;
  };
}
export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const resolvedParams = await params;
  return (
    <AdminGuard>
      <AdminLayout>
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Yükleniyor...</div>}>
          <OrderDetailContent orderId={resolvedParams.id} />
        </Suspense>
      </AdminLayout>
    </AdminGuard>
  );
}