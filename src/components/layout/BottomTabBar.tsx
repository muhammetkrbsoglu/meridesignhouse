
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  HomeIcon,
  Squares2X2Icon,
  HeartIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  HeartIcon as HeartIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid'
import { getOptimalGlassConfig, getGlassIntensity, type GlassIntensity } from '@/lib/glassmorphism'
import { cn, formatPrice } from '@/lib/utils'
import { getCartCount, getFavoriteCount } from '@/lib/api/cartClient'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete'
import { createAnonClient } from '@/lib/supabase'
import { useKeyboardInsets } from '@/hooks/useKeyboardInsets'

type WeeklyProductHighlight = {
  id: string
  name: string
  slug: string
  price?: number | string | null
  image?: string | null
}

const WEEKLY_PRODUCT_FETCH_LIMIT = 6

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
    label: 'Urunler',
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
    label: 'Favoriler',
    icon: HeartIcon,
    activeIcon: HeartIconSolid,
    showBadge: true,
    badgeKey: 'favorites'
  },
  {
    href: '/cart',
    label: 'Sepetim',
    icon: ShoppingBagIcon,
    activeIcon: ShoppingBagIconSolid,
    showBadge: true,
    badgeKey: 'cart'
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: UserIcon,
    activeIcon: UserIconSolid,
    showBadge: false
  }
]

