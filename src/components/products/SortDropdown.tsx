"use client"

import React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FunnelIcon, ChevronDownIcon, CalendarDaysIcon, ArrowUpIcon, ArrowDownIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

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
    <div className="relative inline-block w-full sm:w-auto text-left">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'inline-flex w-full items-center justify-between gap-2 rounded-xl border border-rose-100 bg-white/80 px-3 py-2 text-sm font-medium text-rose-600 shadow-sm backdrop-blur transition-colors duration-200 hover:border-rose-200 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200 sm:w-auto sm:justify-center',
          open && 'border-rose-200 bg-rose-50 text-rose-700'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CurrentIcon className="h-4 w-4 text-rose-500" />
        <span>{getLabel(current)}</span>
        <ChevronDownIcon className={cn('h-4 w-4 text-rose-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-rose-100 bg-white/95 shadow-xl backdrop-blur-sm">
          <ul role="listbox" className="max-h-64 overflow-auto py-1">
            {OPTIONS.map(({ value, label, Icon }) => {
              const active = current === value
              return (
                <li key={value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => applySort(value)}
                    className={cn(
                      'inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-rose-50',
                      active ? 'text-rose-700' : 'text-gray-600'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', value === 'oldest' && 'rotate-180', active ? 'text-rose-600' : 'text-gray-400')} />
                    <span className="flex-1 truncate">{label}</span>
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

