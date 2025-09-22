'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { HeartIcon, ShoppingCartIcon, ShareIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MicroFeedback } from '@/components/motion/MicroFeedback'
import { LoadingSpinner } from '@/components/motion/LoadingStates'
import { Modal } from '@/components/motion/Modal'
import { ProductMediaCarousel, type ProductMediaItem } from '@/components/products/ProductMediaCarousel'
import { VariantSelector } from '@/components/products/VariantSelector'
import { PERSONALIZATION_CATALOG_TEMPLATES } from '@/config/personalizationCatalog'
import { usePersonalization } from '@/hooks/usePersonalization'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProductWithVariants, ProductOption, ProductVariant } from '@/types/product'
import type { PersonalizationCatalogTemplate, PersonalizationField } from '@/types/personalization'
import { addToCart, addToFavorites, removeFromFavorites, isProductInFavorites } from '@/lib/api/cartClient'
import { cn, formatCurrency } from '@/lib/utils'
import {
  buildSelectionMap,
  findMatchingVariant,
  getValueAvailability,
  getVariantLabel,
  toNumeric,
  type VariantSelectionMap,
} from '@/lib/products/variant-utils'
import { toast } from 'sonner'
import { FullscreenImageModal } from '@/components/ui/FullscreenImageModal'

interface ProductDetailProps {
  product: ProductWithVariants
}