export function BottomTabBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [cartCount, setCartCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [isCompact, setIsCompact] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [weeklyProduct, setWeeklyProduct] = useState<WeeklyProductHighlight | null>(null)
  const [isWeeklyProductLoading, setIsWeeklyProductLoading] = useState(false)
  const [searchGlassIntensity, setSearchGlassIntensity] = useState<GlassIntensity>('medium')
  const { bottom: keyboardInset } = useKeyboardInsets()
  const lastScrollYRef = useRef(0)
  const scrollRafRef = useRef<number | null>(null)
  const compactStateRef = useRef(false)

  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  const keyboardPadding = Math.max(16, Math.round(keyboardInset)) + 16

  useEffect(() => {
    if (typeof window === 'undefined') return

    setSearchGlassIntensity(getGlassIntensity())
  }, [])

  const searchPanelGlass = useMemo(() => {
    const palette: Record<GlassIntensity, string> = {
      subtle: 'relative flex h-full flex-col gap-4 rounded-t-3xl border border-white/35 bg-white/94 p-4 shadow-lg supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-125',
      medium: 'relative flex h-full flex-col gap-4 rounded-t-3xl border border-white/30 bg-white/85 p-4 shadow-xl supports-[backdrop-filter]:bg-white/65 supports-[backdrop-filter]:backdrop-blur-lg supports-[backdrop-filter]:backdrop-saturate-150',
      strong: 'relative flex h-full flex-col gap-4 rounded-t-3xl border border-white/24 bg-white/80 p-4 shadow-2xl supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150'
    }

    return cn(
      'overflow-hidden md:border-white/20 md:shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)]',
      shouldReduceMotion ? 'transition-none' : 'transition-colors duration-300 ease-out',
      palette[searchGlassIntensity]
    )
  }, [searchGlassIntensity, shouldReduceMotion])

  const searchBackdropClass = useMemo(() => {
    const tint = searchGlassIntensity === 'subtle' ? 'bg-slate-900/40' : 'bg-slate-900/55'
    const blur = shouldReduceMotion
      ? 'backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-sm'
      : searchGlassIntensity === 'strong'
        ? 'backdrop-blur-lg supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150'
        : 'backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150'
    return cn(
      'absolute inset-0 transition-opacity duration-300',
      shouldReduceMotion ? 'transition-none' : '',
      tint,
      blur
    )
  }, [searchGlassIntensity, shouldReduceMotion])

  useEffect(() => {
    compactStateRef.current = isCompact
  }, [isCompact])

  // Scroll detection for navbar shrinking
  useEffect(() => {
    if (typeof window === 'undefined') return

    lastScrollYRef.current = window.scrollY

    const handleScroll = () => {
      const currentY = window.scrollY
      if (scrollRafRef.current !== null) return

      scrollRafRef.current = window.requestAnimationFrame(() => {
        const previousY = lastScrollYRef.current
        const delta = currentY - previousY
        const magnitude = Math.abs(delta)
        const threshold = magnitude > 28 ? 10 : 4

        if (delta > threshold && currentY > 48) {
          if (!compactStateRef.current) {
            setIsCompact(true)
          }
        } else if (delta < -threshold || currentY <= 32) {
          if (compactStateRef.current) {
            setIsCompact(false)
          }
        }

        lastScrollYRef.current = currentY
        scrollRafRef.current = null
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current)
      }
    }
  }, [])

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
          console.error('Counts yuklenirken hata:', error)
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

  // Prevent background scroll when search is open
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!isSearchOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isSearchOpen])

  // Fetch weekly product when search opens
  useEffect(() => {
    if (!isSearchOpen) return

    let isCancelled = false

    const loadWeeklyProduct = async () => {
      try {
        setIsWeeklyProductLoading(true)
        const supabase = createAnonClient()
        const { data, error } = await supabase
          .from('products')
          .select('id,name,slug,price,product_images(url,sortOrder)')
          .eq('isActive', true)
          .eq('isProductOfWeek', true)
          .limit(WEEKLY_PRODUCT_FETCH_LIMIT)

        if (isCancelled) {
          return
        }

        if (error) {
          console.error('Haftanin urunu getirilirken hata:', error)
          setWeeklyProduct(null)
          return
        }

        if (data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length)
          const raw = data[randomIndex] as any

          const sortedImages = Array.isArray(raw?.product_images)
            ? [...raw.product_images].sort(
                (a: any, b: any) => ((a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))
              )
            : []

          setWeeklyProduct({
            id: raw.id,
            name: raw.name,
            slug: raw.slug,
            price: raw.price,
            image: sortedImages[0]?.url ?? null
          })
        } else {
          setWeeklyProduct(null)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Haftanin urunu getirilirken hata:', error)
          setWeeklyProduct(null)
        }
      } finally {
        if (!isCancelled) {
          setIsWeeklyProductLoading(false)
        }
      }
    }

    loadWeeklyProduct()

    return () => {
      isCancelled = true
    }
  }, [isSearchOpen])

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
    <>
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{
          y: isSearchOpen ? 80 : 0,
          opacity: isSearchOpen ? 0 : 1,
          minHeight: isCompact ? 66 : 84,
          paddingTop: isCompact ? 8 : 12,
          paddingBottom: isCompact ? 8 : 14,
          scale: isCompact ? 0.98 : 1
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 }
        }
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[900] safe-pb md:hidden',
          'border-t border-white/20',
          getOptimalGlassConfig('bottom-bar')
        )}
        style={{ pointerEvents: isSearchOpen ? 'none' : 'auto', originY: 1, willChange: 'transform, padding, min-height' }}
      >
        <div className="mx-auto max-w-7xl px-2 py-1">
          <ul className="grid grid-cols-6 gap-1">
            {items.map(({ href, label, icon: Icon, activeIcon: ActiveIcon, showBadge, badgeKey }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              const badgeCount = showBadge ? getBadgeCount(badgeKey!) : 0
              const showBadgeNumber = badgeCount > 0

              return (
                <motion.li
                  key={href}
                  className="flex"
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Link
                    href={href}
                    className={cn(
                      'relative flex flex-1 flex-col items-center justify-center rounded-xl px-1 py-2',
                      'motion-safe:transition-all motion-safe:duration-200',
                      active
                        ? 'bg-rose-50/80 text-rose-600 backdrop-blur-sm'
                        : 'text-gray-700 hover:bg-rose-50/40 hover:text-rose-600'
                    )}
                    aria-label={label}
                    onClick={(e) => {
                      if (href === '/search') {
                        e.preventDefault()
                        handleOpenSearch()
                      }
                    }}
                  >
                    <div className="relative">
                      {active ? (
                        <ActiveIcon className={cn('transition-all duration-200', isCompact ? 'h-5 w-5' : 'h-6 w-6')} />
                      ) : (
                        <Icon className={cn('transition-all duration-200', isCompact ? 'h-5 w-5' : 'h-6 w-6')} />
                      )}
                      {showBadgeNumber && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
                            'border-2 border-white bg-rose-500 text-white',
                            'motion-safe:animate-pulse'
                          )}
                        >
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </motion.span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-1 leading-3 font-medium transition-all duration-200',
                        isCompact ? 'text-[9px]' : 'text-[10px]',
                        active ? 'text-rose-600' : 'text-gray-600'
                      )}
                    >
                      {label}
                    </span>

                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-rose-500"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.li>
              )
            })}
          </ul>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            key="mobile-search-sheet"
            className="fixed inset-0 z-[1200] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobil arama"
          >
            <motion.div
              className={searchBackdropClass}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              onClick={closeSearch}
            />

            <motion.div
              className="relative flex h-full w-full justify-center"
              initial={{ y: shouldReduceMotion ? 0 : 40 }}
              animate={{ y: 0 }}
              exit={{ y: shouldReduceMotion ? 0 : 40 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <div
                className="relative flex h-full w-full max-w-3xl flex-col px-4"
                style={{
                  paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
                  paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${keyboardPadding}px)`
                }}
              >
                <div
                  className={searchPanelGlass}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    className="pointer-events-none absolute inset-0 rounded-t-3xl bg-gradient-to-b from-white/75 via-white/30 to-white/10 opacity-90 supports-[backdrop-filter]:from-white/25 supports-[backdrop-filter]:via-white/10 supports-[backdrop-filter]:to-white/5"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),_transparent_70%)]"
                    aria-hidden="true"
                  />
                  <div className="relative flex h-full flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium uppercase tracking-wide text-gray-600">Arama</span>
                      <button
                        type="button"
                        onClick={closeSearch}
                        className="rounded-full bg-white/70 p-2 text-gray-600 transition hover:bg-white/90"
                        aria-label="Kapat"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <SearchAutocomplete
                      placeholder="Urun, kategori veya set ara..."
                      className="w-full"
                      autoFocus
                      maxSuggestions={4}
                      onSearch={closeSearch}
                      onNavigate={closeSearch}
                      footerContent={
                        <WeeklyProductFooter
                          product={weeklyProduct}
                          isLoading={isWeeklyProductLoading}
                          onSelect={closeSearch}
                        />
                      }
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function WeeklyProductFooter({
  product,
  isLoading,
  onSelect
}: {
  product: WeeklyProductHighlight | null
  isLoading: boolean
  onSelect: () => void
}) {
  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="h-16 w-full animate-pulse rounded-2xl bg-gray-100" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="px-4 py-6 text-xs text-gray-500">
        Bu hafta one cikan bir urun bulunamadi.
      </div>
    )
  }

  const priceValue = typeof product.price === 'number'
    ? product.price
    : product.price
      ? Number(product.price)
      : null

  const formattedPrice = typeof priceValue === 'number' && !Number.isNaN(priceValue)
    ? formatPrice(priceValue)
    : null

  return (
    <div className="px-4 py-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Haftanin Urunu
      </div>
      <Link
        href={`/products/${product.slug}`}
        onClick={onSelect}
        className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/70 p-3 text-left shadow-sm transition hover:bg-white/80"
      >
        {product.image ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-xl">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-rose-100 text-rose-500">
            <MagnifyingGlassIcon className="h-6 w-6" />
          </div>
        )}
        <div className="flex flex-1 flex-col overflow-hidden">
          <span className="truncate text-sm font-semibold text-gray-900">{product.name}</span>
          {formattedPrice && (
            <span className="text-sm font-semibold text-rose-600">{formattedPrice}</span>
          )}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-rose-500">
          Detay
        </span>
      </Link>
    </div>
  )
}
