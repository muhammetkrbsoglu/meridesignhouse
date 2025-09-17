"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, Squares2X2Icon, HeartIcon, ShoppingBagIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { getOptimalGlassConfig } from '@/lib/glassmorphism'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Ana', icon: HomeIcon },
  { href: '/products', label: 'Kategoriler', icon: Squares2X2Icon },
  { href: '/search', label: 'Ara', icon: MagnifyingGlassIcon },
  { href: '/favorites', label: 'Favori', icon: HeartIcon },
  { href: '/cart', label: 'Sepet', icon: ShoppingBagIcon },
]

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-[1000] safe-pb md:hidden',
      getOptimalGlassConfig('bottom-bar')
    )}>
      <ul className="mx-auto max-w-7xl grid grid-cols-5 gap-1 px-3 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                className={`flex-1 flex flex-col items-center justify-center rounded-md py-1.5 ${
                  active
                    ? 'text-rose-600 bg-rose-50'
                    : 'text-gray-700 hover:text-rose-600 hover:bg-rose-50/60'
                }`}
                aria-label={label}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[11px] leading-4 mt-0.5">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
