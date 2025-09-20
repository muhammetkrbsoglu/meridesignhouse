'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeftIcon, ChevronRightIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { StarIcon as Star } from '@heroicons/react/24/solid'
import { formatCurrency } from '@/lib/utils'
import { fetchAllWeeklyFeaturedProducts } from '@/lib/api/menuClient'
import type { MenuProduct } from '@/types/menu'

export function WeeklyFeaturedSlider() {
  const [products, setProducts] = useState<MenuProduct[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  const autoSlideIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartRef = useRef<number | null>(null)
  const touchEndRef = useRef<number | null>(null)

  // Auto-slide interval (5.5 seconds for both desktop and mobile)
  const AUTO_SLIDE_DELAY = 5500

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const featuredProducts = await fetchAllWeeklyFeaturedProducts()
        setProducts(featuredProducts)
      } catch (error) {
        console.error('Haftanın seçimi ürünleri yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])


  // Auto-slide functionality
  const startAutoSlide = useCallback(() => {
    if (products.length === 0) return

    // Clear existing interval
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current)
    }

    // Start auto slide
    autoSlideIntervalRef.current = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev + 1) % products.length)
      }
    }, AUTO_SLIDE_DELAY)
  }, [products.length, isPaused, AUTO_SLIDE_DELAY])

  const stopAutoSlide = useCallback(() => {
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current)
      autoSlideIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      startAutoSlide()
    }

    return () => stopAutoSlide()
  }, [products.length, startAutoSlide, stopAutoSlide])


  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length)
  }

  // Touch handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return

    const distance = touchStartRef.current - touchEndRef.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }

    touchStartRef.current = null
    touchEndRef.current = null
  }

  // Pause/resume on hover for desktop
  const handleMouseEnter = () => {
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-b from-rose-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
          <div className="animate-pulse">
            <div className="aspect-[16/9] bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  const currentProduct = products[currentIndex]
  const categoryName = currentProduct.categories[0]?.name || 'Genel'

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-rose-50 to-purple-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-lg">
            ⭐ Haftanın Seçimi
          </div>
          <h2 className="text-xl sm:text-2xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            {categoryName} Kategorisinde Özenle Seçilmiş
          </h2>
          <p className="hidden sm:block text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Her hafta farklı kategorilerden el yapımı hediyelerimizle tanışın
          </p>
          
          {/* İpucu Bandı */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-block bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-center gap-3 text-amber-800">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <LightBulbIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              </motion.div>
              <p className="text-sm font-medium text-center leading-relaxed">
                Her kategoride <span className="font-semibold text-amber-900">haftanın seçimi</span> var!
                Tıklayın ve özenle seçilmiş el yapımı hediyeleri keşfedin
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Slider Container */}
        <div
          className="relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main Slider */}
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[3000px] sm:max-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="aspect-[4/5] md:aspect-[16/7]"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 h-full gap-0.5">
                  {/* Image Section */}
                  <div className="relative overflow-hidden">
                    <Image
                      src={currentProduct.images[0] || '/placeholder-product.svg'}
                      alt={currentProduct.name}
                      fill
                      className="object-cover"
                      sizes="(min-width:1024px) 50vw, 100vw"
                    />

                    {/* Category Badge */}
                    <div className="absolute top-6 left-6">
                      <span className="bg-white/90 backdrop-blur-sm text-rose-700 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        {categoryName}
                      </span>
                    </div>

                    {/* "Bu Hafta Özel" Badge */}
                    <div className="absolute top-6 right-6">
                      <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        Bu Hafta Özel
                      </span>
                    </div>

                    {/* Navigation Arrows - Desktop (only for image area) */}
                    <div className="hidden md:block absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none">
                      <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-auto">
                        <button
                          onClick={goToPrevious}
                          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-rose-600 hover:text-rose-700 hover:scale-110 transform translate-y-2 group-hover:translate-y-0"
                          aria-label="Önceki ürün"
                        >
                          <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={goToNext}
                          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-rose-600 hover:text-rose-700 hover:scale-110 transform translate-y-2 group-hover:translate-y-0"
                          aria-label="Sonraki ürün"
                        >
                          <ChevronRightIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex flex-col justify-center p-4 lg:p-8 bg-gradient-to-br from-white via-rose-50 to-pink-50 relative overflow-hidden">
                    {/* Background decorative elements */}
                    <div className="absolute top-4 right-4 w-8 h-8 bg-rose-200/30 rounded-full blur-sm animate-pulse"></div>
                    <div className="absolute bottom-8 left-8 w-6 h-6 bg-pink-200/40 rounded-full blur-sm animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-4 w-4 h-4 bg-purple-200/30 rounded-full blur-sm animate-pulse delay-500"></div>

                    <div className="relative z-10">
                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.3 }}
                          >
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          </motion.div>
                        ))}
                        <span className="text-sm text-gray-600 ml-2 font-medium">4.9/5</span>
                      </div>

                      {/* Campaign badges - Desktop */}
                      <div className="hidden md:flex flex-wrap gap-2 mb-4">
                        <motion.span
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.4 }}
                          className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                        >
                          🎉 Bu Haftanın En Popüler Ürünü
                        </motion.span>
                        <motion.span
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.4 }}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                        >
                          ✨ Özenle Seçildi
                        </motion.span>
                        <motion.span
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.4 }}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse"
                        >
                          🔥 Sınırlı Stok
                        </motion.span>
                      </div>

                      {/* Campaign badges - Mobile (on image) */}
                      <div className="md:hidden absolute top-4 left-4 flex flex-col gap-1">
                        <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                          🎉 En Popüler
                        </span>
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                          ✨ Özenle Seçildi
                        </span>
                        <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
                          🔥 Sınırlı Stok
                        </span>
                      </div>

                      {/* Product Name */}
                      <motion.h3
                        className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1 md:mb-3 leading-tight"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      >
                        {currentProduct.name}
                      </motion.h3>

                      {/* Product Description */}
                      <motion.p
                        className="text-gray-600 text-xs md:text-sm mb-1 md:mb-4 leading-relaxed"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        El yapımı özel tasarım. Her detay özenle işlendi. Kalite ve zarafet bir arada.
                      </motion.p>

                      {/* Special campaign highlight with price */}
                      <motion.div
                        className="bg-gradient-to-r from-rose-100 to-pink-100 border-2 border-rose-300 rounded-xl p-2 md:p-3 mb-1 md:mb-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.4 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs md:text-sm">
                            <span className="text-lg">💝</span>
                            <span>Özel El Yapımı Tasarım</span>
                          </div>
                          <div className="text-lg md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                            {formatCurrency(currentProduct.price)}
                          </div>
                        </div>
                      </motion.div>

                      {/* Action Button - Mobile */}
                      <motion.div
                        className="md:hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        <Link
                          href={`/products/${currentProduct.slug}`}
                          className="block bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg font-semibold text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <span className="text-xs">Ürünü İncele</span>
                        </Link>
                      </motion.div>


                      {/* Action Buttons - Desktop */}
                      <motion.div
                        className="hidden md:flex flex-col sm:flex-row gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                      >
                        <Link
                          href={`/products/${currentProduct.slug}`}
                          className="flex-1 min-w-[140px] bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-4 py-3 rounded-xl font-semibold text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden group flex items-center justify-center"
                        >
                          <span className="relative z-10">Ürünü İncele</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                        <Link
                          href={`/categories/${currentProduct.categories[0]?.slug}`}
                          className="flex-1 min-w-[140px] bg-white border-2 border-rose-500 text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-xl font-semibold text-center transition-all duration-300 relative overflow-hidden group flex items-center justify-center"
                        >
                          <span className="relative z-10">{categoryName} Kategorisini Keşfet</span>
                          <div className="absolute inset-0 bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>



          {/* Dots Indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-rose-500 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`${index + 1}. ürüne git`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Background Decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-rose-200/30 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200/30 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-200/40 rounded-full blur-lg"></div>
    </section>
  )
}
