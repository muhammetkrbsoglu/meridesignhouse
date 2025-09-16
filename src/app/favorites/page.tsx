import { Metadata } from 'next';
import Link from 'next/link';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { FavoriteItems } from '@/components/favorites/FavoriteItems';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { getFavoriteItems } from '@/lib/actions/cart';

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
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Henüz Favori Ürününüz Yok
                </h2>
                <p className="text-gray-600 mb-6">
                  Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Ürünleri İncele
                </Link>
              </div>
            </div>
          ) : (
            <FavoriteItems items={favoriteItems} />
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}