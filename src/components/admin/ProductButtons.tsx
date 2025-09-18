import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { deleteProduct } from '@/lib/actions/products'

export function CreateProduct() {
  return (
    <Link
      href="/admin/products/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Ürün Ekle</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  )
}

export function UpdateProduct({ id }: { id: string }) {
  return (
    <Link
      href={`/admin/products/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  )
}

export function DeleteProduct({ id }: { id: string }) {
  const deleteProductWithId = deleteProduct.bind(null, id)

  return (
    <form action={deleteProductWithId}>
      <button className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Sil</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  )
}
