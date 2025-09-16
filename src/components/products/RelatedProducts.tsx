import Link from 'next/link';
import Image from 'next/image';
import { ProductWithCategory } from '@/types/product';
import { formatCurrency } from '@/lib/utils';

interface RelatedProductsProps {
  products: ProductWithCategory[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Benzer Ürünler
        </h2>
        <Link
          href="/products"
          className="text-sm font-medium text-rose-600 hover:text-rose-700"
        >
          Tümünü Gör
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {products.map((product) => (
          <div key={product.id} className="group">
            <Link href={`/products/${product.slug}`}>
              <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-3">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[0]?.url || '/placeholder-product.svg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Resim Yok</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {product.category.name}
                </p>
                <p className="text-lg font-semibold text-rose-600">
                  {formatCurrency(typeof product.price === 'number' ? product.price : product.price.toNumber())}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}