'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

type GestureType = 
  | 'swipe-back'
  | 'swipe-card'
  | 'pull-refresh'
  | 'search-sheet'
  | 'filter-sheet'
  | 'bundle-wizard'
  | 'product-gallery'
  | 'cart-swipe'

interface GestureHint {
  id: GestureType
  title: string
  description: string
  icon: string
  position: 'top' | 'bottom' | 'center' | 'left' | 'right'
  duration: number
  showOnce: boolean
  priority: number
}

interface GestureHintContextType {
  shownHints: Set<GestureType>
  showHint: (gestureType: GestureType) => void
  hideHint: (gestureType: GestureType) => void
  isHintShown: (gestureType: GestureType) => boolean
  markHintAsShown: (gestureType: GestureType) => void
  resetHints: () => void
  getHintConfig: (gestureType: GestureType) => GestureHint | null
}

const gestureHints: Record<GestureType, GestureHint> = {
  'swipe-back': {
    id: 'swipe-back',
    title: 'Geri Dön',
    description: 'Sol kenardan sağa kaydırarak geri dönebilirsiniz',
    icon: '←',
    position: 'left',
    duration: 3000,
    showOnce: true,
    priority: 1
  },
  'swipe-card': {
    id: 'swipe-card',
    title: 'Kart Kaydır',
    description: 'Kartları yatay kaydırarak daha fazla seçenek görebilirsiniz',
    icon: '↔',
    position: 'center',
    duration: 4000,
    showOnce: true,
    priority: 2
  },
  'pull-refresh': {
    id: 'pull-refresh',
    title: 'Yenile',
    description: 'Aşağı çekerek sayfayı yenileyebilirsiniz',
    icon: '↓',
    position: 'top',
    duration: 3000,
    showOnce: true,
    priority: 1
  },
  'search-sheet': {
    id: 'search-sheet',
    title: 'Arama',
    description: 'Arama simgesine dokunarak detaylı arama yapabilirsiniz',
    icon: '🔍',
    position: 'top',
    duration: 2500,
    showOnce: true,
    priority: 1
  },
  'filter-sheet': {
    id: 'filter-sheet',
    title: 'Filtrele',
    description: 'Filtre simgesine dokunarak ürünleri filtreleyebilirsiniz',
    icon: '⚙️',
    position: 'top',
    duration: 2500,
    showOnce: true,
    priority: 2
  },
  'bundle-wizard': {
    id: 'bundle-wizard',
    title: 'Bundle Oluştur',
    description: 'Adım adım bundle oluşturmak için kaydırabilirsiniz',
    icon: '✨',
    position: 'center',
    duration: 4000,
    showOnce: true,
    priority: 3
  },
  'product-gallery': {
    id: 'product-gallery',
    title: 'Galeri',
    description: 'Ürün görsellerini kaydırarak inceleyebilirsiniz',
    icon: '🖼️',
    position: 'center',
    duration: 3000,
    showOnce: true,
    priority: 2
  },
  'cart-swipe': {
    id: 'cart-swipe',
    title: 'Sepet İşlemleri',
    description: 'Sepet öğelerini kaydırarak düzenleyebilirsiniz',
    icon: '🛒',
    position: 'center',
    duration: 3500,
    showOnce: true,
    priority: 2
  }
}

const GestureHintContext = createContext<GestureHintContextType | undefined>(undefined)

interface GestureHintProviderProps {
  children: ReactNode
  storageKey?: string
}

export function GestureHintProvider({
  children,
  storageKey = 'meri-design-gesture-hints'
}: GestureHintProviderProps) {
  const [shownHints, setShownHints] = useState<Set<GestureType>>(new Set())
  const { light } = useHapticFeedback()

  // Load shown hints from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as GestureType[]
        setShownHints(new Set(parsed))
      }
    } catch (error) {
      console.warn('Failed to load gesture hints from localStorage:', error)
    }
  }, [storageKey])

  // Save shown hints to localStorage
  const saveShownHints = (hints: Set<GestureType>) => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(hints)))
    } catch (error) {
      console.warn('Failed to save gesture hints to localStorage:', error)
    }
  }

  const showHint = (gestureType: GestureType) => {
    const hint = gestureHints[gestureType]
    if (!hint) return

    // Check if hint should be shown
    if (hint.showOnce && shownHints.has(gestureType)) {
      return
    }

    // Add to shown hints if it's a one-time hint
    if (hint.showOnce) {
      const newShownHints = new Set(shownHints)
      newShownHints.add(gestureType)
      setShownHints(newShownHints)
      saveShownHints(newShownHints)
    }

    // Haptic feedback
    light('Gesture hint gösterildi')
  }

  const hideHint = (gestureType: GestureType) => {
    // Haptic feedback
    light('Gesture hint gizlendi')
  }

  const isHintShown = (gestureType: GestureType) => {
    return shownHints.has(gestureType)
  }

  const markHintAsShown = (gestureType: GestureType) => {
    const newShownHints = new Set(shownHints)
    newShownHints.add(gestureType)
    setShownHints(newShownHints)
    saveShownHints(newShownHints)
  }

  const resetHints = () => {
    setShownHints(new Set())
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
    light('Gesture hint\'ler sıfırlandı')
  }

  const getHintConfig = (gestureType: GestureType): GestureHint | null => {
    return gestureHints[gestureType] || null
  }

  const value: GestureHintContextType = {
    shownHints,
    showHint,
    hideHint,
    isHintShown,
    markHintAsShown,
    resetHints,
    getHintConfig
  }

  return (
    <GestureHintContext.Provider value={value}>
      {children}
    </GestureHintContext.Provider>
  )
}

export function useGestureHint() {
  const context = useContext(GestureHintContext)
  if (context === undefined) {
    throw new Error('useGestureHint must be used within a GestureHintProvider')
  }
  return context
}
