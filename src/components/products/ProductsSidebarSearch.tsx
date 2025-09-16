"use client"

import React from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface Props {
  initialQuery?: string
}

export function ProductsSidebarSearch({ initialQuery = '' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [value, setValue] = React.useState(initialQuery)
  const debounced = useDebounce(value, 500)

  React.useEffect(() => {
    // Preserve existing params, update query, reset page
    const params = new URLSearchParams(searchParams.toString())
    if (debounced && debounced.trim().length > 0) {
      params.set('query', debounced.trim())
    } else {
      params.delete('query')
    }
    params.delete('page')
    const next = `${pathname}?${params.toString()}`
    router.replace(next)
  }, [debounced, pathname, router, searchParams])

  const onClear = () => {
    setValue('')
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Escape') {
      onClear()
    }
  }

  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ürün ara..."
        className="w-full border rounded-md pl-8 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        aria-label="Ürün ara"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Aramayı temizle"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          title="Temizle"
        >
          ×
        </button>
      )}
    </div>
  )
}
