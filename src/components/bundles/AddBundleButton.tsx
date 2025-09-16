'use client'

import { useEffect, useState } from 'react'
import { addBundleToCart } from '@/lib/actions/cart'
import { toast } from '@/hooks/use-toast'

export function AddBundleButton({ bundleId, fullWidth = true }: { bundleId: string; fullWidth?: boolean }) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('[AddBundleButton] mounted', { bundleId })
  }, [bundleId])

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      console.log('[AddBundleButton] click', { bundleId })
      const res = await addBundleToCart(bundleId)
      console.log('[AddBundleButton] server response', res)
      if (res?.success) {
        toast({ intent: 'success', description: 'Set sepete eklendi' })
      } else {
        toast({ intent: 'error', description: res?.error || 'Set sepete eklenemedi' })
      }
      // Trigger cart update event for any listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'))
      }
    } catch (_) {
      toast({ intent: 'error', description: 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${fullWidth ? 'w-full' : ''} h-12 inline-flex items-center justify-center rounded-lg bg-rose-600 text-white px-6 text-sm font-bold hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2 transition-colors disabled:opacity-60 relative z-10 pointer-events-auto`}
    >
      {loading ? 'Ekleniyor...' : 'Tümünü sepete ekle'}
    </button>
  )
}


