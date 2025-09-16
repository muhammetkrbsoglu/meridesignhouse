import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { fetchFilteredProducts } from '@/lib/actions/products'
import { UpdateProduct, DeleteProduct } from '@/components/admin/ProductButtons'

export async function ProductsGrid({
  query,
  currentPage,
}: {
  query: string
  currentPage: number
}) {
  const products = await fetchFilteredProducts(query, currentPage)

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {(products || []).map((product) => (
        <div key={product.id} className="rounded-lg border bg-white p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-md bg-gray-100 flex-shrink-0">
              {product.product_images && product.product_images[0] ? (
                <Image
                  src={product.product_images[0].url}
                  width={80}
                  height={80}
                  alt={`${product.name} resmi`}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/products/[id]/edit`.replace('[id]', product.id)}
                className="block font-medium text-sm leading-snug line-clamp-2 hover:underline"
                title={product.name}
              >
                {product.name}
              </Link>
              <div className="text-xs text-gray-700 font-medium truncate" title={product.category?.name || undefined}>Kategori: {product.category?.name || 'Kategori yok'}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">{formatCurrency(product.price)}</div>
              <div className="text-xs text-gray-500">Stok: {product.stock}</div>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] ${
                product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {product.isActive ? 'Aktif' : 'Pasif'}
            </span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <UpdateProduct id={product.id} />
            <DeleteProduct id={product.id} />
          </div>
        </div>
      ))}
    </div>
  )
}


