'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface GestureHintContextType {
  showHint: (type: string, message: string) => void
  hideHint: () => void
  currentHint: { type: string; message: string } | null
}

const GestureHintContext = createContext<GestureHintContextType | undefined>(undefined)

export function useGestureHint() {
  const context = useContext(GestureHintContext)
  if (!context) {
    throw new Error('useGestureHint must be used within a GestureHintProvider')
  }
  return context
}

interface GestureHintProviderProps {
  children: ReactNode
}

export function GestureHintProvider({ children }: GestureHintProviderProps) {
  const [currentHint, setCurrentHint] = useState<{ type: string; message: string } | null>(null)

  const showHint = (type: string, message: string) => {
    setCurrentHint({ type, message })
    // Auto hide after 3 seconds
    setTimeout(() => setCurrentHint(null), 3000)
  }

  const hideHint = () => {
    setCurrentHint(null)
  }

  const value = {
    showHint,
    hideHint,
    currentHint
  }

  return (
    <GestureHintContext.Provider value={value}>
      {children}
    </GestureHintContext.Provider>
  )
}