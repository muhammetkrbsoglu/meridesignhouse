"use client"

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface KeyboardSpacerProps {
  className?: string
  enabled?: boolean
  offset?: number
}

export function KeyboardSpacer({ 
  className, 
  enabled = true, 
  offset = 0 
}: KeyboardSpacerProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Only apply on mobile devices
    const isMobile = window.innerWidth < 768
    if (!isMobile) return

    const handleResize = () => {
      const initialHeight = window.innerHeight
      const currentHeight = window.innerHeight
      const heightDifference = initialHeight - currentHeight

      // Consider keyboard visible if height decreased by more than 150px
      if (heightDifference > 150) {
        setKeyboardHeight(heightDifference)
        setIsKeyboardVisible(true)
      } else {
        setKeyboardHeight(0)
        setIsKeyboardVisible(false)
      }
    }

    // Initial check
    handleResize()

    // Listen for resize events
    window.addEventListener('resize', handleResize)
    
    // Listen for focus events on input elements
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
        // Small delay to allow keyboard to appear
        setTimeout(handleResize, 300)
      }
    }

    const handleFocusOut = () => {
      // Small delay to allow keyboard to disappear
      setTimeout(handleResize, 300)
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [enabled])

  if (!enabled || !isKeyboardVisible || keyboardHeight === 0) {
    return null
  }

  return (
    <div 
      className={cn('transition-all duration-300 ease-out', className)}
      style={{ 
        height: `${keyboardHeight - offset}px`,
        minHeight: '0px'
      }}
    />
  )
}

// Hook for keyboard visibility
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isMobile = window.innerWidth < 768
    if (!isMobile) return

    const initialHeight = window.innerHeight

    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDifference = initialHeight - currentHeight

      if (heightDifference > 150) {
        setKeyboardHeight(heightDifference)
        setIsKeyboardVisible(true)
      } else {
        setKeyboardHeight(0)
        setIsKeyboardVisible(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return { keyboardHeight, isKeyboardVisible }
}

// Form wrapper with keyboard spacer
interface FormWithKeyboardSpacerProps {
  children: React.ReactNode
  className?: string
  enabled?: boolean
}

export function FormWithKeyboardSpacer({ 
  children, 
  className, 
  enabled = true 
}: FormWithKeyboardSpacerProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <KeyboardSpacer enabled={enabled} />
    </div>
  )
}
