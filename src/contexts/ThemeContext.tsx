'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'meri-design-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')
  const { light, medium } = useHapticFeedback()

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Update actual theme based on current theme setting
  const updateActualTheme = (newTheme: Theme) => {
    const systemTheme = getSystemTheme()
    const newActualTheme = newTheme === 'system' ? systemTheme : newTheme
    setActualTheme(newActualTheme)
    
    // Update document class and meta theme-color
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(newActualTheme)
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newActualTheme === 'dark' ? '#121212' : '#ffffff')
      }
    }
  }

  // Set theme with haptic feedback
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    updateActualTheme(newTheme)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme)
    }
    
    // Haptic feedback
    medium('Tema değiştirildi')
  }

  // Toggle between light and dark
  const toggleTheme = () => {
    const newTheme = actualTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    light('Tema değiştirildi')
  }

  // Initialize theme on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get saved theme or use default
    const savedTheme = localStorage.getItem(storageKey) as Theme || defaultTheme
    setThemeState(savedTheme)
    updateActualTheme(savedTheme)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        updateActualTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [defaultTheme, storageKey, theme])

  // Update actual theme when theme changes
  useEffect(() => {
    updateActualTheme(theme)
  }, [theme])

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
