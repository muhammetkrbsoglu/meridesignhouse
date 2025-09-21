'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { VariantSelector } from '@/components/products/VariantSelector'
import type { ProductVariant, ProductOption } from '@/types/product'
import {
  buildSelectionMap,
  findMatchingVariant,
  getValueAvailability,
  getVariantLabel,
  toNumeric,
  type VariantSelectionMap,
} from '@/lib/products/variant-utils'
import { Button } from '@/components/ui/button'
import { MicroFeedback } from '@/components/motion/MicroFeedback'
import { LoadingSpinner } from '@/components/motion/LoadingStates'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface VariantQuickAddSheetProps {
  open: boolean
  onClose: () => void
  productSummary: {
    id: string
    name: string
    price: unknown
    image?: string | null
  } | null
  onConfirm: (input: { productId: string; variantId: string | null; quantity: number }) => Promise<void> | void
}

interface VariantResponse {
  id: string
  name: string
  price: unknown
  stock?: unknown
  hasVariants?: boolean | null
  defaultVariantId?: string | null
  options?: ProductOption[]
  variants?: ProductVariant[]
  images?: Array<{ id?: string; url: string; alt?: string | null }>
}

const sheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
}

export function VariantQuickAddSheet({ open, onClose, productSummary, onConfirm }: VariantQuickAddSheetProps) {
  const [productDetail, setProductDetail] = useState<VariantResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedValues, setSelectedValues] = useState<VariantSelectionMap>({})
  const [confirming, setConfirming] = useState(false)

  const hasVariants = Boolean(productDetail?.hasVariants && (productDetail?.variants?.length ?? 0) > 0)

  useEffect(() => {
    if (!open || !productSummary?.id) {
      setProductDetail(null)
      setSelectedVariantId(null)
      setSelectedValues({})
      setQuantity(1)
      setError(null)
      setLoading(false)
      return
    }

    let aborted = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/products/${productSummary.id}/variants`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Ürün bilgileri alınamadı')
        }
        const data = (await response.json()) as VariantResponse
        if (aborted) return
        setProductDetail(data)
        if (data.hasVariants && data.variants && data.variants.length > 0) {
          const defaultId = data.defaultVariantId ?? data.variants[0].id
          setSelectedVariantId(defaultId)
          const targetVariant = data.variants.find((variant) => variant.id === defaultId) ?? data.variants[0]
          setSelectedValues(buildSelectionMap(targetVariant))
        } else {
          setSelectedVariantId(null)
          setSelectedValues({})
        }
      } catch (fetchError) {
        console.error('Varyant bilgisi alınamadı:', fetchError)
        if (!aborted) {
          setError('Ürün bilgileri yüklenemedi. Lütfen tekrar deneyin.')
        }
      } finally {
        if (!aborted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      aborted = true
    }
  }, [open, productSummary?.id])

  const options = useMemo<ProductOption[]>(() => (productDetail?.options ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [productDetail?.options])
  const variants = useMemo<ProductVariant[]>(() => (productDetail?.variants ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [productDetail?.variants])

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!hasVariants) return null
    const variant = variants.find((item) => item.id === selectedVariantId)
    return variant ?? variants[0] ?? null
  }, [hasVariants, selectedVariantId, variants])

  const selectedVariantLabel = useMemo(() => getVariantLabel(selectedVariant), [selectedVariant])
  const selectedVariantStock = toNumeric(selectedVariant?.stock ?? productDetail?.stock ?? 0)
  const nonVariantStock = toNumeric(productDetail?.stock ?? 0)
  const confirmDisabled = confirming || loading || Boolean(error) || (hasVariants ? selectedVariantStock <= 0 : productDetail ? nonVariantStock <= 0 : false)

  const handleSelectVariant = useCallback(
    (optionId: string, valueId: string) => {
      if (!hasVariants) return
      setSelectedValues((prev) => {
        const nextSelections: VariantSelectionMap = { ...prev, [optionId]: valueId }
        const nextVariant = findMatchingVariant(variants, nextSelections, optionId, valueId)
        if (nextVariant) {
          setSelectedVariantId(nextVariant.id)
          return buildSelectionMap(nextVariant)
        }
        return nextSelections
      })
    },
    [hasVariants, variants],
  )

  const isValueAvailable = useCallback(
    (optionId: string, valueId: string) => {
      if (!hasVariants) return true
      return getValueAvailability(variants, selectedValues, optionId, valueId)
    },
    [hasVariants, selectedValues, variants],
  )

  const handleConfirm = useCallback(async () => {
    if (!productSummary?.id) {
      return
    }

    if (hasVariants && (!selectedVariant || selectedVariantStock <= 0)) {
      return
    }

    if (!hasVariants && nonVariantStock <= 0) {
      return
    }

    setConfirming(true)
    try {
      await onConfirm({
        productId: productSummary.id,
        variantId: hasVariants ? selectedVariant?.id ?? null : null,
        quantity,
      })
      onClose()
    } finally {
      setConfirming(false)
    }
  }, [hasVariants, nonVariantStock, onClose, onConfirm, productSummary?.id, quantity, selectedVariant, selectedVariantStock])

  const displayPrice = useMemo(() => formatCurrency(toNumeric(productDetail?.price ?? productSummary?.price ?? 0)), [productDetail?.price, productSummary?.price])
  const displayImage = productSummary?.image || productDetail?.images?.[0]?.url || '/placeholder-product.svg'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[1200] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-[1201] rounded-t-3xl border-t border-white/10 bg-white/95 shadow-2xl backdrop-blur"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.9 }}
          >
            <div className="mx-auto w-full max-w-xl px-4 pb-6 pt-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                    <Image src={displayImage} alt={productSummary?.name || 'Ürün görseli'} fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900">{productSummary?.name}</h3>
                    <p className="text-sm font-medium text-rose-600">{displayPrice}</p>
                    {hasVariants && selectedVariantLabel && (
                      <p className="text-xs text-gray-500">{selectedVariantLabel}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-gray-700"
                  aria-label="Kapat"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
              ) : (
                <div className="space-y-4">
                  {hasVariants && (
                    <VariantSelector
                      options={options}
                      selectedValues={selectedValues}
                      onSelect={handleSelectVariant}
                      isValueAvailable={isValueAvailable}
                    />
                  )}

                  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Adet</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300"
                        aria-label="Adet azalt"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => prev + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300"
                        aria-label="Adet arttır"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{hasVariants ? 'Seçili varyant stoğu' : 'Stok durumu'}:</span>
                    <span className={cn(selectedVariantStock > 0 ? 'text-emerald-600' : 'text-red-500')}>
                      {selectedVariantStock > 0 ? `${selectedVariantStock} adet` : 'Stokta yok'}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <MicroFeedback hapticType="success" hapticMessage="Ürün sepete eklendi" disabled={confirmDisabled} onClick={handleConfirm}>
                  <Button
                    type="button"
                    className="h-12 w-full rounded-xl bg-rose-600 text-base font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    disabled={confirmDisabled}
                  >
                    {confirming ? <LoadingSpinner size="sm" color="white" className="mr-2" /> : null}
                    {confirming ? 'Ekleniyor...' : 'Sepete ekle'}
                  </Button>
                </MicroFeedback>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
