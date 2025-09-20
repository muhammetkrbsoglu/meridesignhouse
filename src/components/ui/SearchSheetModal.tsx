"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion, PanInfo } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { SearchAutocomplete } from './SearchAutocomplete'

interface SearchSheetModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export function SearchSheetModal({ isOpen, onClose, initialQuery }: SearchSheetModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery || '')
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

  // Handle search completion
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    onClose()
  }, [onClose])

  // Handle navigation
  const handleNavigate = useCallback(() => {
    onClose()
  }, [onClose])

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      const firstFocusableElement = sheetRef.current.querySelector(
        'input, button, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement

      if (firstFocusableElement) {
        firstFocusableElement.focus()
      }
    }
  }, [isOpen])

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
              'max-h-[85vh] rounded-t-3xl',
              'cursor-grab active:cursor-grabbing',
              // Modern glassmorphism effect
              'bg-white/95 backdrop-blur-xl',
              'border-t border-white/20',
              'supports-[backdrop-filter]:bg-white/90',
              'shadow-2xl'
            )}
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
                <h2
                  id="search-modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Arama
                </h2>
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
            <div className="flex-1 overflow-hidden">
              <SearchAutocomplete
                placeholder="Ürün, kategori veya set ara..."
                className="h-full"
                autoFocus
                maxSuggestions={6}
                onSearch={handleSearch}
                onNavigate={handleNavigate}
                isOpen={true}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
