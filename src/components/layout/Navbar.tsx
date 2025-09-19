'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlassIcon, UserIcon, Bars3Icon, XMarkIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { Sparkles, Heart, Star, ShoppingBag } from 'lucide-react'
// Removed unused icons/components to satisfy ESLint unused rules
import dynamic from 'next/dynamic'
const CategoryMegaMenu = dynamic(() => import('./CategoryMegaMenu'), { ssr: false })
const MobileCategoryMenu = dynamic(() => import('./MobileCategoryMenu'), { ssr: false })
import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete'
import { fetchAllMainCategoriesWithHierarchy } from '@/lib/api/categoriesClient'
import { getCartCount, getFavoriteCount } from '@/lib/api/cartClient'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { getOptimalGlassConfig } from '@/lib/glassmorphism'
import { cn } from '@/lib/utils'

import { Category } from '@/types/category'

export function Navbar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
  const [isMegaMenuHovered, setIsMegaMenuHovered] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const [navStage, setNavStage] = useState(0)
  const navStageRef = useRef(0)
  const lastScrollYRef = useRef(0)
  const scrollRafRef = useRef<number | null>(null)
  const [showDesktopBackToTop, setShowDesktopBackToTop] = useState(false)
  const [showMobileBackToTop, setShowMobileBackToTop] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const computeNavStage = (scrollY: number) => {
    if (scrollY > 320) return 3
    if (scrollY > 200) return 2
    if (scrollY > 96) return 1
    return 0
  }

  const mobileNavPillBase = 'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium transition-all duration-300 backdrop-blur-md border border-white/60 bg-white/70 text-rose-700 shadow-sm'
  const mobileNavPillOutline = 'border-rose-200/70 hover:border-rose-300 hover:bg-rose-50/80'
  const isCompact = navStage > 0
  const hideCategoryLayer = navStage >= 2
  const hideMainDesktopNav = navStage >= 3
  const headerShadowClass = navStage >= 3 ? 'shadow-sm' : navStage >= 1 ? 'shadow-md' : 'shadow-lg'
  const desktopNavVisibilityClass = hideMainDesktopNav ? 'h-0 opacity-0 pointer-events-none -translate-y-2 overflow-hidden' : 'h-12 opacity-100 translate-y-0'
  const categoryNavVisibilityClass = hideCategoryLayer ? 'h-0 opacity-0 pointer-events-none -translate-y-2 overflow-hidden' : 'h-auto opacity-100 translate-y-0'

  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Kategorileri hemen yükle, loading state'i kaldır
        const mainCategories = await fetchAllMainCategoriesWithHierarchy()
        setCategories(mainCategories)
      } catch (error) {
        console.error('Kategoriler yüklenemedi:', error)
        // Hata durumunda boş array set et
        setCategories([])
      }
    }
    loadCategories()
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


  // Scroll detection for navbar shrinking
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      if (scrollRafRef.current !== null) return

      scrollRafRef.current = window.requestAnimationFrame(() => {
        const currentY = window.scrollY || 0
        const nextStage = computeNavStage(currentY)

        if (navStageRef.current !== nextStage) {
          navStageRef.current = nextStage
          setNavStage(nextStage)
        }

        const mobileThreshold = Math.max(window.innerHeight * 0.5, 280)
        setShowDesktopBackToTop(nextStage >= 2 || currentY > 420)
        setShowMobileBackToTop(currentY > mobileThreshold)

        lastScrollYRef.current = currentY

        if (scrollRafRef.current !== null) {
          window.cancelAnimationFrame(scrollRafRef.current)
          scrollRafRef.current = null
        }
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const currentY = window.scrollY || 0
    const nextStage = computeNavStage(currentY)
    navStageRef.current = nextStage
    setNavStage(nextStage)
    const mobileThreshold = Math.max(window.innerHeight * 0.5, 280)
    setShowDesktopBackToTop(nextStage >= 2 || currentY > 420)
    setShowMobileBackToTop(currentY > mobileThreshold)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isMobileMenuOpen])

  const handleCategoryMouseEnter = (categoryId: string) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setHoveredCategoryId(categoryId)
    setIsMegaMenuOpen(true)
  }

  const handleCategoryMouseLeave = () => {
    // Mega menü içindeyse kapanmasın
    if (isMegaMenuHovered) {
      return; // Mega menü içindeyse hiç kapanmasın
    }
    
    const timeout = setTimeout(() => {
      setHoveredCategoryId(null)
      setIsMegaMenuOpen(false)
    }, 1000) // Çok daha geç kapanma - 1000ms
    setHoverTimeout(timeout)
  }

  const handleMegaMenuMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setIsMegaMenuHovered(true)
  }

  const handleMegaMenuMouseLeave = () => {
    setIsMegaMenuHovered(false)
    const timeout = setTimeout(() => {
      setHoveredCategoryId(null)
      setIsMegaMenuOpen(false)
    }, 800)
    setHoverTimeout(timeout)
  }

  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

  return (
    <header className={cn(
      'sticky top-0 z-[1000] safe-pt overflow-visible transition-[box-shadow,backdrop-filter] duration-150',
      getOptimalGlassConfig('navbar'),
      headerShadowClass
    )}>
      {/* Background Elements */}
      <div className="absolute inset-0 hidden md:block" aria-hidden="true">
        <motion.div
          className="absolute top-2 left-4 text-rose-200/40"
          animate={shouldReduceMotion ? undefined : { rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={16} />
        </motion.div>
        <motion.div
          className="absolute top-3 right-8 text-pink-200/40"
          animate={shouldReduceMotion ? undefined : { rotate: -360, scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          <Heart size={20} />
        </motion.div>
        <motion.div
          className="absolute top-1 right-20 text-purple-200/40"
          animate={shouldReduceMotion ? undefined : { rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        >
          <Star size={18} />
        </motion.div>
      </div>


      {/* Main Header */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn('flex justify-between items-center transition-[height] duration-150', navStage >= 3 ? 'h-11' : navStage >= 1 ? 'h-12' : 'h-16')} role="navigation" aria-label="Üst gezinme">
          {/* Logo */}
          <motion.div 
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/" className="flex flex-col group">
              <span className={`font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent group-hover:from-rose-700 group-hover:via-pink-700 group-hover:to-purple-700 transition-all duration-300 ${isCompact ? 'text-xl' : 'text-2xl'}`}>
                MeriDesignHouse
              </span>
              <span className="text-xs text-rose-500 -mt-1 font-medium">
                Tasarımın Merkezi
              </span>
            </Link>
          </motion.div>

          {/* Mobile Logout Button - Only show when user is logged in */}
          {user && (
            <motion.button
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg hover:shadow-xl"
              onClick={() => setShowLogoutConfirm(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Çıkış yap"
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </motion.button>
          )}

          {/* Search Bar - Desktop */}
          <motion.div 
            className="hidden md:flex flex-1 max-w-lg mx-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <SearchAutocomplete 
              placeholder="Ürün, kategori veya set ara..."
              className="w-full"
            />
          </motion.div>

          {/* Right Side Icons */}
          <motion.div 
            className="flex items-center space-x-3 md:space-x-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >

            {!user && (
              <motion.div
                className="md:hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/auth/login"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 text-rose-600 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-rose-200 hover:bg-rose-50/80"
                  aria-label="Giriş yap"
                >
                  <UserIcon className="h-5 w-5" />
                </Link>
              </motion.div>
            )}

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Desktop Cart & Favorites - moved to bottom navbar on mobile */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/cart" 
                    className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:from-orange-600 hover:to-rose-600 relative"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Sepetim</span>
                    {cartCount > 0 && (
                      <Badge 
                        className="absolute -top-2 -right-2 min-w-[22px] h-5 flex items-center justify-center text-[11px] font-bold rounded-full bg-rose-600 text-white ring-2 ring-white shadow-sm"
                      >
                        {cartCount > 99 ? '99+' : cartCount}
                      </Badge>
                    )}
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/favorites" 
                    className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:from-pink-600 hover:to-fuchsia-600 relative"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <Heart className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Favorilerim</span>
                    {favoriteCount > 0 && (
                      <Badge 
                        className="absolute -top-2 -right-2 min-w-[22px] h-5 flex items-center justify-center text-[11px] font-bold rounded-full bg-fuchsia-600 text-white ring-2 ring-white shadow-sm"
                      >
                        {favoriteCount > 99 ? '99+' : favoriteCount}
                      </Badge>
                    )}
                  </Link>
                </motion.div>
                
                {/* Profile - desktop shortcut */}
                <motion.div className="hidden md:block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/profile" 
                    className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-rose-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:from-purple-600 hover:to-rose-600"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">Profil</span>
                  </Link>
                </motion.div>
                
                {/* Sign Out - desktop only */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      console.debug('[Navbar] SignOut clicked')
                      await signOut()
                    } catch (e) {
                      console.error('[Navbar] SignOut error', e)
                    }
                  }}
                  className="hidden sm:block bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
                >
                  Çıkış
                </Button>
              </div>
            ) : (
              // Mobilde Giriş/Kayıt Ol butonlarını gizle (hamburger içinde sunulacak)
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
                  >
                    Giriş
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl"
                  >
                    Kayıt Ol
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg hover:shadow-xl"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isMobileMenuOpen ? 'Mobil menüyü kapat' : 'Mobil menüyü aç'}
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Main Navigation - mobilde de görünür sticky linkler */}
      <nav className="relative bg-gradient-to-r from-rose-50/50 to-pink-50/50 border-t border-rose-200/30 transition-[height,opacity] duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className={cn('hidden md:flex justify-center items-center space-x-8 transition-all duration-200', desktopNavVisibilityClass)}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="whitespace-nowrap"
            >
              <Link
                href="/"
                className="flex items-center text-rose-700 hover:text-rose-800 font-medium transition-all duration-300 hover:scale-105"
              >
                🏠 Ana Sayfa
              </Link>
            </motion.div>
            {user && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
                className="whitespace-nowrap"
              >
                <Link
                  href="/orders"
                  className="flex items-center text-rose-700 hover:text-rose-800 font-medium transition-all duration-300 hover:scale-105"
                >
                  📦 Siparişlerim
                </Link>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.135 }}
              className="whitespace-nowrap"
            >
              <Link
                href="/order-tracking"
                className="flex items-center text-rose-700 hover:text-rose-800 font-medium transition-all duration-300 hover:scale-105"
              >
                🔎 Sipariş Takip
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="whitespace-nowrap"
            >
              <Link
                href="/about"
                className="flex items-center text-rose-700 hover:text-rose-800 font-medium transition-all duration-300 hover:scale-105"
              >
                ℹ️ Hakkımızda
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="whitespace-nowrap"
            >
              <Link
                href="/design-studio"
                className="flex items-center text-rose-700 hover:text-rose-800 font-medium transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full"
              >
                🎨 Tasarım Atölyesi
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.225 }}
              className="whitespace-nowrap"
            >
              <Link
                href="/contact"
                className="flex items-center text-rose-700 hover:text-rose-800 font-medium transition-all duration-300 hover:scale-105"
              >
                📞 İletişim
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="whitespace-nowrap"
            >
              <Link
                href="/products"
                className="flex items-center text-rose-700 hover:text-rose-800 font-medium transition-all duration-300 hover:scale-105"
              >
                🛍️ Ürünler
              </Link>
            </motion.div>
          </div>
          
          {/* Mobile Navigation - Sticky Links */}
          <div className="md:hidden flex w-full items-center justify-center gap-2 px-2 py-3">
            <Link
              href="/sale"
              className={cn(
                mobileNavPillBase,
                'border border-transparent bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-300/40 flex-1 justify-center min-w-0'
              )}
            >
              <Star className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate text-center">Haftanın Ürünü</span>
            </Link>
            <Link
              href="/design-studio"
              className={cn(
                mobileNavPillBase,
                'border border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-300/40 flex-1 justify-center min-w-0'
              )}
            >
              <Sparkles className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate text-center">Tasarım Atölyesi</span>
            </Link>
            <Link
              href={user ? "/orders" : "/auth/login"}
              className={cn(mobileNavPillBase, mobileNavPillOutline, 'flex-1 justify-center min-w-0')}
              aria-label={user ? "Siparişlerim" : "Siparişlerim için giriş yap"}
            >
              <ShoppingBag className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate text-center">Siparişlerim</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Categories Navigation - mobile gizli */}
      <nav className={cn('relative bg-gradient-to-r from-rose-50/50 to-pink-50/50 border-t border-rose-200/30 z-[99998] overflow-visible hidden md:block transition-[height,opacity,transform] duration-200', categoryNavVisibilityClass)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center space-x-2 h-12 relative overflow-visible">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="whitespace-nowrap relative"
                onMouseEnter={() => handleCategoryMouseEnter(category.id)}
                onMouseLeave={handleCategoryMouseLeave}
              >
                <Link
                  href={`/categories/${category.slug}`}
                  className={`flex items-center px-3 py-1.5 rounded-full font-medium transition-all duration-300 hover:scale-105 text-sm ${
                    hoveredCategoryId === category.id
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
                      : 'text-rose-700 hover:text-rose-800 hover:bg-gradient-to-r hover:from-rose-100 hover:to-pink-100'
                  }`}
                >
                  {category.name}
                </Link>
                
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: categories.length * 0.02 }}
              className="whitespace-nowrap"
            >
              <Link
                href="/sale"
                className="flex items-center text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 font-medium transition-all duration-300 hover:scale-105 px-2.5 py-1 rounded-full shadow-lg hover:shadow-xl text-sm"
              >
                🔥 İndirim
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Sticky Mega Menu - Navbar dışında */}
        {hoveredCategoryId && (
          <div
            className="absolute top-full left-0 right-0 z-[999998]"
            onMouseEnter={handleMegaMenuMouseEnter}
            onMouseLeave={handleMegaMenuMouseLeave}
          >
            {(() => {
              const hoveredCategory = categories.find(cat => cat.id === hoveredCategoryId);
              if (!hoveredCategory) return null;
              
              return (
                <CategoryMegaMenu
                  category={hoveredCategory}
                  isOpen={isMegaMenuOpen}
                  onClose={() => {
                    setHoveredCategoryId(null);
                    setIsMegaMenuOpen(false);
                  }}
                  onHoverChange={setIsMegaMenuHovered}
                />
              );
            })()}
          </div>
        )}
        
      </nav>

      <AnimatePresence>
        {showDesktopBackToTop && (
          <motion.button
            key="desktop-back-to-top"
            type="button"
            className="hidden md:flex fixed bottom-8 right-8 h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xl shadow-rose-500/30 ring-1 ring-white/40 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-rose-200"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            aria-label="Yukarı dön"
          >
            <ChevronUpIcon className="h-6 w-6" />
          </motion.button>
        )}
        {showMobileBackToTop && (
          <motion.button
            key="mobile-back-to-top"
            type="button"
            className="md:hidden fixed bottom-24 right-4 h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-rose-600 shadow-lg shadow-rose-500/25 backdrop-blur-md transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-rose-200/80"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            aria-label="Yukarı dön"
          >
            <ChevronUpIcon className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          className="md:hidden bg-gradient-to-b from-white to-rose-50 border-t shadow-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-6 py-4 space-y-4">
            
            {/* Main Navigation Links */}
            <div className="pb-4 border-b border-rose-100">
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center py-3 px-4 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-500 rounded-xl transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🏠 Ana Sayfa
                </Link>
                <Link
                  href="/design-studio"
                  className="flex items-center py-3 px-4 text-purple-600 hover:text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 rounded-xl transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🎨 Tasarım Atölyesi
                </Link>
                <Link
                  href="/sale"
                  className="flex items-center py-3 px-4 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-xl transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ⭐ Haftanın Ürünü
                </Link>
                <Link
                  href="/about"
                  className="flex items-center py-3 px-4 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-500 rounded-xl transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ℹ️ Hakkımızda
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center py-3 px-4 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-500 rounded-xl transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  📞 İletişim
                </Link>
                <Link
                  href="/products"
                  className="flex items-center py-3 px-4 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-500 rounded-xl transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🛍️ Ürünler
                </Link>
                {user && (
                    <Link
                    href="/orders"
                    className="flex items-center py-3 px-4 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-500 rounded-xl transition-all duration-300 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                      📦 Siparişlerim
                  </Link>
                )}
                <Link
                  href="/order-tracking"
                  className="flex items-center py-3 px-4 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-500 rounded-xl transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🔎 Sipariş Takip
                </Link>
              </div>
            </div>
            
            {/* Categories - Hierarchical Mobile Menu */}
            <div className="pb-4 border-b border-rose-100">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Kategoriler</h3>
              <div className="space-y-1">
                <MobileCategoryMenu 
                  categories={categories}
                  onCategoryClick={() => setIsMobileMenuOpen(false)}
                />
                <Link
                  href="/sale"
                  className="flex items-center py-2 px-4 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-lg transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🔥 İndirim
                </Link>
              </div>
            </div>
            {!user && (
              <motion.div 
                className="pt-4 border-t border-rose-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/auth/login"
                    className="flex items-center justify-center py-2.5 px-3 text-sm bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Giriş
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex items-center justify-center py-2.5 px-3 text-sm border-2 border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg font-medium transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Kayıt Ol
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowLogoutConfirm(false)}
            />
            
            {/* Dialog */}
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Çıkış Yap
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 text-center mb-6">
                Çıkış yapmak istediğinizden emin misiniz?
              </p>
              
              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                >
                  İptal
                </button>
                <button
                  onClick={async () => {
                    try {
                      await signOut()
                      setShowLogoutConfirm(false)
                    } catch (error) {
                      console.error('Çıkış yapılırken hata:', error)
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Çıkış Yap
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}


