/**
 * MeriDesignHouse Infinite Scroll Hook
 * Viewport-aware infinite scroll with smooth loading and accessibility
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useReducedMotion } from 'framer-motion'

interface UseInfiniteScrollOptions {
  threshold?: number
  rootMargin?: string
  batchSize?: number
  enabled?: boolean
  onLoadMore?: () => Promise<void> | void
  hasMore?: boolean
  loading?: boolean
}

interface UseInfiniteScrollReturn {
  containerRef: React.RefObject<HTMLDivElement>
  triggerRef: React.RefObject<HTMLDivElement>
  isLoading: boolean
  hasMore: boolean
  error: string | null
  retry: () => void
  loadMore: () => void
}

export function useInfiniteScroll({
  threshold = 0.1,
  rootMargin = '100px',
  batchSize = 12,
  enabled = true,
  onLoadMore,
  hasMore = true,
  loading = false
}: UseInfiniteScrollOptions = {}): UseInfiniteScrollReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentBatch, setCurrentBatch] = useState(0)
  const [visibleItems, setVisibleItems] = useState(batchSize)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !onLoadMore) return

    setIsLoading(true)
    setError(null)

    try {
      await onLoadMore()
      setCurrentBatch(prev => prev + 1)
      setVisibleItems(prev => prev + batchSize)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme hatası')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, onLoadMore, batchSize])

  const retry = useCallback(() => {
    setError(null)
    loadMore()
  }, [loadMore])

  // Setup intersection observer
  useEffect(() => {
    if (!enabled || !triggerRef.current || shouldReduceMotion) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      {
        threshold,
        rootMargin,
        root: containerRef.current
      }
    )

    observer.observe(triggerRef.current)
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [enabled, hasMore, isLoading, threshold, rootMargin, loadMore, shouldReduceMotion])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    containerRef,
    triggerRef,
    isLoading: isLoading || loading,
    hasMore,
    error,
    retry,
    loadMore
  }
}

// Specialized hook for product grids
export function useProductInfiniteScroll(
  products: any[],
  onLoadMore?: () => Promise<void> | void,
  options: Partial<UseInfiniteScrollOptions> = {}
) {
  const batchSize = options.batchSize || 12
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  // Update displayed products when products change
  useEffect(() => {
    const endIndex = currentPage * batchSize
    setDisplayedProducts(products.slice(0, endIndex))
  }, [products, currentPage, batchSize])

  const handleLoadMore = useCallback(async () => {
    if (onLoadMore) {
      await onLoadMore()
    } else {
      // Simulate loading more products from the same array
      setCurrentPage(prev => prev + 1)
    }
  }, [onLoadMore])

  const infiniteScroll = useInfiniteScroll({
    ...options,
    onLoadMore: handleLoadMore,
    hasMore: displayedProducts.length < products.length,
    batchSize
  })

  return {
    ...infiniteScroll,
    displayedProducts,
    totalProducts: products.length,
    hasMore: displayedProducts.length < products.length
  }
}
