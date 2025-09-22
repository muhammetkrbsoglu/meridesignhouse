'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Color } from '@/lib/actions/colors'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ImageKitUpload } from '@/components/ui/imagekit-upload'
import { ImageKitImage } from '@/components/ui/imagekit-image'
import { PRODUCT_TEMPLATES, type ProductTemplate, type ProductOptionTemplate } from '@/config/productTemplates'
import { PERSONALIZATION_CATALOG_TEMPLATES } from '@/config/personalizationCatalog'
import { createProduct, updateProduct } from '@/lib/actions/products'
import type { ProductWithVariants, ProductVariant } from '@/types/product'
import type { PersonalizationFieldType, PersonalizationFieldOption, PersonalizationCatalogTemplate } from '@/types/personalization'
import { cn } from '@/lib/utils'
import { Plus, X, ImagePlus, ShieldCheck, Sparkles } from 'lucide-react'

interface Category {
  id: string
  name: string
}

const productSchema = z.object({
  name: z.string().min(1, 'Varsayılan varyant adı gereklidir'),
  cardTitle: z.string().min(1, 'Kart başlığı gereklidir'),
  description: z.string().optional(),
  price: z.number().min(0, 'Fiyat 0 veya daha büyük olmalıdır'),
  oldPrice: z.number().min(0, 'Eski fiyat 0 veya daha büyük olmalıdır').optional(),
  stock: z.number().min(0, 'Stok 0 veya daha büyük olmalıdır'),
  categoryId: z.string().min(1, 'Kategori seçimi gereklidir'),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isProductOfWeek: z.boolean(),
  productOfWeekCategoryId: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

type OptionDisplayType = ProductOptionTemplate['displayType']

type BuilderImageInput = {
  id: string
  url: string
  fileId?: string | null
  alt?: string | null
  sortOrder: number
}

type BuilderOptionValue = {
  id: string
  optionId: string
  value: string
  label: string
  hexValue?: string | null
  sortOrder: number
}

type BuilderOption = {
  id: string
  key: string
  label: string
  displayType: OptionDisplayType
  sortOrder: number
  values: BuilderOptionValue[]
}

type BuilderVariant = {
  id: string
  title: string
  description?: string | null
  sku?: string | null
  stock?: number | null
  sortOrder: number
  isActive: boolean
  badgeHex?: string | null
  optionSelections: Array<{ optionId: string; valueId: string }>
  images: BuilderImageInput[]
}

type VariantBuilderState = {
  hasVariants: boolean
  templateId?: string
  options: BuilderOption[]
  variants: BuilderVariant[]
  sharedImages: BuilderImageInput[]
  defaultVariantId?: string
}

type PersonalizationFieldBuilder = {
  id: string
  key: string
  label: string
  type: PersonalizationFieldType
  placeholder?: string
  helperText?: string
  isRequired: boolean
  sortOrder: number
  options?: PersonalizationFieldOption[]
  metadata?: Record<string, any> | null
}

type PersonalizationBuilderState = {
  enabled: boolean
  requireCompletion: boolean
  stepCount: number
  fields: PersonalizationFieldBuilder[]
  settings: {
    catalogTemplates: PersonalizationCatalogTemplate[]
    requireCatalogBeforeSize: boolean
  }
}

type UploadedAsset = {
  url: string
  fileId?: string | null
  name?: string | null
}

type SupabaseOptionValueRow = {
  id: string
  optionId: string
  value: string
  label: string
  hexValue?: string | null
  sortOrder?: number | null
}

type SupabaseOptionRow = {
  id: string
  productId: string
  key: string
  label: string
  displayType: OptionDisplayType
  sortOrder?: number | null
  product_option_values?: SupabaseOptionValueRow[] | null
}

type SupabaseVariantOptionRow = {
  optionId: string
  valueId: string
}

type SupabaseVariantRow = {
  id: string
  productId: string
  title: string
  description?: string | null
  sku?: string | null
  stock?: number | null
  isActive?: boolean | null
  sortOrder?: number | null
  optionValueKey: string
  badgeHex?: string | null
  product_variant_options?: SupabaseVariantOptionRow[] | null
}

type SupabaseImageRow = {
  id?: string
  url: string
  fileId?: string | null
  alt?: string | null
  sortOrder?: number | null
  variantId?: string | null
}

interface ProductFormProps {
  categories: Category[]
  colors: Color[]
  product?: ProductWithVariants | null
}

const CUSTOM_COLOR_VALUE = '__custom__'
const FALLBACK_BADGE_HEX = '#F97316'

const normalizeHex = (hex?: string | null): string | null => {
  if (!hex) return null
  const trimmed = hex.trim()
  if (!trimmed) return null
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  return withHash.toUpperCase()
}

const withFallbackHex = (hex: string | null | undefined, fallback: string): string => {
  return normalizeHex(hex) ?? fallback
}

const buildOptionValueKey = (optionOrder: string[], selections: Array<{ optionId: string; valueId: string }>) => {
  const ordering = new Map(optionOrder.map((id, index) => [id, index]))
  return selections
    .slice()
    .sort((a, b) => {
      const indexA = ordering.get(a.optionId) ?? 0
      const indexB = ordering.get(b.optionId) ?? 0
      if (indexA !== indexB) {
        return indexA - indexB
      }
      return a.optionId.localeCompare(b.optionId)
    })
    .map(({ optionId, valueId }) => `${optionId}:${valueId}`)
    .join('|')
}

const cartesianProduct = <T,>(arrays: T[][]): T[][] => {
  if (arrays.length === 0) return []
  return arrays.reduce<T[][]>((acc, curr) => {
    if (acc.length === 0) {
      return curr.map((item) => [item])
    }
    const combinations: T[][] = []
    for (const prev of acc) {
      for (const item of curr) {
        combinations.push([...prev, item])
      }
    }
    return combinations
  }, [])
}

const coerceNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const parsed = parseFloat(String((value as { toString: () => string }).toString()))
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const createBlankBuilderState = (): VariantBuilderState => ({
  hasVariants: false,
  templateId: undefined,
  options: [],
  variants: [],
  sharedImages: [],
  defaultVariantId: undefined,
})

const deriveBuilderStateFromProduct = (product?: ProductWithVariants | null): VariantBuilderState => {
  if (!product) {
    return createBlankBuilderState()
  }

  const options: BuilderOption[] = (product.options || []).map((option, optionIndex) => ({
    id: option.id,
    key: option.key,
    label: option.label,
    displayType: option.displayType || 'swatch',
    sortOrder: option.sortOrder ?? optionIndex,
    values: (option.values || []).map((value, valueIndex) => ({
      id: value.id,
      optionId: option.id,
      value: value.value,
      label: value.label,
      hexValue: normalizeHex(value.hexValue),
      sortOrder: value.sortOrder ?? valueIndex,
    })),
  }))

  const sharedImages: BuilderImageInput[] = (product.images || [])
    .filter((image) => !image.variantId)
    .map((image, index) => ({
      id: image.id || `${product.id}-shared-${index}`,
      url: image.url,
      fileId: image.fileId ?? null,
      alt: image.alt ?? null,
      sortOrder: image.sortOrder ?? index,
    }))

  const optionOrder = options.map((option) => option.id)

  const variants: BuilderVariant[] = (product.variants || []).map((variant, variantIndex) => ({
    id: variant.id,
    title: variant.title,
    description: variant.description ?? null,
    sku: variant.sku ?? null,
    stock: variant.stock ?? 0,
    sortOrder: variant.sortOrder ?? variantIndex,
    isActive: variant.isActive ?? true,
    badgeHex: normalizeHex(variant.badgeHex),
    optionSelections: (variant.optionValues || []).map((value) => ({
      optionId: value.optionId,
      valueId: value.valueId,
    })),
    images: (variant.images || []).map((image, imageIndex) => ({
      id: image.id || `${variant.id}-img-${imageIndex}`,
      url: image.url,
      fileId: image.fileId ?? null,
      alt: image.alt ?? null,
      sortOrder: image.sortOrder ?? imageIndex,
    })),
  }))

  return {
    hasVariants: product.hasVariants ?? (variants.length > 0),
    templateId: undefined,
    options,
    variants,
    sharedImages,
    defaultVariantId: product.defaultVariantId ?? variants[0]?.id,
  }
}

const DEFAULT_TAG_SIZE_OPTIONS: PersonalizationFieldOption[] = [
  { value: '50x50', label: '5 x 5 cm' },
  { value: '60x60', label: '6 x 6 cm' },
  { value: '80x50', label: '8 x 5 cm' },
  { value: '80x60', label: '8 x 6 cm' },
  { value: '90x50', label: '9 x 5 cm' },
]

type PersonalizationFieldPreset = {
  key: string
  label: string
  type: PersonalizationFieldType
  placeholder?: string
  helperText?: string
  isRequired?: boolean
  options?: PersonalizationFieldOption[]
  metadata?: Record<string, any> | null
}

const PERSONALIZATION_FIELD_PRESETS: PersonalizationFieldPreset[] = [
  {
    key: 'names',
    label: 'İsimler',
    type: 'text',
    placeholder: 'Örn. Ali & Ayşe',
    helperText: 'Etiket üzerinde yer alacak isimleri yazın.',
    isRequired: true,
  },
  {
    key: 'eventDate',
    label: 'Tarih',
    type: 'date',
    helperText: 'Etkinlik tarihini seçin.',
    isRequired: false,
  },
  {
    key: 'tagSize',
    label: 'Etiket Boyutu',
    type: 'select',
    helperText: 'Etiket ölçüsünü seçin.',
    isRequired: true,
    options: DEFAULT_TAG_SIZE_OPTIONS,
  },
  {
    key: 'tagTemplate',
    label: 'Etiket Tasarımı',
    type: 'catalog',
    helperText: 'Müşteri kataloğu açarak tasarım seçimini yapacak.',
    isRequired: true,
    metadata: {
      catalogPreview: true,
    },
  },
  {
    key: 'extraText',
    label: 'Ek Metin',
    type: 'text',
    placeholder: 'Örn. Nişan Hatırası',
    helperText: 'Etikete eklenecek kısa bir ifade.',
    isRequired: false,
  },
  {
    key: 'note',
    label: 'Üretim Notu',
    type: 'textarea',
    placeholder: 'Üretim notları veya özel istekler',
    helperText: 'Müşteri ek not bırakabilir.',
    isRequired: false,
  },
]

const createPersonalizationField = (preset: PersonalizationFieldPreset, sortOrder: number): PersonalizationFieldBuilder => ({
  id: crypto.randomUUID(),
  key: preset.key,
  label: preset.label,
  type: preset.type,
  placeholder: preset.placeholder,
  helperText: preset.helperText,
  isRequired: preset.isRequired ?? false,
  sortOrder,
  options: preset.options ? preset.options.map((option) => ({ ...option })) : undefined,
  metadata: preset.metadata ?? null,
})

const createBlankPersonalizationState = (): PersonalizationBuilderState => ({
  enabled: false,
  requireCompletion: true,
  stepCount: 2,
  fields: [],
  settings: {
    catalogTemplates: PERSONALIZATION_CATALOG_TEMPLATES,
    requireCatalogBeforeSize: true,
  },
})

const derivePersonalizationStateFromProduct = (product?: ProductWithVariants | null): PersonalizationBuilderState => {
  if (!product?.personalizationConfig) {
    return createBlankPersonalizationState()
  }

  const config = product.personalizationConfig
  const fields: PersonalizationFieldBuilder[] = (config.fields || []).map((field, index) => ({
    id: field.id || crypto.randomUUID(),
    key: field.key,
    label: field.label,
    type: field.type,
    placeholder: field.placeholder ?? undefined,
    helperText: field.helperText ?? undefined,
    isRequired: Boolean(field.isRequired),
    sortOrder: field.sortOrder ?? index,
    options: field.options ? field.options.map((option) => ({ ...option })) : undefined,
    metadata: field.metadata ?? null,
  }))

  return {
    enabled: true,
    requireCompletion: config.requireCompletion,
    stepCount: config.stepCount || 2,
    fields,
    settings: {
      catalogTemplates: config.settings?.catalogTemplates?.length
        ? config.settings.catalogTemplates
        : PERSONALIZATION_CATALOG_TEMPLATES,
      requireCatalogBeforeSize: Boolean(config.settings?.requireCatalogBeforeSize ?? true),
    },
  }
}

const buildVariantPayload = (state: VariantBuilderState) => {
  return {
    hasVariants: state.hasVariants,
    templateId: state.templateId,
    options: state.options.map((option, optionIndex) => ({
      id: option.id,
      key: option.key,
      label: option.label,
      displayType: option.displayType,
      sortOrder: option.sortOrder ?? optionIndex,
      values: option.values.map((value, valueIndex) => ({
        id: value.id,
        optionId: option.id,
        value: value.value,
        label: value.label,
        hexValue: value.hexValue ?? null,
        sortOrder: value.sortOrder ?? valueIndex,
      })),
    })),
    variants: state.variants.map((variant, variantIndex) => ({
      id: variant.id,
      title: variant.title,
      description: variant.description ?? null,
      sku: variant.sku ?? null,
      stock: variant.stock ?? 0,
      isActive: variant.isActive,
      isDefault: state.defaultVariantId === variant.id,
      sortOrder: variant.sortOrder ?? variantIndex,
      badgeHex: variant.badgeHex ?? null,
      optionSelections: variant.optionSelections,
      images: variant.images.map((image, imageIndex) => ({
        id: image.id,
        url: image.url,
        fileId: image.fileId ?? null,
        alt: image.alt ?? null,
        sortOrder: image.sortOrder ?? imageIndex,
      })),
    })),
    sharedImages: state.sharedImages.map((image, index) => ({
      id: image.id,
      url: image.url,
      fileId: image.fileId ?? null,
      alt: image.alt ?? null,
      sortOrder: image.sortOrder ?? index,
    })),
    defaultVariantClientId: state.defaultVariantId ?? state.variants[0]?.id ?? null,
  }
}

const buildPersonalizationPayload = (state: PersonalizationBuilderState) => {
  return {
    enabled: state.enabled,
    requireCompletion: state.requireCompletion,
    stepCount: state.stepCount,
    settings: {
      catalogTemplates: state.settings.catalogTemplates,
      requireCatalogBeforeSize: state.settings.requireCatalogBeforeSize,
    },
    fields: state.fields
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((field, index) => ({
        id: field.id,
        key: field.key,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder,
        helperText: field.helperText,
        isRequired: field.isRequired,
        sortOrder: field.sortOrder ?? index,
        options: field.options,
        metadata: field.metadata ?? null,
      })),
  }
}

const stepLabels = ['Genel Bilgiler', 'Varyasyonlar', 'Kişiselleştirme', 'Görseller & Yayın']

export function ProductForm({ categories, colors, product }: ProductFormProps) {
  const router = useRouter()
  const initialBuilderState = useMemo(() => deriveBuilderStateFromProduct(product), [product])
  const initialPersonalizationState = useMemo(() => derivePersonalizationStateFromProduct(product), [product])
  const [builderState, setBuilderState] = useState<VariantBuilderState>(initialBuilderState)
  const [personalizationState, setPersonalizationState] = useState<PersonalizationBuilderState>(initialPersonalizationState)

  const colorPalette = useMemo(() => {
    const seen = new Set<string>()
    const palette: Array<{ hex: string; name: string }> = []
    for (const color of colors) {
      const normalized = normalizeHex(color.hex)
      if (!normalized || seen.has(normalized)) continue
      seen.add(normalized)
      palette.push({ hex: normalized, name: color.name })
    }
    return palette
  }, [colors])

  const colorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const entry of colorPalette) {
      map.set(entry.hex, entry.name)
    }
    return map
  }, [colorPalette])

  const defaultPaletteHex = colorPalette[0]?.hex ?? FALLBACK_BADGE_HEX
  const hasPalette = colorPalette.length > 0
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    setBuilderState(initialBuilderState)
  }, [initialBuilderState])

  useEffect(() => {
    setPersonalizationState(initialPersonalizationState)
  }, [initialPersonalizationState])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      cardTitle: product?.cardTitle || product?.name || '',
      description: product?.description || '',
      price: coerceNumber(product?.price, 0),
      oldPrice: (() => {
        const value = coerceNumber(product?.oldPrice, Number.NaN)
        return Number.isNaN(value) ? undefined : value
      })(),
      stock: coerceNumber(product?.stock, 0),
      categoryId: product?.categoryId || '',
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      isNewArrival: product?.isNewArrival ?? false,
      isProductOfWeek: product?.isProductOfWeek ?? false,
      productOfWeekCategoryId: product?.productOfWeekCategoryId || '',
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = form

  const isProductOfWeek = watch('isProductOfWeek')
  const categoryId = watch('categoryId')
  const hasVariants = builderState.hasVariants

  const categoryOptions = useMemo(() => categories.map((category) => ({ label: category.name, value: category.id })), [categories])

  const handleTogglePersonalizationEnabled = useCallback((checked: boolean) => {
    setPersonalizationState((prev) => {
      if (checked) {
        if (prev.fields.length === 0) {
          const defaultKeys = ['tagTemplate', 'tagSize', 'names', 'eventDate', 'extraText']
          const seededFields: PersonalizationFieldBuilder[] = []
          defaultKeys.forEach((key) => {
            if (seededFields.find((field) => field.key === key)) return
            const preset = PERSONALIZATION_FIELD_PRESETS.find((item) => item.key === key)
            if (preset) {
              seededFields.push(createPersonalizationField(preset, seededFields.length))
            }
          })
          return {
            ...prev,
            enabled: true,
            fields: seededFields,
          }
        }
        return { ...prev, enabled: true }
      }
      return { ...prev, enabled: false }
    })
  }, [])

  const handleTogglePersonalizationField = useCallback((key: string, checked: boolean) => {
    setPersonalizationState((prev) => {
      if (checked) {
        if (prev.fields.some((field) => field.key === key)) {
          return prev
        }
        const preset = PERSONALIZATION_FIELD_PRESETS.find((item) => item.key === key)
        if (!preset) {
          return prev
        }
        const nextField = createPersonalizationField(preset, prev.fields.length)
        return {
          ...prev,
          fields: [...prev.fields, nextField],
        }
      }

      return {
        ...prev,
        fields: prev.fields
          .filter((field) => field.key !== key)
          .map((field, index) => ({ ...field, sortOrder: index })),
      }
    })
  }, [])

  const handleUpdatePersonalizationField = useCallback(
    (fieldId: string, patch: Partial<PersonalizationFieldBuilder>) => {
      setPersonalizationState((prev) => ({
        ...prev,
        fields: prev.fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
      }))
    },
  [])

  const handleAddSelectOption = useCallback((fieldId: string) => {
    setPersonalizationState((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => {
        if (field.id !== fieldId) return field
        const nextOptions = [...(field.options || []), { value: crypto.randomUUID(), label: 'Yeni seçenek' }]
        return { ...field, options: nextOptions }
      }),
    }))
  }, [])

  const handleUpdateSelectOption = useCallback(
    (fieldId: string, index: number, patch: Partial<PersonalizationFieldOption>) => {
      setPersonalizationState((prev) => ({
        ...prev,
        fields: prev.fields.map((field) => {
          if (field.id !== fieldId) return field
          const nextOptions = [...(field.options || [])]
          if (!nextOptions[index]) {
            return field
          }
          nextOptions[index] = { ...nextOptions[index], ...patch }
          return { ...field, options: nextOptions }
        }),
      }))
    },
  [])

  const handleRemoveSelectOption = useCallback((fieldId: string, index: number) => {
    setPersonalizationState((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => {
        if (field.id !== fieldId) return field
        const nextOptions = (field.options || []).filter((_, optionIndex) => optionIndex !== index)
        return { ...field, options: nextOptions }
      }),
    }))
  }, [])

  const handleToggleCatalogTemplate = useCallback((template: PersonalizationCatalogTemplate) => {
    setPersonalizationState((prev) => {
      const exists = prev.settings.catalogTemplates.some((item) => item.id === template.id)
      let nextTemplates: PersonalizationCatalogTemplate[]
      if (exists) {
        nextTemplates = prev.settings.catalogTemplates.filter((item) => item.id !== template.id)
        if (nextTemplates.length === 0) {
          // En az bir şablon kalmalı
          return prev
        }
      } else {
        nextTemplates = [...prev.settings.catalogTemplates, template]
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          catalogTemplates: nextTemplates,
        },
      }
    })
  }, [])

  const handleSelectAllCatalogTemplates = useCallback(() => {
    setPersonalizationState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        catalogTemplates: PERSONALIZATION_CATALOG_TEMPLATES,
      },
    }))
  }, [])

  const handleClearCatalogTemplates = useCallback(() => {
    setPersonalizationState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        catalogTemplates: PERSONALIZATION_CATALOG_TEMPLATES.slice(0, 1),
      },
    }))
  }, [])

  const applyTemplate = useCallback((template: ProductTemplate) => {
    const optionDrafts: BuilderOption[] = template.optionGroups.map((group, index) => {
      const optionId = crypto.randomUUID()
      return {
        id: optionId,
        key: group.key,
        label: group.label,
        displayType: group.displayType,
        sortOrder: index,
        values: [],
      }
    })

    setBuilderState((prev) => ({
      hasVariants: true,
      templateId: template.id,
      options: optionDrafts,
      variants: [],
      sharedImages: prev.sharedImages,
      defaultVariantId: undefined,
    }))
  }, [])

  const handleGenerateVariants = useCallback(() => {
    if (!builderState.hasVariants) return

    const options = builderState.options
    if (!options.length) {
      setError('Varyasyon oluşturmak için en az bir seçenek eklemelisiniz.')
      return
    }

    if (options.some((option) => option.values.length === 0)) {
      setError('Her seçenek için en az bir değer eklemelisiniz.')
      return
    }

    const optionOrder = options.map((option) => option.id)
    const combinations = cartesianProduct(options.map((option) => option.values))

    const existingByKey = new Map(
      builderState.variants.map((variant) => [
        buildOptionValueKey(optionOrder, variant.optionSelections),
        variant,
      ]),
    )

    const nextVariants: BuilderVariant[] = combinations.map((combo, index) => {
      const optionSelections = combo.map((value) => ({ optionId: value.optionId, valueId: value.id }))
      const optionValueKey = buildOptionValueKey(optionOrder, optionSelections)
      const existing = existingByKey.get(optionValueKey)
      const generatedTitle = combo.map((value) => value.label || value.value).join(' / ')

      if (existing) {
        return {
          ...existing,
          title: existing.title || generatedTitle,
          sortOrder: index,
        }
      }

      return {
        id: crypto.randomUUID(),
        title: generatedTitle,
        description: null,
        sku: undefined,
        stock: 0,
        sortOrder: index,
        isActive: true,
        badgeHex: defaultPaletteHex,
        optionSelections,
        images: [],
      }
    })

    setBuilderState((prev) => ({
      ...prev,
      options: [...prev.options],
      variants: nextVariants,
      defaultVariantId: prev.defaultVariantId && nextVariants.some((variant) => variant.id === prev.defaultVariantId)
        ? prev.defaultVariantId
        : nextVariants[0]?.id,
    }))
    setError(null)
  }, [builderState, defaultPaletteHex])

  const handleUpdateOptionMeta = useCallback((optionId: string, patch: Partial<BuilderOption>) => {
    setBuilderState((prev) => ({
      ...prev,
      options: prev.options.map((option) => {
        if (option.id !== optionId) return option
        let nextValues = option.values
        if (patch.displayType && patch.displayType !== option.displayType) {
          nextValues = option.values.map((value) => ({
            ...value,
            hexValue: patch.displayType === 'swatch' ? withFallbackHex(value.hexValue, defaultPaletteHex) : null,
          }))
        }
        return {
          ...option,
          ...patch,
          values: nextValues,
        }
      }),
    }))
  }, [defaultPaletteHex])

  const handleAddOptionValue = useCallback((optionId: string) => {
    setBuilderState((prev) => ({
      ...prev,
      options: prev.options.map((option) => {
        if (option.id !== optionId) return option
        const valueId = crypto.randomUUID()
        return {
          ...option,
          values: [
            ...option.values,
            {
              id: valueId,
              optionId,
              value: '',
              label: '',
              hexValue: option.displayType === 'swatch' ? defaultPaletteHex : null,
              sortOrder: option.values.length,
            },
          ],
        }
      }),
    }))
  }, [defaultPaletteHex])

  const handleUpdateOptionValue = useCallback((optionId: string, valueId: string, patch: Partial<BuilderOptionValue>) => {
    setBuilderState((prev) => ({
      ...prev,
      options: prev.options.map((option) => {
        if (option.id !== optionId) return option
        return {
          ...option,
          values: option.values.map((value) => (value.id === valueId ? { ...value, ...patch } : value)),
        }
      }),
    }))
  }, [])

  const handleRemoveOptionValue = useCallback((optionId: string, valueId: string) => {
    setBuilderState((prev) => ({
      ...prev,
      options: prev.options.map((option) => {
        if (option.id !== optionId) return option
        return {
          ...option,
          values: option.values.filter((value) => value.id !== valueId).map((value, index) => ({ ...value, sortOrder: index })),
        }
      }),
      variants: prev.variants.filter((variant) =>
        !variant.optionSelections.some((selection) => selection.optionId === optionId && selection.valueId === valueId),
      ),
    }))
  }, [])

  const handleUpdateVariant = useCallback((variantId: string, patch: Partial<BuilderVariant>) => {
    setBuilderState((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => (variant.id === variantId ? { ...variant, ...patch } : variant)),
    }))
  }, [])

  const handleRemoveVariant = useCallback((variantId: string) => {
    setBuilderState((prev) => {
      const nextVariants = prev.variants.filter((variant) => variant.id !== variantId)
      const nextDefault = prev.defaultVariantId === variantId ? nextVariants[0]?.id : prev.defaultVariantId
      return {
        ...prev,
        variants: nextVariants.map((variant, index) => ({ ...variant, sortOrder: index })),
        defaultVariantId: nextDefault,
      }
    })
  }, [])

  const handleSetDefaultVariant = useCallback((variantId: string) => {
    setBuilderState((prev) => ({ ...prev, defaultVariantId: variantId }))
  }, [])

  const handleVariantImageUpload = useCallback((variantId: string, asset: UploadedAsset) => {
    setBuilderState((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.id !== variantId) return variant
        const nextImages = [
          ...variant.images,
          {
            id: asset.fileId || crypto.randomUUID(),
            url: asset.url,
            fileId: asset.fileId,
            alt: asset.name ?? null,
            sortOrder: variant.images.length,
          },
        ]
        return { ...variant, images: nextImages }
      }),
    }))
  }, [])

  const handleVariantImageRemove = useCallback((variantId: string, imageId: string) => {
    setBuilderState((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.id !== variantId) return variant
        const nextImages = variant.images
          .filter((image) => image.id !== imageId)
          .map((image, index) => ({ ...image, sortOrder: index }))
        return { ...variant, images: nextImages }
      }),
    }))
  }, [])

  const handleSharedImageUpload = useCallback((asset: UploadedAsset) => {
    setBuilderState((prev) => ({
      ...prev,
      sharedImages: [
        ...prev.sharedImages,
        {
          id: asset.fileId || crypto.randomUUID(),
          url: asset.url,
          fileId: asset.fileId,
          alt: asset.name ?? null,
          sortOrder: prev.sharedImages.length,
        },
      ],
    }))
  }, [])

  const handleSharedImageRemove = useCallback((imageId: string) => {
    setBuilderState((prev) => ({
      ...prev,
      sharedImages: prev.sharedImages.filter((image) => image.id !== imageId).map((image, index) => ({ ...image, sortOrder: index })),
    }))
  }, [])

  const handleFormKeyDown = useCallback((event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter') {
      return
    }

    const target = event.target as HTMLElement | null
    if (!target) {
      return
    }

    if (target instanceof HTMLTextAreaElement) {
      return
    }

    if (target instanceof HTMLButtonElement) {
      if (target.type && target.type.toLowerCase() === 'submit') {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      return
    }

    if (target instanceof HTMLInputElement) {
      const inputType = target.type?.toLowerCase()
      const allowTypes = new Set(['submit', 'button', 'checkbox', 'radio'])
      if (allowTypes.has(inputType)) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      return
    }

    event.preventDefault()
    event.stopPropagation()
  }, [])

  const goToStep = useCallback(async (nextStep: number) => {
    if (nextStep > activeStep) {
      // basic validation before moving forward
      if (activeStep === 0) {
        const valid = await trigger(['name', 'cardTitle', 'price', 'categoryId'])
        if (!valid) return
      }
      if (activeStep === 1 && builderState.hasVariants) {
        if (!builderState.options.length) {
          setError('Lütfen önce varyasyon seçeneklerini tanımlayın.')
          return
        }
        if (!builderState.variants.length) {
          setError('Lütfen varyasyon kombinasyonlarını oluşturun.')
          return
        }
      }
      if (activeStep === 2 && personalizationState.enabled) {
        if (personalizationState.fields.length === 0) {
          setError('Kişiselleştirme için en az bir alan seçmelisiniz.')
          return
        }
      }
    }
    setError(null)
    setActiveStep(nextStep)
  }, [activeStep, trigger, builderState, personalizationState])

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)

      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('cardTitle', data.cardTitle)
      formData.append('description', data.description || '')
      formData.append('price', data.price.toString())
      if (data.oldPrice !== undefined && data.oldPrice !== null) {
        formData.append('oldPrice', data.oldPrice.toString())
      }
      formData.append('stock', data.stock.toString())
      formData.append('categoryId', data.categoryId)
      if (data.isActive) formData.append('isActive', 'on')
      if (data.isFeatured) formData.append('isFeatured', 'on')
      if (data.isNewArrival) formData.append('isNewArrival', 'on')
      if (data.isProductOfWeek) formData.append('isProductOfWeek', 'on')
      if (data.productOfWeekCategoryId) {
        formData.append('productOfWeekCategoryId', data.productOfWeekCategoryId)
      }

      const variantPayload = buildVariantPayload(builderState)
      formData.append('variantState', JSON.stringify(variantPayload))

      const personalizationPayload = buildPersonalizationPayload(personalizationState)
      formData.append('personalizationState', JSON.stringify(personalizationPayload))

      if (!builderState.hasVariants && builderState.sharedImages.length > 0) {
        formData.append('images', JSON.stringify(builderState.sharedImages))
      }

      if (product) {
        const result = await updateProduct(product.id, {}, formData)
        if (!result?.ok) {
          setError(result?.message || 'Ürün güncellenemedi.')
          return
        }
        setSuccess(result.message || 'Ürün başarıyla güncellendi!')
      } else {
        const result = await createProduct({}, formData)
        if (!result?.ok) {
          setError(result?.message || 'Ürün oluşturulamadı.')
          return
        }
        setSuccess(result.message || 'Ürün başarıyla oluşturuldu!')
        setTimeout(() => router.push('/admin/products'), 1500)
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  })

  const handleFormSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return
    await onSubmit()
  }, [isSubmitting, onSubmit])

  const renderGeneralStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cardTitle">Kart Başlığı</Label>
          <Input id="cardTitle" placeholder="Ürün kartında görünecek başlık" {...register('cardTitle')} />
          {errors.cardTitle && <p className="text-sm text-red-600">{errors.cardTitle.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Varsayılan Varyant Başlığı</Label>
          <Input id="name" placeholder="Varsayılan varyant adı" {...register('name')} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Kategori</Label>
          <Select value={categoryId} onValueChange={(value) => setValue('categoryId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Fiyat (TL)</Label>
          <Input id="price" type="number" step="0.01" placeholder="0.00" {...register('price', { valueAsNumber: true })} />
          {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="oldPrice">Eski Fiyat (TL)</Label>
          <Input id="oldPrice" type="number" step="0.01" placeholder="0.00" {...register('oldPrice', { valueAsNumber: true })} />
          {errors.oldPrice && <p className="text-sm text-red-600">{errors.oldPrice.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stok Adedi (Toplam)</Label>
          <Input
            id="stock"
            type="number"
            placeholder="0"
            {...register('stock', { valueAsNumber: true })}
            readOnly={builderState.hasVariants}
            className={cn(builderState.hasVariants && 'bg-muted cursor-not-allowed')}
            title={builderState.hasVariants ? 'Varyantlı ürünlerde stok, varyantların toplamı olarak hesaplanır.' : undefined}
          />
          {errors.stock && <p className="text-sm text-red-600">{errors.stock.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Varsayılan Açıklama</Label>
        <Textarea id="description" rows={4} placeholder="Ürün açıklamasını girin" {...register('description')} />
        <p className="text-xs text-muted-foreground">Bu açıklama varsayılan varyant için kullanılacak. Diğer varyantlara özel açıklama yazabilirsiniz.</p>
        {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Aktif</p>
            <p className="text-xs text-muted-foreground">Ürün müşteriler tarafından görülebilir.</p>
          </div>
          <Switch checked={watch('isActive')} onCheckedChange={(checked) => setValue('isActive', checked)} />
        </label>
        <label className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Öne Çıkan</p>
            <p className="text-xs text-muted-foreground">Anasayfada öne çıkan listesinde göster.</p>
          </div>
          <Switch checked={watch('isFeatured')} onCheckedChange={(checked) => setValue('isFeatured', checked)} />
        </label>
        <label className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Yeni Ürün</p>
            <p className="text-xs text-muted-foreground">"Yeni ürünler" bölümünde sergile.</p>
          </div>
          <Switch checked={watch('isNewArrival')} onCheckedChange={(checked) => setValue('isNewArrival', checked)} />
        </label>
        <label className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Haftanın Ürünü</p>
            <p className="text-xs text-muted-foreground">Haftanın ürünü koleksiyonunda yer alır.</p>
          </div>
          <Switch checked={watch('isProductOfWeek')} onCheckedChange={(checked) => setValue('isProductOfWeek', checked)} />
        </label>
      </div>

      {isProductOfWeek && (
        <div className="space-y-2">
          <Label htmlFor="productOfWeekCategoryId">Haftanın Ürünü Kategorisi</Label>
          <Select value={watch('productOfWeekCategoryId') || ''} onValueChange={(value) => setValue('productOfWeekCategoryId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.productOfWeekCategoryId && <p className="text-sm text-red-600">{errors.productOfWeekCategoryId.message}</p>}
        </div>
      )}
    </div>
  )

  const renderOptionsEditor = () => (
    <div className="space-y-4">
      {builderState.options.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Önce bir şablon seçin ya da manuel olarak seçenek ekleyin.
        </div>
      )}

      {builderState.options.map((option) => (
        <Card key={option.id} className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">{option.label}</CardTitle>
              <p className="text-xs text-muted-foreground">{option.displayType === 'swatch' ? 'Renk seçimi' : 'Metin seçimi'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleAddOptionValue(option.id)}>
              <Plus className="mr-2 h-4 w-4" /> Değer Ekle
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-5 space-y-1">
                <Label className="text-xs">Seçenek Başlığı</Label>
                <Input
                  value={option.label}
                  onChange={(event) => handleUpdateOptionMeta(option.id, { label: event.target.value })}
                  placeholder="Örn. Halka Rengi"
                />
              </div>
              <div className="md:col-span-4 space-y-1">
                <Label className="text-xs">Sistem Anahtarı</Label>
                <Input
                  value={option.key}
                  onChange={(event) => handleUpdateOptionMeta(option.id, { key: event.target.value })}
                  placeholder="örn. ringColor"
                />
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label className="text-xs">Gösterim Türü</Label>
                <Select value={option.displayType} onValueChange={(value) => handleUpdateOptionMeta(option.id, { displayType: value as OptionDisplayType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="swatch">Renk</SelectItem>
                    <SelectItem value="pill">Etiket</SelectItem>
                    <SelectItem value="text">Metin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {option.values.length === 0 && (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Bu seçenek için henüz değer eklenmedi.
                </div>
              )}
              {option.values.map((value) => {
                const normalizedValueHex = withFallbackHex(value.hexValue, defaultPaletteHex)
                const selectValue = colorMap.has(normalizedValueHex) ? normalizedValueHex : CUSTOM_COLOR_VALUE

                return (
                  <div key={value.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-12">
                    <div className="md:col-span-4 space-y-1">
                      <Label className="text-xs">Değer Etiketi</Label>
                      <Input
                        value={value.label}
                        onChange={(event) => handleUpdateOptionValue(option.id, value.id, { label: event.target.value })}
                        placeholder="Örn. Gold"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <Label className="text-xs">Sistem Anahtarı</Label>
                      <Input
                        value={value.value}
                        onChange={(event) => handleUpdateOptionValue(option.id, value.id, { value: event.target.value })}
                        placeholder="örn. gold"
                      />
                    </div>
                    {option.displayType === 'swatch' && (
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs">Renk</Label>
                        {hasPalette ? (
                          <Select
                            value={selectValue}
                            onValueChange={(selected) => {
                              if (selected === CUSTOM_COLOR_VALUE) return
                              handleUpdateOptionValue(option.id, value.id, { hexValue: selected })
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Renk seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {colorPalette.map(({ hex, name }) => (
                                <SelectItem key={hex} value={hex}>
                                  <span className="inline-flex items-center gap-2">
                                    <span
                                      className="h-4 w-4 rounded-full border"
                                      style={{ backgroundColor: hex }}
                                    />
                                    <span>
                                      {name} ({hex})
                                    </span>
                                  </span>
                                </SelectItem>
                              ))}
                              {selectValue === CUSTOM_COLOR_VALUE && (
                                <SelectItem value={CUSTOM_COLOR_VALUE} disabled>
                                  {`Özel renk (${normalizedValueHex})`}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              className="h-10 w-full rounded-md border"
                              value={normalizedValueHex}
                              onChange={(event) => handleUpdateOptionValue(option.id, value.id, { hexValue: event.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="md:col-span-2 flex items-end justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveOptionValue(option.id, value.id)}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Sil</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
  </div>
  )

  const renderVariantsTable = () => (
    <div className="space-y-4">
      {builderState.variants.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Henüz hiç varyasyon oluşturulmadı. Şablondaki değerleri doldurduktan sonra “Kombinasyonları Oluştur” butonuna basın.
        </div>
      ) : (
        <div className="space-y-3">
          {builderState.variants.map((variant) => {
            const selectionLabels = variant.optionSelections
              .map((selection) => {
                const option = builderState.options.find((opt) => opt.id === selection.optionId)
                const value = option?.values.find((val) => val.id === selection.valueId)
                if (!option || !value) return null
                return `${option.label}: ${value.label || value.value}`
              })
              .filter(Boolean) as string[]
            const normalizedBadgeHex = withFallbackHex(variant.badgeHex, defaultPaletteHex)
            const badgeSelectValue = colorMap.has(normalizedBadgeHex) ? normalizedBadgeHex : CUSTOM_COLOR_VALUE

            return (
              <Card key={variant.id} className={cn('border shadow-sm transition', !variant.isActive && 'opacity-60')}
              >
                <CardHeader className="flex flex-col gap-3 space-y-0 border-b bg-muted/20 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold">
                      {variant.title || 'Varyant'}
                    </CardTitle>
                    {selectionLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectionLabels.map((label) => (
                          <Badge key={label} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={builderState.defaultVariantId === variant.id ? 'default' : 'outline'}
                      onClick={() => handleSetDefaultVariant(variant.id)}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" /> Varsayılan
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveVariant(variant.id)}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Varyantı sil</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 py-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-5 space-y-1">
                      <Label className="text-xs">Başlık</Label>
                      <Input
                        value={variant.title}
                        onChange={(event) => handleUpdateVariant(variant.id, { title: event.target.value })}
                        placeholder="Örn. Gold Halkalı"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-xs">Stok</Label>
                      <Input
                        type="number"
                        value={variant.stock ?? 0}
                        onChange={(event) => handleUpdateVariant(variant.id, { stock: Number(event.target.value) })}
                        min={0}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-xs">SKU</Label>
                      <Input
                        value={variant.sku ?? ''}
                        onChange={(event) => handleUpdateVariant(variant.id, { sku: event.target.value })}
                        placeholder="Opsiyonel"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-xs">Etiket Rengi</Label>
                      {hasPalette ? (
                        <Select
                          value={badgeSelectValue}
                          onValueChange={(selected) => {
                            if (selected === CUSTOM_COLOR_VALUE) return
                            handleUpdateVariant(variant.id, { badgeHex: selected })
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Renk seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {colorPalette.map(({ hex, name }) => (
                              <SelectItem key={hex} value={hex}>
                                <span className="inline-flex items-center gap-2">
                                  <span
                                    className="h-4 w-4 rounded-full border"
                                    style={{ backgroundColor: hex }}
                                  />
                                  <span>
                                    {name} ({hex})
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                            {badgeSelectValue === CUSTOM_COLOR_VALUE && (
                              <SelectItem value={CUSTOM_COLOR_VALUE} disabled>
                                {`Özel renk (${normalizedBadgeHex})`}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <input
                          type="color"
                          className="h-10 w-full cursor-pointer rounded-md border"
                          value={normalizedBadgeHex}
                          onChange={(event) => handleUpdateVariant(variant.id, { badgeHex: event.target.value })}
                        />
                      )}
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={variant.isActive}
                          onCheckedChange={(checked) => handleUpdateVariant(variant.id, { isActive: checked })}
                        />
                        <span className="text-xs text-muted-foreground">Aktif</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Açıklama</Label>
                    <Textarea
                      value={variant.description ?? ''}
                      onChange={(event) => handleUpdateVariant(variant.id, { description: event.target.value })}
                      rows={2}
                      placeholder="Bu varyanta özel açıklama"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderVariantsStep = () => (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Varyasyon Yönetimi</CardTitle>
            <p className="text-xs text-muted-foreground">
              Ürünün farklı renk, renk kombinasyonu veya özelliklerini tek ürün altında yönetin.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">Varyasyonlar</span>
            <Switch
              checked={builderState.hasVariants}
              onCheckedChange={(checked) =>
                setBuilderState((prev) =>
                  checked
                    ? { ...prev, hasVariants: true }
                    : { ...createBlankBuilderState(), sharedImages: prev.sharedImages },
                )
              }
            />
          </div>
        </CardHeader>
        {builderState.hasVariants ? (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Şablon Seç</Label>
                <Select
                  value={builderState.templateId}
                  onValueChange={(value) => {
                    const template = PRODUCT_TEMPLATES.find((item) => item.id === value)
                    if (template) {
                      applyTemplate(template)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bir şablon seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Şablon seçtikten sonra değerleri düzenleyebilir veya yeni seçenekler ekleyebilirsiniz.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Manuel Seçenek Ekle</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setBuilderState((prev) => ({
                        ...prev,
                        hasVariants: true,
                        options: [
                          ...prev.options,
                          {
                            id: crypto.randomUUID(),
                            key: `option_${prev.options.length + 1}`,
                            label: `Yeni Seçenek ${prev.options.length + 1}`,
                            displayType: 'text',
                            sortOrder: prev.options.length,
                            values: [],
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" /> Yeni Seçenek
                  </Button>
                </div>
              </div>
            </div>

            {renderOptionsEditor()}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="text-xs text-muted-foreground">
                Seçenek değerlerini belirledikten sonra kombinasyonları oluşturun. Var olan varyantlar korunur.
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleGenerateVariants}>
                  <Sparkles className="mr-2 h-4 w-4" /> Kombinasyonları Oluştur
                </Button>
              </div>
            </div>

            {renderVariantsTable()}
          </CardContent>
        ) : (
          <CardContent>
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Bu ürün için varyasyon yönetimi kapalı. Açmak için anahtarı aktif edin.
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )

  const renderPersonalizationStep = () => {
    const activeFieldKeys = new Set(personalizationState.fields.map((field) => field.key))
    const sortedFields = personalizationState.fields.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    const catalogFieldEnabled = activeFieldKeys.has('tagTemplate')
    const selectedTemplateIds = new Set(personalizationState.settings.catalogTemplates.map((template) => template.id))
    const allTemplatesSelected = selectedTemplateIds.size === PERSONALIZATION_CATALOG_TEMPLATES.length

    return (
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Kişiselleştirme Ayarları</CardTitle>
              <p className="text-xs text-muted-foreground">
                Müşteriden hangi bilgileri toplayacağınızı belirleyin. Etkinleştirdiğinizde ürün müşteriye iki adımda sunulur.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">Kişiselleştirme</span>
              <Switch checked={personalizationState.enabled} onCheckedChange={handleTogglePersonalizationEnabled} />
            </div>
          </CardHeader>
          {personalizationState.enabled && (
            <CardContent className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Alanlar tamamlanmadan sepete eklenemez</p>
                  <p className="text-xs text-muted-foreground">Müşteri tüm kişiselleştirme adımlarını doldurmak zorunda.</p>
                </div>
                <Switch
                  checked={personalizationState.requireCompletion}
                  onCheckedChange={(checked) =>
                    setPersonalizationState((prev) => ({ ...prev, requireCompletion: checked }))
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Önce katalog sonra boyut seçilsin</p>
                  <p className="text-xs text-muted-foreground">Katalog alanı aktifse müşteri önce tasarımı seçer.</p>
                </div>
                <Switch
                  checked={personalizationState.settings.requireCatalogBeforeSize}
                  onCheckedChange={(checked) =>
                    setPersonalizationState((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, requireCatalogBeforeSize: checked },
                    }))
                  }
                />
              </label>
            </CardContent>
          )}
        </Card>

        {personalizationState.enabled && (
          <>
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Talep Edilecek Bilgiler</CardTitle>
                <p className="text-xs text-muted-foreground">Müşteriden hangi alanları soracağınızı seçin.</p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {PERSONALIZATION_FIELD_PRESETS.map((preset) => {
                  const isActive = activeFieldKeys.has(preset.key)
                  return (
                    <div key={preset.key} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="pr-4">
                        <p className="text-sm font-medium">{preset.label}</p>
                        {preset.helperText && <p className="text-xs text-muted-foreground">{preset.helperText}</p>}
                      </div>
                      <Switch checked={isActive} onCheckedChange={(checked) => handleTogglePersonalizationField(preset.key, checked)} />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {sortedFields.map((field) => {
              const isSelect = field.type === 'select'
              const isCatalog = field.type === 'catalog'
              const fieldOptions = field.options || []
              return (
                <Card key={field.id} className="border shadow-sm">
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        {field.label}
                        <Badge variant="secondary" className="text-[10px] uppercase">{field.type}</Badge>
                      </CardTitle>
                      {field.helperText && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch
                          checked={field.isRequired}
                          onCheckedChange={(checked) => handleUpdatePersonalizationField(field.id, { isRequired: checked })}
                        />
                        Zorunlu alan
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePersonalizationField(field.key, false)}
                      >
                        <X className="mr-1 h-4 w-4" /> Kaldır
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Alan Başlığı</Label>
                        <Input
                          value={field.label}
                          onChange={(event) => handleUpdatePersonalizationField(field.id, { label: event.target.value })}
                        />
                      </div>
                      {field.type !== 'catalog' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Yardım Metni</Label>
                          <Input
                            value={field.helperText ?? ''}
                            onChange={(event) => handleUpdatePersonalizationField(field.id, { helperText: event.target.value })}
                          />
                        </div>
                      )}
                      {(field.type === 'text' || field.type === 'textarea') && (
                        <div className="space-y-1">
                          <Label className="text-xs">Placeholder</Label>
                          <Input
                            value={field.placeholder ?? ''}
                            onChange={(event) => handleUpdatePersonalizationField(field.id, { placeholder: event.target.value })}
                          />
                        </div>
                      )}
                    </div>

                    {isSelect && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Seçenekler</Label>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleAddSelectOption(field.id)}>
                            <Plus className="mr-2 h-4 w-4" /> Seçenek Ekle
                          </Button>
                        </div>
                        {fieldOptions.length === 0 ? (
                          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                            Henüz seçenek eklenmedi.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {fieldOptions.map((option, index) => (
                              <div key={option.value} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-12">
                                <div className="md:col-span-5 space-y-1">
                                  <Label className="text-[11px] uppercase text-muted-foreground">Etiket</Label>
                                  <Input
                                    value={option.label}
                                    onChange={(event) => handleUpdateSelectOption(field.id, index, { label: event.target.value })}
                                  />
                                </div>
                                <div className="md:col-span-5 space-y-1">
                                  <Label className="text-[11px] uppercase text-muted-foreground">Değer</Label>
                                  <Input
                                    value={option.value}
                                    onChange={(event) => handleUpdateSelectOption(field.id, index, { value: event.target.value })}
                                  />
                                </div>
                                <div className="md:col-span-2 flex items-end justify-end">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSelectOption(field.id, index)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {isCatalog && (
                      <div className="space-y-2 text-xs text-muted-foreground">
                        Müşteri bu alanda tasarım kataloğunu açıp şablon seçebilir. Aşağıdaki listeden hangi şablonların gösterileceğini belirleyebilirsiniz.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )})}

            {catalogFieldEnabled && (
              <Card className="border shadow-sm">
                <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Etiket Tasarım Kataloğu</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Müşteriye göstermek istediğiniz hazır tasarımları seçin. En az bir şablon seçili olmalıdır.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleSelectAllCatalogTemplates}>
                      Tümünü Seç
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={handleClearCatalogTemplates}>
                      En Popülerle Başla
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {PERSONALIZATION_CATALOG_TEMPLATES.map((template) => {
                      const isSelected = selectedTemplateIds.has(template.id)
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleToggleCatalogTemplate(template)}
                          className={cn(
                            'group flex h-full flex-col overflow-hidden rounded-lg border text-left transition',
                            isSelected ? 'border-rose-500 shadow-md' : 'border-muted hover:border-rose-300',
                          )}
                        >
                          <div className="relative h-32 w-full bg-muted">
                            <span className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
                              {template.imageUrl ? 'Önizleme' : 'Görsel bulunamadı'}
                            </span>
                          </div>
                          <div className="flex flex-1 flex-col gap-1 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{template.title}</span>
                              <Badge variant={isSelected ? 'default' : 'outline'} className="text-[10px] uppercase">
                                {isSelected ? 'Seçili' : 'Pasif'}
                              </Badge>
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
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seçili şablon sayısı: {selectedTemplateIds.size} / {PERSONALIZATION_CATALOG_TEMPLATES.length}
                    {!allTemplatesSelected && '  - Dilerseniz kalan şablonları da etkinleştirebilirsiniz.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    )
  }

  const renderMediaStep = () => (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col gap-1 space-y-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ImagePlus className="h-4 w-4" /> Ortak Görseller
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Bu görseller ürün kartlarında ve varsayılan varyantta gösterilir. Tüm varyasyonlar için genel görseller ekleyin.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageKitUpload
            onUploadSuccess={handleSharedImageUpload}
            onUploadError={(uploadError) => setError(uploadError)}
            folder="products"
            multiple
            maxFiles={20}
            maxSize={5 * 1024 * 1024}
            acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
          />
          {builderState.sharedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {builderState.sharedImages
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((image, index) => (
                  <div key={image.id} className="group relative overflow-hidden rounded-lg border">
                    <ImageKitImage src={image.url} alt={image.alt || `Ürün görseli ${index + 1}`} preset="thumbnail" className="h-40 w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1 text-xs text-white">
                      <span>Sıra {index + 1}</span>
                      <button type="button" className="opacity-80 hover:opacity-100" onClick={() => handleSharedImageRemove(image.id)}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {builderState.hasVariants && builderState.variants.length > 0 && (
        <div className="space-y-4">
          {builderState.variants.map((variant) => (
            <Card key={variant.id} className="border shadow-sm">
              <CardHeader className="flex flex-col gap-1 space-y-0 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">{variant.title || 'Varyant'}</CardTitle>
                  <p className="text-xs text-muted-foreground">Bu varyanta özel görseller ekleyin.</p>
                </div>
                {builderState.defaultVariantId === variant.id && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Varsayılan Varyant
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageKitUpload
                  onUploadSuccess={(asset) => handleVariantImageUpload(variant.id, asset)}
                  onUploadError={(uploadError) => setError(uploadError)}
                  folder="products/variants"
                  multiple
                  maxFiles={10}
                  maxSize={5 * 1024 * 1024}
                  acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                />
                {variant.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {variant.images
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((image, index) => (
                        <div key={image.id} className="group relative overflow-hidden rounded-lg border">
                          <ImageKitImage src={image.url} alt={image.alt || `${variant.title} görseli ${index + 1}`} preset="thumbnail" className="h-40 w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1 text-xs text-white">
                            <span>Sıra {index + 1}</span>
                            <button type="button" className="opacity-80 hover:opacity-100" onClick={() => handleVariantImageRemove(variant.id, image.id)}>
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <form onSubmit={handleFormSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {stepLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => goToStep(index)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-medium transition',
              index === activeStep ? 'bg-rose-600 text-white shadow' : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {activeStep === 0 && renderGeneralStep()}
        {activeStep === 1 && renderVariantsStep()}
        {activeStep === 2 && renderPersonalizationStep()}
        {activeStep === 3 && renderMediaStep()}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" disabled={activeStep === 0} onClick={() => goToStep(Math.max(activeStep - 1, 0))}>
          Geri
        </Button>
        <div className="ml-auto flex items-center gap-3">
          {activeStep < stepLabels.length - 1 ? (
            <Button type="button" onClick={() => goToStep(Math.min(activeStep + 1, stepLabels.length - 1))}>
              İleri
            </Button>
          ) : (
            <Button type="button" onClick={handleFinalSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor...' : product ? 'Güncelle' : 'Oluştur'}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
