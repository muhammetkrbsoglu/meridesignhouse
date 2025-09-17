"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  HomeIcon, 
  Squares2X2Icon, 
  HeartIcon, 
  ShoppingBagIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { 
  HomeIcon as HomeIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  HeartIcon as HeartIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid'
import { getOptimalGlassConfig } from '@/lib/glassmorphism'
import { cn } from '@/lib/utils'
import { getCartCount, getFavoriteCount } from '@/lib/actions/cart'
import { motion, useReducedMotion } from 'framer-motion'

const items = [
  { 
    href: '/', 
    label: 'Ana', 
    icon: HomeIcon, 
    activeIcon: HomeIconSolid,
    showBadge: false
  },
  { 
    href: '/products', 
    label: 'Kategoriler', 
    icon: Squares2X2Icon, 
    activeIcon: Squares2X2IconSolid,
    showBadge: false
  },
  { 
    href: '/search', 
    label: 'Ara', 
    icon: MagnifyingGlassIcon, 
    activeIcon: MagnifyingGlassIconSolid,
    showBadge: false
  },
  { 
    href: '/favorites', 
    label: 'Favori', 
    icon: HeartIcon, 
    activeIcon: HeartIconSolid,
    showBadge: true,
    badgeKey: 'favorites'
  },
  { 
    href: '/cart', 
    label: 'Sepet', 
    icon: ShoppingBagIcon, 
    activeIcon: ShoppingBagIconSolid,
    showBadge: true,
    badgeKey: 'cart'
  },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [cartCount, setCartCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  // Load cart and favorite counts
  useEffect(() => {
    if (user) {
      const loadCounts = async () => {
        try {
          const [cart, favorites] = await Promise.all([
            getCartCount(),
            getFavoriteCount()
          ])
          setCartCount(cart)
          setFavoriteCount(favorites)
        } catch (error) {
          console.error('Counts yüklenirken hata:', error)
        }
      }
      loadCounts()
    } else {
      setCartCount(0)
      setFavoriteCount(0)
    }
  }, [user])

  // Listen for cart and favorite updates
  useEffect(() => {
    const handleCartUpdate = () => {
      if (user) {
        getCartCount().then(setCartCount).catch(console.error)
      }
    }

    const handleFavoriteUpdate = () => {
      if (user) {
        getFavoriteCount().then(setFavoriteCount).catch(console.error)
      }
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('favoriteUpdated', handleFavoriteUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('favoriteUpdated', handleFavoriteUpdate)
    }
  }, [user])

  const getBadgeCount = (badgeKey: string) => {
    switch (badgeKey) {
      case 'cart':
        return cartCount
      case 'favorites':
        return favoriteCount
      default:
        return 0
    }
  }

  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: 0.1
      }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[1000] safe-pb md:hidden',
        'border-t border-white/20',
        getOptimalGlassConfig('bottom-bar')
      )}
    >
      <div className="mx-auto max-w-7xl px-2 py-1">
        <ul className="grid grid-cols-5 gap-1">
          {items.map(({ href, label, icon: Icon, activeIcon: ActiveIcon, showBadge, badgeKey }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            const badgeCount = showBadge ? getBadgeCount(badgeKey!) : 0
            const showBadgeNumber = badgeCount > 0
            
            return (
              <motion.li 
                key={href} 
                className="flex"
                whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link
                  href={href}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center rounded-xl py-2 px-1 relative',
                    'motion-safe:transition-all motion-safe:duration-200',
                    active
                      ? 'text-rose-600 bg-rose-50/80 backdrop-blur-sm'
                      : 'text-gray-700 hover:text-rose-600 hover:bg-rose-50/40'
                  )}
                  aria-label={label}
                >
                  <div className="relative">
                    {active ? (
                      <ActiveIcon className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                    {showBadgeNumber && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          'absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-semibold',
                          'bg-rose-500 text-white border-2 border-white',
                          'motion-safe:animate-pulse'
                        )}
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </motion.span>
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] leading-3 mt-1 font-medium',
                    active ? 'text-rose-600' : 'text-gray-600'
                  )}>
                    {label}
                  </span>
                  
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-500 rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </motion.nav>
  )
}
