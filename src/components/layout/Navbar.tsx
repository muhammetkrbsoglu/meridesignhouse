'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlassIcon, UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Sparkles, Heart, Star, ShoppingBag } from 'lucide-react'
// Removed unused icons/components to satisfy ESLint unused rules
import dynamic from 'next/dynamic'
const CategoryMegaMenu = dynamic(() => import('./CategoryMegaMenu'), { ssr: false })
const MobileCategoryMenu = dynamic(() => import('./MobileCategoryMenu'), { ssr: false })
import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete'
import { fetchAllMainCategoriesWithHierarchy } from '@/lib/api/categoriesClient'
import { getCartCount, getFavoriteCount } from '@/lib/api/cartClient'
import { motion, useReducedMotion } from 'framer-motion'
import { getOptimalGlassConfig } from '@/lib/glassmorphism'
import { cn } from '@/lib/utils'

import { Category } from '@/types/category'

export function Navbar() {
  const { user, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
  const [isMegaMenuHovered, setIsMegaMenuHovered] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const [isCompact, setIsCompact] = useState(false)
  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)

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

  // Compact/expand davranışı: aşağı kayınca kompakt, yukarıda geniş
  useEffect(() => {
    let lastTime = 0
    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY || 0
        const last = lastScrollYRef.current
        const now = Date.now()
        const deltaTime = now - lastTime
        lastTime = now
        
        // Dinamik threshold: yavaş scroll'da daha düşük threshold
        const scrollDelta = Math.abs(y - last)
        const scrollSpeed = scrollDelta / (deltaTime || 16) // pixels per ms
        const dynamicThreshold = scrollSpeed < 0.5 ? 3 : 8 // Yavaş scroll'da 3px, hızlı scroll'da 8px
        
        if (y > last + dynamicThreshold && y > 60) {
          setIsCompact(true)
        } else if (y < last - dynamicThreshold) {
          setIsCompact(false)
        }
        lastScrollYRef.current = y
        tickingRef.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      isCompact ? 'shadow-md' : 'shadow-lg'
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

      {/* Top Bar - mobile gizli */}
      <div className={`relative bg-gradient-to-r from-rose-100/50 to-pink-100/50 border-b border-rose-200/30 overflow-hidden transition-[height,opacity] duration-150 ${isCompact ? 'h-0 opacity-0' : 'h-10 opacity-100'} hidden md:block`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isCompact ? 'pointer-events-none' : ''}`}>
          <div className="flex justify-between items-center h-10 text-sm">
            <div className="flex items-center space-x-4">
              <motion.span 
                className="text-rose-700 font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                ✨ Ücretsiz kargo 500₺ ve üzeri alışverişlerde
              </motion.span>
            </div>
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Link href="/contact" className="text-rose-600 hover:text-rose-800 font-medium transition-colors duration-300">
                  İletişim
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Link href="/help" className="text-rose-600 hover:text-rose-800 font-medium transition-colors duration-300">
                  Yardım
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${isCompact ? 'h-12' : 'h-16'} transition-[height] duration-150`} role="navigation" aria-label="Üst gezinme">
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
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >


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
                
                {/* Profile - always visible */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
              className="md:hidden p-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg hover:shadow-xl"
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
          <div className="hidden md:flex justify-center items-center space-x-8 h-12">
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
          <div className="md:hidden flex justify-center items-center space-x-4 h-10 overflow-x-auto">
            <Link
              href="/sale"
              className="flex items-center text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 font-medium transition-all duration-300 text-xs whitespace-nowrap px-3 py-1.5 rounded-lg shadow-md"
            >
              ⭐ Haftanın Ürünü
            </Link>
            <Link
              href="/design-studio"
              className="flex items-center text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-medium transition-all duration-300 text-xs whitespace-nowrap px-3 py-1.5 rounded-lg shadow-md"
            >
              🎨 Tasarım Atölyesi
            </Link>
            <Link
              href={user ? "/orders" : "/auth/login"}
              className="flex items-center text-rose-700 hover:text-rose-800 font-medium transition-all duration-300 text-xs whitespace-nowrap px-2 py-1 rounded-lg hover:bg-rose-50"
              title={user ? "Siparişlerinizi görüntüleyin" : "Siparişlerinizi görüntülemek için giriş yapınız"}
            >
              {user ? "Siparişlerim" : "Siparişlerim (Giriş Gerekli)"}
            </Link>
          </div>
        </div>
      </nav>

      {/* Categories Navigation - mobile gizli */}
      <nav className="relative bg-gradient-to-r from-rose-50/50 to-pink-50/50 border-t border-rose-200/30 z-[99998] overflow-visible hidden md:block">
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
    </header>
  )
}

