"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion, PanInfo } from 'framer-motion'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { SearchAutocomplete } from './SearchAutocomplete'
import { formatPrice } from '@/lib/utils'

interface SearchSheetModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export function SearchSheetModal({ isOpen, onClose, initialQuery }: SearchSheetModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery || '')
  const [viewportHeight, setViewportHeight] = useState('100vh')
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const [realTimeResults, setRealTimeResults] = useState<any[]>([])
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const sheetRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Handle sheet drag gesture
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 100
    if (info.offset.y > threshold) {
      onClose()
    }
  }, [onClose])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === overlayRef.current) {
      onClose()
    }
  }, [onClose])

  // Handle navigation
  const handleNavigate = useCallback(() => {
    onClose()
  }, [onClose])

  // Handle real-time search results
  const handleRealTimeResults = useCallback((results: any[]) => {
    setRealTimeResults(results)
    setIsLoadingResults(false)
  }, [])

  // Handle search query change for mobile real-time results
  const handleQueryChange = useCallback((query: string) => {
    setSearchQuery(query)
    if (query.length >= 2) {
      setIsLoadingResults(true)
    } else {
      setIsLoadingResults(false)
      setRealTimeResults([])
    }
  }, [])

  // Handle search completion
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    onClose()
  }, [onClose])

  // Handle viewport height changes for keyboard
  useEffect(() => {
    const updateViewportMetrics = () => {
      if (typeof window === 'undefined') return

      if (window.visualViewport) {
        const { height, offsetTop } = window.visualViewport
        const layoutHeight = window.innerHeight
        const offset = Math.max(0, layoutHeight - height - offsetTop)

        setViewportHeight(`${height}px`)
        setKeyboardOffset(offset)
      } else {
        // Fallback for browsers without visual viewport support
        setViewportHeight('100vh')
        setKeyboardOffset(0)
      }
    }

    updateViewportMetrics()

    if (typeof window !== 'undefined') {
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateViewportMetrics)
        window.visualViewport.addEventListener('scroll', updateViewportMetrics)
      } else {
        window.addEventListener('resize', updateViewportMetrics)
      }

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', updateViewportMetrics)
          window.visualViewport.removeEventListener('scroll', updateViewportMetrics)
        } else {
          window.removeEventListener('resize', updateViewportMetrics)
        }
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modern Backdrop with Blur */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.1 : 0.2,
              ease: 'easeOut'
            }}
            className={cn(
              'fixed inset-0 z-[1200] md:hidden',
              // Modern backdrop blur effect
              'backdrop-blur-sm',
              // iOS Safari için özel backdrop
              'supports-[backdrop-filter]:bg-black/20',
              'bg-black/20'
            )}
            style={{ height: viewportHeight }}
            onClick={handleBackdropClick}
            aria-hidden="true"
            role="presentation"
          />

          {/* Search Sheet Container */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[1201] md:hidden',
              'rounded-t-3xl',
              'cursor-grab active:cursor-grabbing',
              // Modern glassmorphism effect
              'bg-white/95 backdrop-blur-xl',
              'border-t border-white/20',
              'supports-[backdrop-filter]:bg-white/90',
              'shadow-2xl'
            )}
            style={{ height: viewportHeight, paddingBottom: keyboardOffset }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-title"
            aria-describedby="search-modal-description"
          >
            {/* Sheet Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Search Header */}
            <div className="px-4 pb-3 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
                  <h2
                    id="search-modal-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Arama
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className={cn(
                    'rounded-full p-2',
                    'text-gray-500 hover:text-gray-700',
                    'hover:bg-gray-100/80',
                    'transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-rose-200'
                  )}
                  aria-label="Aramayı kapat"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <p
                id="search-modal-description"
                className="sr-only"
              >
                Ürün, kategori veya set arayabilirsiniz
              </p>
            </div>

            {/* Search Content */}
            <div className="flex flex-col h-full">
              {/* Fixed Search Bar */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100/50">
                <SearchAutocomplete
                  placeholder="Ürün, kategori veya set ara..."
                  className="w-full"
                  autoFocus
                  maxSuggestions={6}
                  onSearch={handleSearch}
                  onNavigate={handleNavigate}
                  isOpen={true}
                  showRealTimeResults={true}
                  onRealTimeResults={handleRealTimeResults}
                  onQueryChange={handleQueryChange}
                />
              </div>

              {/* Real-time Results Grid */}
              <div className="flex-1 overflow-y-auto pb-safe" style={{ paddingBottom: keyboardOffset }}>
                <AnimatePresence initial={false} mode="popLayout">
                  {isLoadingResults && searchQuery.length >= 2 && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 text-center text-gray-500"
                    >
                      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" />
                      <span className="sr-only">Arama yapılıyor</span>
                    </motion.div>
                  )}

                  {!isLoadingResults && realTimeResults.length > 0 && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.25 }}
                      className="p-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {realTimeResults.slice(0, 4).map((result, index) => (
                          <motion.div
                            key={`${result.type}-${result.id}-${index}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.04 }}
                            className="bg-white rounded-lg border border-gray-200 p-3 hover:border-rose-300 transition-colors"
                          >
                            {result.image && (
                              <div className="aspect-square mb-2 overflow-hidden rounded-md bg-gray-100">
                                <Image
                                  src={result.image}
                                  alt={result.name}
                                  width={100}
                                  height={100}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                              {result.name}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {result.type === 'product' ? 'Ürün' : result.type === 'category' ? 'Kategori' : 'Set'}
                              </span>
                              {result.price && (
                                <span className="text-sm font-bold text-rose-600">
                                  {formatPrice(result.price)}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {realTimeResults.length > 4 && (
                        <div className="text-center mt-4">
                          <button
                            onClick={() => handleSearch(searchQuery)}
                            className="text-sm text-rose-600 hover:text-rose-800 font-medium"
                          >
                            +{realTimeResults.length - 4} sonuç daha göster
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {!isLoadingResults && searchQuery.length >= 2 && realTimeResults.length === 0 && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.2 }}
                      className="p-8 text-center text-gray-500"
                    >
                      <div className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm">
                        &ldquo;<span className="font-medium">{searchQuery}</span>&rdquo; için sonuç bulunamadı
                      </p>
                      <p className="mt-1 text-xs">Farklı anahtar kelimeler deneyebilirsiniz</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
