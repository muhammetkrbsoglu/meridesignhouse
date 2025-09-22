'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FullscreenImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title?: string
}

export function FullscreenImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title 
}: FullscreenImageModalProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
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

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          event.preventDefault()
          handleZoomIn()
          break
        case '-':
          event.preventDefault()
          handleZoomOut()
          break
        case 'r':
        case 'R':
          event.preventDefault()
          handleRotate()
          break
        case '0':
          event.preventDefault()
          handleReset()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1))
  }

  const handleRotate = () => {
    setRotation(prev => prev + 90)
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.1, Math.min(5, prev * delta)))
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      event.preventDefault()
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition(prev => ({
        x: prev.x + event.movementX,
        y: prev.y + event.movementY
      }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        {/* Header with controls */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white">
            {title && (
              <h2 className="text-lg font-medium">{title}</h2>
            )}
            <p className="text-sm text-white/70">
              ESC: Kapat | +/-: Yakınlaştır | R: Döndür | 0: Sıfırla
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleZoomOut()
              }}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleZoomIn()
              }}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleRotate()
              }}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleReset()
              }}
              className="text-white hover:bg-white/20"
            >
              <span className="text-sm font-medium">1:1</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div 
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={imageUrl}
              alt={title || 'Tam ekran görsel'}
              className="max-w-none select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
              draggable={false}
            />
          </motion.div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center justify-center gap-4 text-white/70 text-sm">
            <span>Yakınlaştırma: {Math.round(scale * 100)}%</span>
            <span>Döndürme: {rotation % 360}°</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
