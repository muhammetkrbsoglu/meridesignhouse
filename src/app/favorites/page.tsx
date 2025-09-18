import { Metadata } from 'next';
import Link from 'next/link';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { FavoriteItems } from '@/components/favorites/FavoriteItems';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { getFavoriteItems } from '@/lib/api/cartClient';
import type { FavoriteItem } from '@/types/cart';
import { PageTransition } from '@/components/motion/PageTransition';
import { EmptyFavorites } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Favorilerim | Meri Design House',
  description: 'Favori ürünlerinizi görüntüleyin ve yönetin.',
};

export default async function FavoritesPage() {
  const favoriteItems = await getFavoriteItems();

  const breadcrumbItems = [
    { label: 'Favorilerim', href: '/favorites' },
  ];

  return (
    <CustomerLayout>
      <PageTransition direction="up">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb items={breadcrumbItems} />

          <div className="mt-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Favori Ürünlerim
              {favoriteItems.length > 0 && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({favoriteItems.length} ürün)
                </span>
              )}
            </h1>

            {favoriteItems.length === 0 ? (
              <EmptyFavorites onBrowseProducts={() => window.location.href = '/products'} />
            ) : (
              <FavoriteItems items={favoriteItems as FavoriteItem[]} />
            )}
          </div>
        </div>
      </PageTransition>
    </CustomerLayout>
  );
}
