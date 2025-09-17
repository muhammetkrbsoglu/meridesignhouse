/**
 * MeriDesignHouse Lazy Loading Hook
 * IntersectionObserver-based lazy loading with performance optimization
 */

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseLazyLoadingOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
  enabled?: boolean
  fallbackDelay?: number
}

interface LazyLoadingState {
  isVisible: boolean
  isLoaded: boolean
  isError: boolean
  ref: React.RefObject<HTMLElement>
}

export function useLazyLoading(options: UseLazyLoadingOptions = {}): LazyLoadingState {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    enabled = true,
    fallbackDelay = 1000
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    
    if (entry.isIntersecting) {
      setIsVisible(true)
      
      if (triggerOnce && observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [triggerOnce])

  useEffect(() => {
    if (!enabled || !ref.current || typeof window === 'undefined') {
      return
    }

    // Fallback for browsers without IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
      const timer = setTimeout(() => {
        setIsVisible(true)
        setIsLoaded(true)
      }, fallbackDelay)
      
      return () => clearTimeout(timer)
    }

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    })

    observerRef.current.observe(ref.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [enabled, threshold, rootMargin, handleIntersection, fallbackDelay])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    setIsError(false)
  }, [])

  const handleError = useCallback(() => {
    setIsError(true)
    setIsLoaded(false)
  }, [])

  return {
    isVisible,
    isLoaded,
    isError,
    ref,
    handleLoad,
    handleError
  }
}

// Specialized hook for images
export function useLazyImage(src: string, options: UseLazyLoadingOptions = {}) {
  const { isVisible, isLoaded, isError, ref, handleLoad, handleError } = useLazyLoading(options)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    if (isVisible && !imageSrc) {
      setImageSrc(src)
    }
  }, [isVisible, src, imageSrc])

  return {
    isVisible,
    isLoaded,
    isError,
    ref,
    src: imageSrc,
    onLoad: handleLoad,
    onError: handleError
  }
}

// Hook for lazy loading multiple elements
export function useLazyLoadingList(
  itemCount: number,
  options: UseLazyLoadingOptions = {}
) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
  const [loadedItems, setLoadedItems] = useState<Set<number>>(new Set())
  const [errorItems, setErrorItems] = useState<Set<number>>(new Set())

  const handleItemIntersection = useCallback((index: number) => (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    
    if (entry.isIntersecting) {
      setVisibleItems(prev => new Set([...prev, index]))
      
      if (options.triggerOnce !== false) {
        // Remove observer for this item
        const element = entry.target as HTMLElement
        const observer = (element as any).__observer
        if (observer) {
          observer.disconnect()
          delete (element as any).__observer
        }
      }
    }
  }, [options.triggerOnce])

  const createItemRef = useCallback((index: number) => {
    return (element: HTMLElement | null) => {
      if (!element || !enabled) return

      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        // Fallback for browsers without IntersectionObserver
        setTimeout(() => {
          setVisibleItems(prev => new Set([...prev, index]))
        }, options.fallbackDelay || 1000)
        return
      }

      const observer = new IntersectionObserver(handleItemIntersection(index), {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '50px'
      })

      observer.observe(element)
      ;(element as any).__observer = observer
    }
  }, [enabled, options, handleItemIntersection])

  const handleItemLoad = useCallback((index: number) => {
    setLoadedItems(prev => new Set([...prev, index]))
    setErrorItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }, [])

  const handleItemError = useCallback((index: number) => {
    setErrorItems(prev => new Set([...prev, index]))
    setLoadedItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }, [])

  return {
    visibleItems,
    loadedItems,
    errorItems,
    createItemRef,
    handleItemLoad,
    handleItemError,
    isItemVisible: (index: number) => visibleItems.has(index),
    isItemLoaded: (index: number) => loadedItems.has(index),
    isItemError: (index: number) => errorItems.has(index)
  }
}
