/**
 * MeriDesignHouse Bottom Sheet Component
 * Mobile-first bottom sheet with snap points
 */

'use client'

import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  snapPoints?: number[] // Height percentages [0.5, 0.8, 1.0]
  defaultSnapPoint?: number
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
}

const sheetVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  content: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  snapPoints = [0.5, 0.8, 1.0],
  defaultSnapPoint = 0.8,
  showCloseButton = true,
  closeOnOverlayClick = true,
}: BottomSheetProps) {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(defaultSnapPoint)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle drag to close
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100
    const velocity = info.velocity.y
    const offset = info.offset.y

    if (velocity > 500 || offset > threshold) {
      onClose()
    }
  }

  // Handle snap points
  const handleDrag = (event: any, info: PanInfo) => {
    const sheetHeight = sheetRef.current?.offsetHeight || 0
    const windowHeight = window.innerHeight
    const currentY = info.offset.y
    const currentPercentage = (sheetHeight - currentY) / windowHeight

    // Find closest snap point
    const closestSnapPoint = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - currentPercentage) < Math.abs(prev - currentPercentage) ? curr : prev
    )

    setCurrentSnapPoint(closestSnapPoint)
  }

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end"
          variants={sheetVariants.backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          onClick={closeOnOverlayClick ? onClose : undefined}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Bottom Sheet Content */}
          <motion.div
            ref={sheetRef}
            className={cn(
              'relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh]',
              className
            )}
            style={{ height: `${currentSnapPoint * 100}vh` }}
            variants={sheetVariants.content}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'sheet-title' : undefined}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                {title && (
                  <h2 id="sheet-title" className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="ml-auto"
                    aria-label="Bottom sheet'i kapat"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
