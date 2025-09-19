'use client'

import { useCallback, useMemo, useRef, useState, type TouchEvent } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

export type ProductMediaItem = {
  id?: string | number
  url: string
  alt?: string | null
  sortOrder?: number | null
}

interface ProductMediaCarouselProps {
  items?: ProductMediaItem[] | null
  initialIndex?: number
  className?: string
  onIndexChange?: (index: number) => void
  showThumbnails?: boolean
}

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 64 : -64,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -56 : 56,
    opacity: 0,
    scale: 0.98,
  }),
}

const TRANSITION = {
  duration: 0.48,
  ease: [0.22, 0.61, 0.36, 1] as const,
}

export function ProductMediaCarousel({
  items = [],
  initialIndex = 0,
  className,
  onIndexChange,
  showThumbnails = true,
}: ProductMediaCarouselProps) {
  const mediaItems = useMemo(() => {
    return (items || [])
      .filter((item): item is ProductMediaItem => Boolean(item?.url))
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [items])

  const count = mediaItems.length
  const safeInitial = count === 0 ? 0 : Math.min(Math.max(initialIndex, 0), count - 1)

  const [activeIndex, setActiveIndex] = useState(safeInitial)
  const [direction, setDirection] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const SWIPE_THRESHOLD = 40

  const changeIndex = useCallback(
    (nextIndex: number, swipeDirection: number) => {
      if (count === 0) return
      const wrapped = (nextIndex + count) % count
      setActiveIndex(wrapped)
      setDirection(swipeDirection)
      onIndexChange?.(wrapped)
    },
    [count, onIndexChange]
  )

  const goNext = useCallback(() => changeIndex(activeIndex + 1, 1), [activeIndex, changeIndex])
  const goPrev = useCallback(() => changeIndex(activeIndex - 1, -1), [activeIndex, changeIndex])

  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (index === activeIndex) return
      const swipeDirection = index > activeIndex ? 1 : -1
      changeIndex(index, swipeDirection)
    },
    [activeIndex, changeIndex]
  )

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || touchStartY.current === null || count < 2) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) {
        goNext()
      } else {
        goPrev()
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  const activeItem = mediaItems[activeIndex]
  const hasMultiple = count > 1

  const activeKey = activeItem ? `${activeItem.id ?? activeIndex}-${activeIndex}` : 'empty'

  return (
    <div className={cn('space-y-3 lg:space-y-4', className)}>
      <div
        className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 shadow-sm"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeKey}
            className="absolute inset-0"
            variants={SLIDE_VARIANTS}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            transition={TRANSITION}
          >
            {activeItem ? (
              <Image
                src={activeItem.url}
                alt={activeItem.alt || 'Ürün görseli'}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                Görsel bulunamadı
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {hasMultiple && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/10 to-transparent" />
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className={cn(
                'pointer-events-auto absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
                isHovering ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
              )}
              aria-label="Önceki görsel"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className={cn(
                'pointer-events-auto absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
                isHovering ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              )}
              aria-label="Sonraki görsel"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}

        {hasMultiple && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {mediaItems.map((_, index) => (
              <span
                key={index}
                className={cn(
                  'h-1.5 w-6 rounded-full bg-white/50 transition-all duration-300',
                  activeIndex === index ? 'bg-white/90' : 'opacity-60'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {showThumbnails && hasMultiple && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-4">
          {mediaItems.map((image, index) => (
            <button
              key={image.id ?? index}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400',
                activeIndex === index
                  ? 'border-rose-500 shadow-[0_12px_30px_-18px_rgba(225,29,72,0.6)]'
                  : 'border-transparent hover:border-rose-200'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || 'Ürün küçük görseli'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="96px"
              />
              <span
                className={cn(
                  'absolute inset-0 rounded-2xl bg-gradient-to-t from-black/15 via-black/0 to-black/0 opacity-0 transition-opacity duration-300',
                  activeIndex === index ? 'opacity-100' : 'group-hover:opacity-100'
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