const getVariantImages = (
  selectedVariant: ProductVariant | null,
  sharedImages: ProductMediaItem[],
): ProductMediaItem[] => {
  const variantImages = (selectedVariant?.images || []).map((image, index) => ({
    id: image.id || `${selectedVariant?.id}-img-${index}`,
    url: image.url,
    alt: image.alt ?? selectedVariant?.title ?? 'Varyant görseli',
    sortOrder: image.sortOrder ?? index,
  }))

  if (variantImages.length > 0) {
    return [...variantImages, ...sharedImages]
  }

  return sharedImages
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(product.defaultVariantId ?? null)
  const hasVariants = Boolean(product.hasVariants && (product.variants?.length ?? 0) > 0)

  const options = useMemo<ProductOption[]>(() => (product.options ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [product.options])
  const variants = useMemo<ProductVariant[]>(() => (product.variants ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [product.variants])

  const initialVariant = useMemo(() => {
    if (!hasVariants) return null
    const byDefault = variants.find((variant) => variant.id === selectedVariantId)
    return byDefault ?? variants[0] ?? null
  }, [hasVariants, variants, selectedVariantId])

  const [selectedValues, setSelectedValues] = useState<VariantSelectionMap>(() => buildSelectionMap(initialVariant ?? undefined))

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!hasVariants) return null
    const variant = variants.find((item) => item.id === selectedVariantId)
    if (variant) return variant
    return variants[0] ?? null
  }, [hasVariants, variants, selectedVariantId])

  const sharedImages = useMemo<ProductMediaItem[]>(() => {
    return (product.product_images ?? [])
      .filter((image) => !image.variantId)
      .map((image, index) => ({
        id: image.id || `${product.id}-shared-${index}`,
        url: image.url,
        alt: image.alt ?? product.name,
        sortOrder: image.sortOrder ?? index,
      }))
  }, [product.product_images, product.id, product.name])

  const mediaItems = useMemo<ProductMediaItem[]>(() => getVariantImages(selectedVariant, sharedImages), [selectedVariant, sharedImages])

  const activeVariantLabel = useMemo(() => getVariantLabel(selectedVariant), [selectedVariant])
  const activeVariantBadgeColor = selectedVariant?.badgeHex
  const activeVariantStock = toNumeric(selectedVariant?.stock ?? product.stock ?? 0)

  const personalizationConfig = product.personalizationConfig ?? null
  const personalizationEnabled = Boolean(
    product.isPersonalizable && personalizationConfig && (personalizationConfig.fields?.length ?? 0) > 0,
  )

  const {
    fields: personalizationFields,
    values: personalizationValues,
    touched: personalizationTouched,
    setFieldValue: setPersonalizationFieldValue,
    markTouched: markPersonalizationFieldTouched,
    touchAll: touchAllPersonalizationFields,
    errors: personalizationErrors,
    isComplete: isPersonalizationComplete,
    buildPayload: buildPersonalizationPayload,
  } = usePersonalization(personalizationConfig)

  const [currentStep, setCurrentStep] = useState<'overview' | 'personalization'>(personalizationEnabled ? 'overview' : 'overview')
  const [showPersonalizationErrors, setShowPersonalizationErrors] = useState(false)
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [activeCatalogField, setActiveCatalogField] = useState<string | null>(null)
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; title: string } | null>(null)

  const catalogTemplates: PersonalizationCatalogTemplate[] = personalizationConfig?.settings?.catalogTemplates?.length
    ? personalizationConfig.settings.catalogTemplates
    : PERSONALIZATION_CATALOG_TEMPLATES

  useEffect(() => {
    if (!personalizationEnabled) {
      setCurrentStep('overview')
      setShowPersonalizationErrors(false)
    }
  }, [personalizationEnabled])

  useEffect(() => {
    if (isPersonalizationComplete) {
      setShowPersonalizationErrors(false)
    }
  }, [isPersonalizationComplete])

  const personalizationFieldHasError = (fieldKey: string) =>
    Boolean(personalizationErrors[fieldKey] && (personalizationTouched[fieldKey] || showPersonalizationErrors))

  const handleCatalogTemplateSelect = (template: PersonalizationCatalogTemplate) => {
    if (!activeCatalogField) return
    setPersonalizationFieldValue(activeCatalogField, {
      value: template.id,
      displayValue: template.title,
      metadata: template,
    })
    markPersonalizationFieldTouched(activeCatalogField)
    setShowCatalogModal(false)
  }

  const clearCatalogSelection = (fieldKey: string) => {
    setPersonalizationFieldValue(fieldKey, { value: null, displayValue: undefined, metadata: null })
    markPersonalizationFieldTouched(fieldKey)
  }

  const renderPersonalizationField = (field: PersonalizationField) => {
    const entry = personalizationValues[field.key] || { value: null }
    const rawValue = entry.value
    const errorMessage = personalizationErrors[field.key]
    const showError = personalizationFieldHasError(field.key)

    const commonLabel = (
      <div className="flex items-center justify-between">
        <Label htmlFor={`personalization-${field.key}`} className="text-sm font-medium text-gray-900">
          {field.label}
        </Label>
        {field.isRequired && <span className="text-xs text-rose-600">Zorunlu</span>}
      </div>
    )

    const helper = field.helperText ? (
      <p className="text-xs text-muted-foreground">{field.helperText}</p>
    ) : null

    const errorText = showError && errorMessage ? (
      <p className="text-xs text-rose-600">{errorMessage}</p>
    ) : null

    if (field.type === 'textarea' || field.type === 'note') {
      const value = typeof rawValue === 'string' ? rawValue : ''
      return (
        <div key={field.id} className="space-y-2">
          {commonLabel}
          <Textarea
            id={`personalization-${field.key}`}
            value={value}
            onChange={(event) =>
              setPersonalizationFieldValue(field.key, {
                value: event.target.value,
                displayValue: event.target.value,
                metadata: entry.metadata ?? null,
              })
            }
            onBlur={() => markPersonalizationFieldTouched(field.key)}
            rows={3}
          />
          {helper}
          {errorText}
        </div>
      )
    }

    if (field.type === 'text') {
      const value = typeof rawValue === 'string' ? rawValue : ''
      return (
        <div key={field.id} className="space-y-2">
          {commonLabel}
          <Input
            id={`personalization-${field.key}`}
            value={value}
            placeholder={field.placeholder ?? ''}
            onChange={(event) =>
              setPersonalizationFieldValue(field.key, {
                value: event.target.value,
                displayValue: event.target.value,
                metadata: entry.metadata ?? null,
              })
            }
            onBlur={() => markPersonalizationFieldTouched(field.key)}
          />
          {helper}
          {errorText}
        </div>
      )
    }

    if (field.type === 'date') {
      const value = typeof rawValue === 'string' ? rawValue : ''
      return (
        <div key={field.id} className="space-y-2">
          {commonLabel}
          <Input
            id={`personalization-${field.key}`}
            type="date"
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value || null
              setPersonalizationFieldValue(field.key, {
                value: nextValue,
                displayValue: nextValue
                  ? new Date(nextValue).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : undefined,
                metadata: entry.metadata ?? null,
              })
            }}
            onBlur={() => markPersonalizationFieldTouched(field.key)}
          />
          {helper}
          {errorText}
        </div>
      )
    }

    if (field.type === 'select') {
      const value = typeof rawValue === 'string' ? rawValue : ''
      return (
        <div key={field.id} className="space-y-2">
          {commonLabel}
          <Select
            value={value}
            onValueChange={(val) => {
              const option = field.options?.find((item) => item.value === val)
              setPersonalizationFieldValue(field.key, {
                value: val,
                displayValue: option?.label ?? val,
                metadata: option ?? null,
              })
              markPersonalizationFieldTouched(field.key)
            }}
          >
            <SelectTrigger id={`personalization-${field.key}`}>
              <SelectValue placeholder={field.placeholder ?? 'Seçiniz'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label || option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {helper}
          {errorText}
        </div>
      )
    }

    if (field.type === 'catalog') {
      const selectedTemplate = (entry.metadata as PersonalizationCatalogTemplate) || null
      return (
        <div key={field.id} className="space-y-2">
          {commonLabel}
          {selectedTemplate ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="max-w-[70%]">
                <p className="text-sm font-medium text-gray-900">{selectedTemplate.title}</p>
                {selectedTemplate.description && (
                  <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => clearCatalogSelection(field.key)}>
                Kaldır
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActiveCatalogField(field.key)
                setShowCatalogModal(true)
              }}
            >
              Etiket tasarımlarımızı görün
            </Button>
          )}
          {helper}
          {errorText}
        </div>
      )
    }

    const value = typeof rawValue === 'string' ? rawValue : ''
    return (
      <div key={field.id} className="space-y-2">
        {commonLabel}
        <Input
          id={`personalization-${field.key}`}
          value={value}
          onChange={(event) =>
            setPersonalizationFieldValue(field.key, {
              value: event.target.value,
              displayValue: event.target.value,
              metadata: entry.metadata ?? null,
            })
          }
          onBlur={() => markPersonalizationFieldTouched(field.key)}
        />
        {helper}
        {errorText}
      </div>
    )
  }

  const steps = personalizationEnabled
    ? [
        { id: 'overview' as const, label: 'Ürün Seçimi' },
        { id: 'personalization' as const, label: 'Kişiselleştirme' },
      ]
    : []

  const stepIndicator = personalizationEnabled ? (
    <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-3">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id
        const isCompleted = currentStep === 'personalization' && step.id === 'overview'
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => setCurrentStep(step.id)}
            className={cn(
              'flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-left transition',
              isActive ? 'bg-white text-rose-600 shadow' : 'text-rose-500 hover:bg-white/70',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold',
                isActive
                  ? 'border-rose-500 bg-rose-500 text-white'
                  : isCompleted
                    ? 'border-rose-400 bg-rose-100 text-rose-600'
                    : 'border-rose-200 text-rose-500',
              )}
            >
              {index + 1}
            </span>
            <span className="text-sm font-semibold">{step.label}</span>
          </button>
        )
      })}
    </div>
  ) : null

  useEffect(() => {
    if (!hasVariants) return
    const fallbackMap = buildSelectionMap(selectedVariant ?? undefined)
    setSelectedValues(fallbackMap)
  }, [hasVariants, selectedVariant])

  useEffect(() => {
    let cancelled = false
    const variantKey = hasVariants ? selectedVariant?.id ?? null : null

    const checkFavoriteStatus = async () => {
      try {
        const favoriteStatus = await isProductInFavorites(product.id, variantKey)
        if (!cancelled) {
          setIsFavorite(favoriteStatus)
        }
      } catch (error) {
        console.error('Favori kontrolü sırasında hata:', error)
      }
    }

    checkFavoriteStatus()

    return () => {
      cancelled = true
    }
  }, [product.id, hasVariants, selectedVariant?.id])

  const handleSelectVariantValue = useCallback(
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

  const toggleFavorite = useCallback(async () => {
    setIsFavoriteLoading(true)

    try {
      const variantKey = hasVariants ? selectedVariant?.id ?? null : null

      if (isFavorite) {
        const result = await removeFromFavorites(product.id, variantKey)
        if (result.success) {
          setIsFavorite(false)
          toast.success('Ürün favorilerden çıkarıldı')
          window.dispatchEvent(new Event('favoriteUpdated'))
        } else {
          toast.error(result.error || 'Bir hata oluştu')
        }
      } else {
        const result = await addToFavorites(product.id, variantKey)
        if (result.success) {
          setIsFavorite(true)
          toast.success('Ürün favorilere eklendi')
          window.dispatchEvent(new Event('favoriteUpdated'))
        } else {
          toast.error(result.error || 'Bir hata oluştu')
        }
      }
    } catch (error) {
      console.error('Favori işlemi sırasında hata:', error)
      toast.error('Bir hata oluştu')
    } finally {
      setIsFavoriteLoading(false)
    }
  }, [hasVariants, isFavorite, product.id, selectedVariant?.id])

  const handleAddToCart = useCallback(async () => {
    const variantKey = hasVariants ? selectedVariant?.id ?? null : null

    if (hasVariants && !selectedVariant) {
      toast.error('Lütfen bir varyant seçin')
      return
    }

    if ((hasVariants && activeVariantStock <= 0) || (!hasVariants && toNumeric(product.stock ?? 0) <= 0)) {
      toast.error('Seçtiğiniz varyant stokta yok')
      return
    }

    if (personalizationEnabled && !isPersonalizationComplete) {
      touchAllPersonalizationFields()
      setShowPersonalizationErrors(true)
      if (currentStep !== 'personalization') {
        setCurrentStep('personalization')
      }
      toast.error('Lütfen önce kişiselleştirme alanlarını doldurun.')
      return
    }

    setIsLoading(true)

    try {
      const personalizationPayload = personalizationEnabled ? buildPersonalizationPayload() : null
      const result = await addToCart(product.id, quantity, variantKey, personalizationPayload)
      if (result.success) {
        toast.success('Ürün sepete eklendi')
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        toast.error(result.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Sepete ekleme sırasında hata:', error)
      toast.error('Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [
    activeVariantStock,
    buildPersonalizationPayload,
    currentStep,
    hasVariants,
    isPersonalizationComplete,
    personalizationEnabled,
    product.id,
    product.stock,
    quantity,
    selectedVariant,
    touchAllPersonalizationFields,
  ])

  const shareProduct = useCallback(async () => {
    if (typeof window === 'undefined') return

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || product.name,
          url: window.location.href,
        })
      } catch (error) {
        console.debug('Paylaşım iptal edildi', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Ürün bağlantısı kopyalandı')
      } catch (error) {
        console.error('Bağlantı kopyalanamadı', error)
      }
    }
  }, [product.description, product.name])

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
        <ProductMediaCarousel items={mediaItems} />

        <div className="space-y-6 pb-28 lg:pb-0">
          <Link href={`/categories/${product.category.slug}`} className="text-sm font-medium text-rose-600 hover:text-rose-700">
            {product.category.name}
          </Link>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">{product.name}</h1>
            {hasVariants && activeVariantLabel && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>Seçili varyant:</span>
                {activeVariantBadgeColor ? (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: activeVariantBadgeColor, color: '#fff' }}
                  >
                    {activeVariantLabel}
                  </span>
                ) : (
                  <Badge>{activeVariantLabel}</Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-rose-600 lg:text-3xl">
              {formatCurrency(toNumeric(product.price))}
            </span>
            {product.oldPrice && toNumeric(product.oldPrice) > toNumeric(product.price) && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(toNumeric(product.oldPrice))}
              </span>
            )}
          </div>

          {personalizationEnabled && (
            <div className="space-y-3">
              {stepIndicator}
              <p className="text-xs text-muted-foreground">
                Önce varyasyonunuzu seçin, ardından kişiselleştirme bilgilerini doldurun.
              </p>
            </div>
          )}

          <div className={cn(personalizationEnabled && currentStep !== 'overview' && 'hidden', 'space-y-6')}>
            {product.description && (
              <div className="prose prose-sm max-w-none text-gray-600">
                <p>{product.description}</p>
              </div>
            )}

            {hasVariants && (
              <div className="rounded-2xl border border-gray-100 bg-white/60 p-4 shadow-sm">
                <VariantSelector
                  options={options}
                  selectedValues={selectedValues}
                  onSelect={handleSelectVariantValue}
                  isValueAvailable={isValueAvailable}
                />
              </div>
            )}

            {personalizationEnabled && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('personalization')}
                className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                Ürünü kişiselleştirme alanına git
              </Button>
            )}
          </div>

          {personalizationEnabled && (
            <div className={cn(currentStep !== 'personalization' && 'hidden', 'space-y-6')}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Kişiselleştirme Bilgileri</h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep('overview')}>
                  Ürün bilgilerine dön
                </Button>
              </div>
              <div className="space-y-4">
                {personalizationFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Bu ürün için kişiselleştirme alanı tanımlanmamış.</p>
                ) : (
                  personalizationFields.map(renderPersonalizationField)
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 hidden lg:block">
            <label className="text-sm font-medium text-gray-900">Adet</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                aria-label="Adet azalt"
              >
                -
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                aria-label="Adet arttır"
              >
                +
              </button>
            </div>
          </div>

          <div className="hidden space-y-4 lg:block">
            <MicroFeedback hapticType="success" hapticMessage="Ürün sepete eklendi" disabled={isLoading} onClick={handleAddToCart} className="w-full">
              <Button
                type="button"
                data-add-to-cart
                disabled={isLoading || (hasVariants && activeVariantStock <= 0)}
                className="flex w-full items-center justify-center gap-2 bg-rose-600 py-3 text-lg font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon className="h-5 w-5" />
                    Sepete Ekle
                  </>
                )}
              </Button>
            </MicroFeedback>
            {personalizationEnabled && showPersonalizationErrors && !isPersonalizationComplete && (
              <p className="text-xs text-rose-600">Kişiselleştirme alanları tamamlanmadan sepete ekleyemezsiniz.</p>
            )}

            <div className="flex gap-3">
              <MicroFeedback
                hapticType={isFavorite ? 'warning' : 'success'}
                hapticMessage={isFavorite ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi'}
                disabled={isFavoriteLoading}
                onClick={toggleFavorite}
                className="flex-1"
              >
                <Button
                  type="button"
                  data-favorite-btn
                  disabled={isFavoriteLoading}
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isFavoriteLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="gray" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      {isFavorite ? <HeartSolidIcon className="h-5 w-5 text-red-500" /> : <HeartIcon className="h-5 w-5" />}
                      {isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                    </>
                  )}
                </Button>
              </MicroFeedback>

              <Button type="button" onClick={shareProduct} variant="outline" className="flex-1">
                <ShareIcon className="h-5 w-5" />
                Paylaş
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Ürün Özellikleri</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="mr-3 h-2 w-2 rounded-full bg-rose-500" />
                Ücretsiz kargo (150 TL üzeri)
              </li>
              <li className="flex items-center">
                <span className="mr-3 h-2 w-2 rounded-full bg-rose-500" />
                30 gün iade garantisi
              </li>
              <li className="flex items-center">
                <span className="mr-3 h-2 w-2 rounded-full bg-rose-500" />
                Güvenli ödeme
              </li>
              <li className="flex items-center">
                <span className="mr-3 h-2 w-2 rounded-full bg-rose-500" />
                Hızlı teslimat
              </li>
            </ul>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-[999] bg-white/95 shadow-[0_-12px_40px_-18px_rgba(15,23,42,0.18)] backdrop-blur supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-rose-600">
                  {formatCurrency(toNumeric(product.price))}
                </div>
                {hasVariants && activeVariantLabel && (
                  <div className="text-xs text-gray-500">{activeVariantLabel}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300"
                  aria-label="Adet azalt"
                >
                  -
                </button>
                <span className="w-10 text-center font-medium">{quantity}</span>
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

            {personalizationEnabled && !isPersonalizationComplete && (
              <p className="text-xs text-rose-600">Kişiselleştirme bilgileri tamamlanmadan sepete ekleyemezsiniz.</p>
            )}

            <div className="flex gap-2">
              <MicroFeedback
                hapticType={isFavorite ? 'warning' : 'success'}
                hapticMessage={isFavorite ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi'}
                disabled={isFavoriteLoading}
                onClick={toggleFavorite}
                className="shrink-0"
              >
                <button
                  type="button"
                  data-favorite-btn
                  disabled={isFavoriteLoading}
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-50"
                  aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                >
                  {isFavoriteLoading ? <LoadingSpinner size="sm" color="gray" /> : isFavorite ? <HeartSolidIcon className="h-6 w-6 text-red-500" /> : <HeartIcon className="h-6 w-6" />}
                </button>
              </MicroFeedback>

              <MicroFeedback hapticType="success" hapticMessage="Ürün sepete eklendi" disabled={isLoading} onClick={handleAddToCart} className="flex-1">
                <button
                  type="button"
                  data-add-to-cart
                  disabled={isLoading || (hasVariants && activeVariantStock <= 0)}
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-rose-600 font-semibold text-white disabled:opacity-50"
                  aria-label="Sepete ekle"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" className="mr-2" />
                      Ekleniyor...
                    </>
                  ) : (
                    'Sepete Ekle'
                  )}
                </button>
              </MicroFeedback>
            </div>
          </div>
        </div>
      </div>

      {personalizationEnabled && (
        <Modal
          isOpen={showCatalogModal}
          onClose={() => setShowCatalogModal(false)}
          title="Etiket Tasarımları"
          size="xl"
          className="max-w-6xl"
        >
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalogTemplates.map((template) => {
              const isSelected =
                activeCatalogField &&
                (personalizationValues[activeCatalogField]?.value ?? null) === template.id
              return (
                <div
                  key={template.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCatalogTemplateSelect(template)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleCatalogTemplateSelect(template)
                    }
                  }}
                  className={cn(
                    'flex h-full flex-col overflow-hidden rounded-lg border text-left transition cursor-pointer',
                    isSelected ? 'border-rose-500 shadow-lg' : 'border-muted hover:border-rose-300',
                  )}
                >
                  <div className="relative h-56 w-full bg-white overflow-hidden rounded-md group">
                    {template.imageUrl ? (
                      <>
                        <img
                          src={template.imageUrl}
                          alt={template.title}
                          className="h-full w-full object-contain"
                        />
                        {/* Tam Ekran Butonu (button değil, span) */}
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            setFullscreenImage({
                              url: template.imageUrl!,
                              title: template.title
                            })
                          }}
                          className="absolute top-2 right-2 flex items-center gap-1 bg-black/55 hover:bg-black/70 text-white px-2.5 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                          title="Tam ekran görüntüle"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setFullscreenImage({ url: template.imageUrl!, title: template.title })
                            }
                          }}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                          <span className="text-xs font-medium">Tam ekran</span>
                        </span>
                      </>
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
                        Görsel bulunamadı
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{template.title}</span>
                      {isSelected && <Badge variant="default" className="text-[10px] uppercase">Seçili</Badge>}
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                    )}
                    {template.recommendedSizes && template.recommendedSizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {template.recommendedSizes.map((size) => (
                          <Badge key={size} variant="secondary" className="text-[10px]">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      {/* Tam Ekran Görsel Modalı */}
      {fullscreenImage && (
        <FullscreenImageModal
          isOpen={!!fullscreenImage}
          onClose={() => setFullscreenImage(null)}
          imageUrl={fullscreenImage.url}
          title={fullscreenImage.title}
        />
      )}
    </>
  )
}
