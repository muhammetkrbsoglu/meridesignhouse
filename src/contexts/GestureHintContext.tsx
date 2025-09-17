'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

type GestureType =
  | 'swipe-back'
  | 'swipe-card'
  | 'pull-refresh'
  | 'search-sheet'
  | 'filter-sheet'
  | 'bundle-wizard'
  | 'product-gallery'
  | 'cart-swipe'

interface GestureHintConfig {
  id: GestureType
  enabled: boolean
  duration: number
  position: 'top' | 'bottom' | 'center' | 'left' | 'right'
  mobileOnly?: boolean
}

interface GestureHintContextValue {
  getHintConfig: (type: GestureType) => GestureHintConfig | undefined
  isHintShown: (type: GestureType) => boolean
  showHint: (type: GestureType) => void
  hideHint: (type: GestureType) => void
  markHintAsShown: (type: GestureType) => void
  resetHints: () => void
  showHints: () => void
  visibleHints: Set<GestureType>
}

const GestureHintContext = createContext<GestureHintContextValue | undefined>(undefined)

const STORAGE_KEY = 'mdh_gesture_hints_v1'

function loadShownHints(): Record<GestureType, boolean> {
  if (typeof window === 'undefined') return {} as any
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<GestureType, boolean>) : ({} as any)
  } catch {
    return {} as any
  }
}

function saveShownHints(map: Record<GestureType, boolean>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

const defaultConfigs: Record<GestureType, GestureHintConfig> = {
  'swipe-back': { id: 'swipe-back', enabled: true, duration: 2200, position: 'left', mobileOnly: true },
  'swipe-card': { id: 'swipe-card', enabled: true, duration: 2200, position: 'right', mobileOnly: true },
  'pull-refresh': { id: 'pull-refresh', enabled: true, duration: 1800, position: 'top', mobileOnly: true },
  'search-sheet': { id: 'search-sheet', enabled: true, duration: 2000, position: 'bottom', mobileOnly: true },
  'filter-sheet': { id: 'filter-sheet', enabled: true, duration: 2000, position: 'bottom', mobileOnly: true },
  'bundle-wizard': { id: 'bundle-wizard', enabled: true, duration: 2200, position: 'center', mobileOnly: true },
  'product-gallery': { id: 'product-gallery', enabled: true, duration: 2000, position: 'bottom', mobileOnly: true },
  'cart-swipe': { id: 'cart-swipe', enabled: true, duration: 2000, position: 'right', mobileOnly: true }
}

export function GestureHintProvider({ children }: { children: React.ReactNode }) {
  const [visibleHints, setVisibleHints] = useState<Set<GestureType>>(new Set())
  const shownRef = useRef<Record<GestureType, boolean>>(loadShownHints())

  // Persist on change
  useEffect(() => {
    saveShownHints(shownRef.current)
  }, [visibleHints])

  const getHintConfig = useCallback((type: GestureType) => defaultConfigs[type], [])

  const isHintShown = useCallback((type: GestureType) => {
    return !!shownRef.current[type]
  }, [])

  const showHint = useCallback((type: GestureType) => {
    // Respect mobile-only setting
    const cfg = defaultConfigs[type]
    if (cfg?.mobileOnly && typeof window !== 'undefined' && window.innerWidth >= 768) return
    setVisibleHints(prev => new Set([...prev, type]))
  }, [])

  const hideHint = useCallback((type: GestureType) => {
    setVisibleHints(prev => {
      const n = new Set(prev)
      n.delete(type)
      return n
    })
  }, [])

  const markHintAsShown = useCallback((type: GestureType) => {
    shownRef.current = { ...shownRef.current, [type]: true }
    saveShownHints(shownRef.current)
  }, [])

  const resetHints = useCallback(() => {
    shownRef.current = {} as any
    saveShownHints(shownRef.current)
  }, [])

  // Immediately show relevant mobile hints (without altering first-use memory)
  const showHints = useCallback(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth >= 768) return
    const enabledMobileHints = (Object.values(defaultConfigs) as GestureHintConfig[])
      .filter(c => c.enabled && c.mobileOnly)
      .map(c => c.id)
    setVisibleHints(prev => new Set([...prev, ...enabledMobileHints]))
  }, [])

  const value = useMemo<GestureHintContextValue>(() => ({
    getHintConfig,
    isHintShown,
    showHint,
    hideHint,
    markHintAsShown,
    resetHints,
    showHints,
    visibleHints
  }), [getHintConfig, isHintShown, showHint, hideHint, markHintAsShown, resetHints, visibleHints])

  return (
    <GestureHintContext.Provider value={value}>
      {children}
    </GestureHintContext.Provider>
  )
}

export function useGestureHint() {
  const ctx = useContext(GestureHintContext)
  if (!ctx) throw new Error('useGestureHint must be used within GestureHintProvider')
  return ctx
}


