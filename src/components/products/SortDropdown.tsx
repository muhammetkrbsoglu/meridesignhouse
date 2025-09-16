"use client"

import React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FunnelIcon, ChevronDownIcon, CalendarDaysIcon, ArrowUpIcon, ArrowDownIcon, Bars3Icon } from '@heroicons/react/24/outline'

const OPTIONS: { value: string; label: string; Icon: React.ComponentType<any> }[] = [
  { value: 'popularity', label: 'Sırala', Icon: FunnelIcon },
  { value: 'newest', label: 'En yeni', Icon: CalendarDaysIcon },
  { value: 'oldest', label: 'En eski', Icon: CalendarDaysIcon },
  { value: 'price-asc', label: 'Fiyat artan', Icon: ArrowUpIcon },
  { value: 'price-desc', label: 'Fiyat azalan', Icon: ArrowDownIcon },
  { value: 'name', label: 'İsme göre', Icon: Bars3Icon },
]

function getLabel(value?: string) {
  return OPTIONS.find(o => o.value === value)?.label || 'Sırala'
}

function getIcon(value?: string) {
  return OPTIONS.find(o => o.value === value)?.Icon || FunnelIcon
}

export function SortDropdown({ current }: { current?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [])

  const CurrentIcon = getIcon(current)

  const applySort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('sort', value); else params.delete('sort')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 border rounded-md pl-2 pr-2 py-1.5 text-xs bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CurrentIcon className="h-4 w-4 text-gray-400" />
        <span>{getLabel(current)}</span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-md border bg-white shadow-lg">
          <ul role="listbox" className="py-1 max-h-64 overflow-auto">
            {OPTIONS.map(({ value, label, Icon }) => {
              const active = current === value
              return (
                <li key={value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => applySort(value)}
                    className={`w-full px-2 py-2 text-left text-xs inline-flex items-center gap-2 hover:bg-gray-50 ${active ? 'text-gray-900' : 'text-gray-600'}`}
                  >
                    <Icon className={`h-4 w-4 ${value === 'oldest' ? 'rotate-180' : ''} ${active ? 'text-rose-600' : 'text-gray-400'}`} />
                    <span className="flex-1">{label}</span>
                    {active && <span className="text-rose-600">●</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
