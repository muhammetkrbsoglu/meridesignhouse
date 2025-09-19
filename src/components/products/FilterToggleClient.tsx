'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FilterToggleClientProps {
  children: React.ReactNode
  title?: string
  sortComponent?: React.ReactNode
}

export function FilterToggleClient({ children, title = 'Tüm Ürünler', sortComponent }: FilterToggleClientProps) {
  const [isOpen, setIsOpen] = useState(false) // Varsayılan olarak kapalı

  return (
    <>
      {/* Filter Toggle Button */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h1 id="products-heading" className="text-2xl sm:text-3xl font-bold">
            {title}
          </h1>
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white/80 px-3 py-2 text-sm font-medium text-rose-600 shadow-sm backdrop-blur transition-colors duration-200 hover:border-rose-200 hover:bg-rose-50 sm:w-auto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FunnelIcon className="h-5 w-5" />
            <span>
              {isOpen ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
            </span>
          </motion.button>
        </div>
        
        {/* Sort Component */}
        {sortComponent && (
          <div className="flex w-full sm:w-auto sm:justify-end">
            {sortComponent}
          </div>
        )}
      </div>

      {/* Filter Panel - Animated */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-white rounded-xl border p-4 lg:p-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
