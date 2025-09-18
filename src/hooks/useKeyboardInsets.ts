"use client"

import { useEffect, useState } from 'react'

type KeyboardInsets = {
  bottom: number
}

export function useKeyboardInsets(): KeyboardInsets {
  const [insets, setInsets] = useState<KeyboardInsets>({ bottom: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const viewport = window.visualViewport
    if (!viewport) return

    const updateInsets = () => {
      const offset = window.innerHeight - viewport.height - viewport.offsetTop
      setInsets({ bottom: Math.max(0, offset) })
    }

    updateInsets()
    viewport.addEventListener('resize', updateInsets)
    viewport.addEventListener('scroll', updateInsets)

    return () => {
      viewport.removeEventListener('resize', updateInsets)
      viewport.removeEventListener('scroll', updateInsets)
    }
  }, [])

  return insets
}
