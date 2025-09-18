'use client'

import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { deleteCategory } from '@/lib/actions/categories'

export function CreateCategory() {
  return (
    <Link
      href="/admin/categories/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Kategori Ekle</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  )
}

export function UpdateCategory({ id }: { id: string }) {
  return (
    <Link
      href={`/admin/categories/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  )
}

export function DeleteCategory({ id }: { id: string }) {
  const deleteCategoryWithId = async () => {
    try {
      await deleteCategory(id)
      console.log('Kategori başarıyla silindi')
    } catch (error) {
      console.error('Kategori silme hatası:', error)
      alert(`Kategori silinemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    }
  }

  return (
    <button 
      onClick={deleteCategoryWithId}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <span className="sr-only">Sil</span>
      <TrashIcon className="w-5" />
    </button>
  )
}
