'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { randomUUID } from 'crypto'
import {
  ProductWithCategory,
  SimpleProduct,
  FeaturedProduct,
  ProductWithVariants,
  convertSupabaseToProductWithCategory,
  convertToSimpleProduct,
  convertToFeaturedProduct,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from '@/types/product'
import type {
  PersonalizationConfig,
  PersonalizationField,
  PersonalizationFieldOption,
  PersonalizationConfigSettings,
  PersonalizationFieldType,
} from '@/types/personalization'

const VARIANT_OPTION_TYPES = ['swatch', 'pill', 'text'] as const

type VariantOptionDisplayType = typeof VARIANT_OPTION_TYPES[number]

type BuilderImageInput = {
  id?: string
  url: string
  fileId?: string | null
  alt?: string | null
  sortOrder?: number
}

type VariantOptionSelectionDraft = {
  optionId: string
  valueId: string
}

type VariantDraft = {
  id: string
  title: string
  description?: string | null
  sku?: string | null
  stock?: number | null
  isActive: boolean
  sortOrder: number
  badgeHex?: string | null
  optionSelections: VariantOptionSelectionDraft[]
  images?: BuilderImageInput[]
  isDefault?: boolean
}

type OptionValueDraft = {
  id: string
  value: string
  label: string
  hexValue?: string | null
  sortOrder?: number
}

type OptionDraft = {
  id: string
  key: string
  label: string
  displayType: VariantOptionDisplayType
  sortOrder: number
  values: OptionValueDraft[]
}

type VariantStatePayload = {
  hasVariants: boolean
  cardTitle?: string | null
  options: OptionDraft[]
  variants: VariantDraft[]
  sharedImages?: BuilderImageInput[]
  defaultVariantClientId?: string | null
}

type PersonalizationFieldDraft = {
  id: string
  key: string
  label: string
  type: PersonalizationFieldType
  placeholder?: string | null
  helperText?: string | null
  isRequired?: boolean
  sortOrder?: number
  options?: PersonalizationFieldOption[]
  metadata?: Record<string, any> | null
}

type PersonalizationStatePayload = {
  enabled: boolean
  requireCompletion?: boolean
  stepCount?: number
  settings?: PersonalizationConfigSettings | null
  fields: PersonalizationFieldDraft[]
}

const buildOptionValueKey = (
  selections: Array<{ optionId: string; valueId: string }>,
  optionOrder: string[],
): string => {
  if (selections.length === 0) return ''

  const ordering = new Map(optionOrder.map((id, index) => [id, index]))

  return selections
    .slice()
    .sort((a, b) => {
      const indexA = ordering.get(a.optionId) ?? Number.MAX_SAFE_INTEGER
      const indexB = ordering.get(b.optionId) ?? Number.MAX_SAFE_INTEGER

      if (indexA !== indexB) {
        return indexA - indexB
      }

      const optionComparison = a.optionId.localeCompare(b.optionId)
      if (optionComparison !== 0) {
        return optionComparison
      }

      return a.valueId.localeCompare(b.valueId)
    })
    .map(({ optionId, valueId }) => `${optionId}:${valueId}`)
    .join('|')
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const parseVariantState = (raw: FormDataEntryValue | null): VariantStatePayload | null => {
  if (!raw || typeof raw !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as VariantStatePayload
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return {
      hasVariants: Boolean(parsed.hasVariants),
      cardTitle: parsed.cardTitle ?? null,
      options: Array.isArray(parsed.options) ? parsed.options : [],
      variants: Array.isArray(parsed.variants) ? parsed.variants : [],
      sharedImages: Array.isArray(parsed.sharedImages) ? parsed.sharedImages : [],
      defaultVariantClientId: parsed.defaultVariantClientId ?? null,
    }
  } catch (error) {
    logger.error('[products.parseVariantState] invalid JSON', error)
    return null
  }
}

const parsePersonalizationState = (raw: FormDataEntryValue | null): PersonalizationStatePayload | null => {
  if (!raw || typeof raw !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as PersonalizationStatePayload
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const fieldsInput = Array.isArray((parsed as any).fields) ? (parsed as any).fields : []
    const fields = fieldsInput
      .map((field: any) => {
        if (!field || typeof field !== 'object') {
          return null
        }

        const key = typeof field.key === 'string' ? field.key : ''
        const label = typeof field.label === 'string' ? field.label : key
        const type = typeof field.type === 'string' ? field.type : null

        if (!key || !label || !type) {
          return null
        }

        const options = Array.isArray(field.options)
          ? field.options
              .map((option: any) => {
                if (!option || typeof option !== 'object') {
                  return null
                }

                const value = typeof option.value === 'string' ? option.value : null
                const optionLabel = typeof option.label === 'string' ? option.label : value

                if (!value || !optionLabel) {
                  return null
                }

                return {
                  value,
                  label: optionLabel,
                  description: typeof option.description === 'string' ? option.description : undefined,
                  imageUrl: typeof option.imageUrl === 'string' ? option.imageUrl : undefined,
                  metadata: option.metadata && typeof option.metadata === 'object' ? option.metadata : null,
                } as PersonalizationFieldOption
              })
              .filter(Boolean)
          : undefined

        return {
          id: typeof field.id === 'string' ? field.id : key,
          key,
          label,
          type: type as PersonalizationFieldType,
          placeholder: typeof field.placeholder === 'string' ? field.placeholder : undefined,
          helperText: typeof field.helperText === 'string' ? field.helperText : undefined,
          isRequired: Boolean(field.isRequired),
          sortOrder: typeof field.sortOrder === 'number' ? field.sortOrder : undefined,
          options,
          metadata: field.metadata && typeof field.metadata === 'object' ? field.metadata : null,
        }
      })
      .filter(Boolean) as PersonalizationFieldDraft[]

    return {
      enabled: Boolean((parsed as any).enabled),
      requireCompletion:
        (parsed as any).requireCompletion === undefined ? true : Boolean((parsed as any).requireCompletion),
      stepCount: typeof (parsed as any).stepCount === 'number' ? (parsed as any).stepCount : 2,
      settings: (parsed as any).settings && typeof (parsed as any).settings === 'object' ? (parsed as any).settings : null,
      fields,
    }
  } catch (error) {
    logger.error('[products.parsePersonalizationState] invalid JSON', error)
    return null
  }
}

const parseImageList = (raw: FormDataEntryValue | null): BuilderImageInput[] => {
  if (!raw || typeof raw !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((item) => item && typeof item === 'object' && typeof item.url === 'string')
      .map((item) => ({
        id: item.id,
        url: item.url,
        fileId: item.fileId ?? null,
        alt: item.alt ?? null,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : undefined,
      }))
  } catch (error) {
    logger.error('[products.parseImageList] invalid JSON', error)
    return []
  }
}

interface PersistVariantResult {
  defaultVariantId: string | null
  totalStock: number
  variantOrder: string[]
  variantImages: Array<{
    id: string
    productId: string
    variantId: string | null
    url: string
    fileId: string | null
    alt: string | null
    sortOrder: number
    createdAt: string
  }>
}

interface PersistPersonalizationResult {
  isPersonalizable: boolean
  configId: string | null
}

const hydrateProductWithVariants = async (
  supabase: SupabaseClient,
  product: any,
): Promise<ProductWithVariants> => {
  const [optionsRes, variantsRes] = await Promise.all([
    supabase
      .from('product_options')
      .select(`
        id,
        productId,
        key,
        label,
        displayType,
        sortOrder,
        product_option_values(id, optionId, value, label, hexValue, sortOrder)
      `)
      .eq('productId', product.id)
      .order('sortOrder', { ascending: true }),
    supabase
      .from('product_variants')
      .select(`
        id,
        productId,
        title,
        description,
        sku,
        stock,
        isActive,
        sortOrder,
        optionValueKey,
        badgeHex,
        product_variant_options(optionId, valueId)
      `)
      .eq('productId', product.id)
      .order('sortOrder', { ascending: true }),
  ])

  const optionsData = optionsRes.data ?? []
  const variantsData = variantsRes.data ?? []

  // Fetch personalization config gracefully (table may not exist in some deployments)
  let personalizationRow: any = null
  try {
    const personalizationRes = await supabase
      .from('product_personalization_configs')
      .select(`
        id,
        productId,
        requireCompletion,
        stepCount,
        settings,
        createdAt,
        updatedAt,
        fields:product_personalization_fields(
          id,
          configId,
          key,
          label,
          type,
          placeholder,
          helperText,
          isRequired,
          sortOrder,
          options,
          metadata,
          createdAt,
          updatedAt
        )
      `)
      .eq('productId', product.id)
      .maybeSingle()

    if (personalizationRes.error) {
      // Ignore missing table errors silently; otherwise log as warning
      if (personalizationRes.error.code === 'PGRST205') {
        // table not found → treat as no personalization config
        personalizationRow = null
      } else {
        logger.warn('[products.hydrateProductWithVariants] personalization fetch warning', personalizationRes.error)
      }
    } else {
      personalizationRow = personalizationRes.data ?? null
    }
  } catch (_e) {
    // Non-fatal: treat as not personalizable
    personalizationRow = null
  }
  let personalizationConfig: PersonalizationConfig | null = null

  if (personalizationRow) {
    const fieldsRaw = Array.isArray(personalizationRow.fields) ? personalizationRow.fields : []
    const fields: PersonalizationField[] = fieldsRaw
      .map((field: any) => {
        if (!field) {
          return null
        }

        const options = Array.isArray(field.options)
          ? field.options
              .map((option: any) => {
                if (!option || typeof option !== 'object') {
                  return null
                }

                const value = typeof option.value === 'string' ? option.value : null
                const label = typeof option.label === 'string' ? option.label : value

                if (!value || !label) {
                  return null
                }

                return {
                  value,
                  label,
                  description: typeof option.description === 'string' ? option.description : undefined,
                  imageUrl: typeof option.imageUrl === 'string' ? option.imageUrl : undefined,
                  metadata: option.metadata && typeof option.metadata === 'object' ? option.metadata : null,
                } satisfies PersonalizationFieldOption
              })
              .filter((option): option is PersonalizationFieldOption => Boolean(option))
          : undefined

        return {
          id: field.id,
          key: field.key,
          label: field.label,
          type: field.type,
          placeholder: field.placeholder ?? undefined,
          helperText: field.helperText ?? undefined,
          isRequired: Boolean(field.isRequired),
          sortOrder: field.sortOrder ?? 0,
          options,
          metadata: field.metadata ?? null,
        } satisfies PersonalizationField
      })
      .filter(Boolean)
      .sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0)) as PersonalizationField[]

    personalizationConfig = {
      id: personalizationRow.id,
      productId: personalizationRow.productId,
      requireCompletion: personalizationRow.requireCompletion ?? true,
      stepCount: personalizationRow.stepCount ?? 2,
      settings:
        personalizationRow.settings && typeof personalizationRow.settings === 'object'
          ? personalizationRow.settings
          : undefined,
      fields,
      createdAt: personalizationRow.createdAt ?? undefined,
      updatedAt: personalizationRow.updatedAt ?? undefined,
    }
  }

  const options = optionsData.map((option) => ({
    id: option.id,
    productId: option.productId,
    key: option.key,
    label: option.label,
    displayType: option.displayType,
    sortOrder: option.sortOrder ?? 0,
    values: (option.product_option_values || []).map((value: any) => ({
      id: value.id,
      optionId: value.optionId,
      value: value.value,
      label: value.label,
      hexValue: value.hexValue ?? null,
      sortOrder: value.sortOrder ?? 0,
      media: null,
    })),
  }))

  const valueLookup = new Map<string, { optionId: string; optionKey: string; optionLabel: string; valueId: string; valueLabel: string; hexValue?: string | null }>()
  for (const option of options) {
    for (const value of option.values || []) {
      valueLookup.set(value.id, {
        optionId: option.id,
        optionKey: option.key,
        optionLabel: option.label,
        valueId: value.id,
        valueLabel: value.label,
        hexValue: value.hexValue ?? null,
      })
    }
  }

  const productImages = Array.isArray(product.product_images)
    ? product.product_images
        .slice()
        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((image: any) => ({
          id: image.id,
          url: image.url,
          alt: image.alt ?? null,
          sortOrder: image.sortOrder ?? 0,
          variantId: image.variantId ?? null,
        }))
    : []

  const variants = variantsData.map((variant) => {
    const selections = Array.isArray(variant.product_variant_options) ? variant.product_variant_options : []
    const optionValues = selections
      .map((selection: any) => {
        const mapped = valueLookup.get(selection.valueId)
        if (!mapped) {
          return null
        }
        return {
          optionId: mapped.optionId,
          optionKey: mapped.optionKey,
          optionLabel: mapped.optionLabel,
          valueId: mapped.valueId,
          valueLabel: mapped.valueLabel,
          hexValue: mapped.hexValue ?? undefined,
        }
      })
      .filter(Boolean) as ProductVariant['optionValues']

    const variantImages = productImages
      .filter((image) => image.variantId === variant.id)
      .map((image) => ({ ...image }))

    return {
      id: variant.id,
      productId: variant.productId,
      title: variant.title,
      description: variant.description ?? null,
      sku: variant.sku ?? null,
      stock: variant.stock ?? 0,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder ?? 0,
      optionValueKey: variant.optionValueKey,
      badgeHex: variant.badgeHex ?? null,
      optionValues,
      images: variantImages,
    }
  })

  const imagesForProduct = productImages.map((image) => ({ ...image }))

  return {
    ...product,
    price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
    oldPrice: typeof product.oldPrice === 'string' ? parseFloat(product.oldPrice) : product.oldPrice,
    images: imagesForProduct,
    product_images: imagesForProduct,
    options,
    variants,
    personalizationConfig,
    isPersonalizable: Boolean(product.isPersonalizable ?? personalizationConfig),
  }
}

const persistVariantGraph = async (
  supabase: SupabaseClient,
  productId: string,
  state: VariantStatePayload,
  now: string,
  defaultVariantClientId?: string | null,
): Promise<PersistVariantResult> => {
  if (!state.hasVariants || state.variants.length === 0) {
    return {
      defaultVariantId: null,
      totalStock: 0,
      variantOrder: [],
      variantImages: [],
    }
  }

  const optionIdMap = new Map<string, string>()
  const valueIdMap = new Map<string, string>()
  const variantIdMap = new Map<string, string>()

  const sortedOptions = [...state.options].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const optionRecords = sortedOptions.map((option) => {
    const optionId = randomUUID()
    optionIdMap.set(option.id, optionId)
    return {
      id: optionId,
      productId,
      key: option.key,
      label: option.label,
      displayType: VARIANT_OPTION_TYPES.includes(option.displayType) ? option.displayType : 'swatch',
      sortOrder: option.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    }
  })

  if (optionRecords.length > 0) {
    const { error } = await supabase.from('product_options').insert(optionRecords as Partial<ProductOption>[]) // cast for Supabase typing
    if (error) {
      throw error
    }
  }

  const valueRecords: Array<Partial<ProductOptionValue>> = []
  for (const option of sortedOptions) {
    const optionId = optionIdMap.get(option.id)
    if (!optionId) continue

    const valuesSorted = [...(option.values || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    for (const value of valuesSorted) {
      const valueId = randomUUID()
      valueIdMap.set(value.id, valueId)
      valueRecords.push({
        id: valueId,
        optionId,
        value: value.value,
        label: value.label,
        hexValue: value.hexValue ?? null,
        sortOrder: value.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  if (valueRecords.length > 0) {
    const { error } = await supabase.from('product_option_values').insert(valueRecords)
    if (error) {
      throw error
    }
  }

  const variantRecords: Array<Partial<ProductVariant>> = []
  const variantOptionRecords: Array<{ id: string; variantId: string; optionId: string; valueId: string; createdAt: string }> = []
  const variantImages: PersistVariantResult['variantImages'] = []

  const variantsSorted = [...state.variants].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const optionOrder = optionRecords.map((option) => option.id as string)

  for (const variant of variantsSorted) {
    const variantId = randomUUID()
    variantIdMap.set(variant.id, variantId)

    const selectionPairs: Array<{ optionId: string; valueId: string }> = []
    for (const selection of variant.optionSelections || []) {
      const mappedOptionId = optionIdMap.get(selection.optionId)
      const mappedValueId = valueIdMap.get(selection.valueId)
      if (!mappedOptionId || !mappedValueId) {
        continue
      }
      selectionPairs.push({ optionId: mappedOptionId, valueId: mappedValueId })
      variantOptionRecords.push({
        id: randomUUID(),
        variantId,
        optionId: mappedOptionId,
        valueId: mappedValueId,
        createdAt: now,
      })
    }

    const optionValueKey = selectionPairs.length > 0 ? buildOptionValueKey(selectionPairs, optionOrder) : variantId

    variantRecords.push({
      id: variantId,
      productId,
      title: variant.title,
      description: variant.description ?? null,
      sku: variant.sku ?? null,
      stock: variant.stock ?? 0,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder ?? 0,
      optionValueKey,
      badgeHex: variant.badgeHex ?? null,
      createdAt: now,
      updatedAt: now,
    })

    const variantImagesSorted = [...(variant.images || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    let localIndex = 0
    for (const image of variantImagesSorted) {
      variantImages.push({
        id: randomUUID(),
        productId,
        variantId,
        url: image.url,
        fileId: image.fileId ?? null,
        alt: image.alt ?? `${variant.title} görseli ${localIndex + 1}`,
        sortOrder: 0,
        createdAt: now,
      })
      localIndex += 1
    }
  }

  if (variantRecords.length > 0) {
    const { error } = await supabase.from('product_variants').insert(variantRecords)
    if (error) {
      throw error
    }
  }

  if (variantOptionRecords.length > 0) {
    const { error } = await supabase.from('product_variant_options').insert(variantOptionRecords)
    if (error) {
      throw error
    }
  }

  // Recalculate global sort order for images (variant groups stay together)
  let sortCursor = 0
  const variantOrder: string[] = []
  const imagesGroupedByVariant = new Map<string, PersistVariantResult['variantImages']>()

  for (const payload of variantImages) {
    const list = imagesGroupedByVariant.get(payload.variantId || '') || []
    list.push(payload)
    imagesGroupedByVariant.set(payload.variantId || '', list)
  }

  const finalVariantImages: PersistVariantResult['variantImages'] = []
  for (const variant of variantsSorted) {
    const variantId = variantIdMap.get(variant.id)
    if (!variantId) continue
    variantOrder.push(variantId)
    const group = (imagesGroupedByVariant.get(variantId) || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    for (const image of group) {
      finalVariantImages.push({ ...image, sortOrder: sortCursor++ })
    }
  }

  const defaultVariantId = defaultVariantClientId && variantIdMap.get(defaultVariantClientId)
    ? variantIdMap.get(defaultVariantClientId) ?? variantOrder[0] ?? null
    : variantOrder[0] ?? null

  const totalStock = variantsSorted.reduce((acc, variant) => acc + Math.max(variant.stock ?? 0, 0), 0)

  return {
    defaultVariantId: defaultVariantId ?? null,
    totalStock,
    variantOrder,
    variantImages: finalVariantImages,
  }
}

const persistPersonalizationGraph = async (
  supabase: SupabaseClient,
  productId: string,
  state: PersonalizationStatePayload | null,
  now: string,
): Promise<PersistPersonalizationResult> => {
  if (!state || !state.enabled || (state.fields?.length ?? 0) === 0) {
    await supabase.from('product_personalization_configs').delete().eq('productId', productId)
    return {
      isPersonalizable: false,
      configId: null,
    }
  }

  const configId = randomUUID()
  const requireCompletion = state.requireCompletion !== false
  const stepCount = typeof state.stepCount === 'number' ? state.stepCount : 2
  const settings = state.settings && typeof state.settings === 'object' ? state.settings : null

  await supabase.from('product_personalization_configs').delete().eq('productId', productId)

  const { error: configError } = await supabase
    .from('product_personalization_configs')
    .insert({
      id: configId,
      productId,
      requireCompletion,
      stepCount,
      settings: settings ?? {},
      createdAt: now,
      updatedAt: now,
    })

  if (configError) {
    throw configError
  }

  const fieldsSorted = [...(state.fields || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  if (fieldsSorted.length > 0) {
    const fieldRecords = fieldsSorted.map((field) => ({
      id: randomUUID(),
      configId,
      key: field.key,
      label: field.label,
      type: field.type,
      placeholder: field.placeholder ?? null,
      helperText: field.helperText ?? null,
      isRequired: Boolean(field.isRequired),
      sortOrder: field.sortOrder ?? 0,
      options: field.options && field.options.length > 0 ? field.options : null,
      metadata: field.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    }))

    const { error: fieldError } = await supabase
      .from('product_personalization_fields')
      .insert(fieldRecords)

    if (fieldError) {
      throw fieldError
    }
  }

  return {
    isPersonalizable: true,
    configId,
  }
}

const ProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı gereklidir'),
  cardTitle: z.string().min(1, 'Kart başlığı gereklidir'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Fiyat 0 veya daha büyük olmalıdır'),
  oldPrice: z.coerce.number().min(0, 'Eski fiyat 0 veya daha büyük olmalıdır').optional(),
  categoryId: z.string().min(1, 'Kategori seçimi gereklidir'),
  stock: z.coerce.number().min(0, 'Stok 0 veya daha büyük olmalıdır'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isProductOfWeek: z.boolean().default(false),
  productOfWeekCategoryId: z.string().optional(),
  colors: z.array(z.string()).optional(),
})


const CreateProduct = ProductSchema

const UpdateProduct = ProductSchema.partial()

export type State = {
  errors?: {
    name?: string[]
    description?: string[]
    price?: string[]
    oldPrice?: string[]
    categoryId?: string[]
    stock?: string[]
    isActive?: string[]
    isFeatured?: string[]
    isNewArrival?: string[]
    isProductOfWeek?: string[]
    productOfWeekCategoryId?: string[]
  }
  message?: string | null
  ok?: boolean
  productId?: string | null
}

// Create product action
export async function createProduct(prevState: State, formData: FormData): Promise<State> {
  const validationResult = CreateProduct.safeParse({
    name: formData.get('name'),
    cardTitle: formData.get('cardTitle'),
    description: formData.get('description'),
    price: formData.get('price'),
    oldPrice: formData.get('oldPrice') || undefined,
    categoryId: formData.get('categoryId'),
    stock: formData.get('stock'),
    isActive: formData.get('isActive') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    isNewArrival: formData.get('isNewArrival') === 'on',
    isProductOfWeek: formData.get('isProductOfWeek') === 'on',
    productOfWeekCategoryId: formData.get('productOfWeekCategoryId') || undefined,
    colors: undefined,
  })

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
      message: 'Eksik alanlar. Ürün oluşturulamadı.',
      ok: false,
      productId: null,
    }
  }

  const base = validationResult.data
  const variantState = parseVariantState(formData.get('variantState'))
  const personalizationState = parsePersonalizationState(formData.get('personalizationState'))
  const personalizationEnabled = Boolean(personalizationState?.enabled && (personalizationState?.fields?.length ?? 0) > 0)
  const fallbackImages = parseImageList(formData.get('images'))
  const sharedImagesState = variantState?.sharedImages ?? []
  const sharedImages = sharedImagesState.length > 0 ? sharedImagesState : fallbackImages
  const hasVariants = Boolean(variantState?.hasVariants && (variantState?.variants.length ?? 0) > 0)

  let defaultVariantClientId: string | null = null
  let defaultVariantDraft: VariantDraft | undefined

  if (hasVariants && variantState) {
    const fallbackVariant = variantState.variants[0]
    defaultVariantDraft =
      variantState.variants.find((variant) => variant.id === variantState.defaultVariantClientId) ??
      variantState.variants.find((variant) => variant.isDefault) ??
      fallbackVariant
    defaultVariantClientId = defaultVariantDraft?.id ?? null
  }

  const productTitle = hasVariants ? (defaultVariantDraft?.title || base.name) : base.name
  const productDescription = hasVariants
    ? defaultVariantDraft?.description ?? base.description ?? null
    : base.description ?? null

  const colorHexSet = new Set<string>()
  if (hasVariants && variantState) {
    for (const option of variantState.options) {
      if (option.displayType === 'swatch') {
        for (const value of option.values || []) {
          if (value.hexValue) {
            colorHexSet.add(value.hexValue.toLowerCase())
          }
        }
      }
    }
  }

  const slug = generateSlug(base.cardTitle || productTitle)
  const now = new Date().toISOString()
  const productId = randomUUID()
  const supabase = getSupabaseAdmin()

  const { data: insertedProduct, error: insertError } = await supabase
    .from('products')
    .insert({
      id: productId,
      name: productTitle,
      cardTitle: base.cardTitle,
      slug,
      description: productDescription,
      price: (base.price || 0).toString(),
      oldPrice: base.oldPrice ? base.oldPrice.toString() : null,
      categoryId: base.categoryId,
      stock: hasVariants ? 0 : base.stock,
      isActive: base.isActive,
      isFeatured: base.isFeatured,
      isNewArrival: base.isNewArrival,
      isProductOfWeek: base.isProductOfWeek,
      productOfWeekCategoryId: base.productOfWeekCategoryId || null,
      colors: Array.from(colorHexSet),
      hasVariants,
      isPersonalizable: personalizationEnabled,
      defaultVariantId: null,
      createdAt: now,
      updatedAt: now,
    })
    .select('id')
    .single()

  if (insertError || !insertedProduct?.id) {
    logger.error(
      '[products.createProduct] product insert failed',
      insertError ?? new Error('Insert succeeded but no product id returned'),
    )
    return {
      message: 'Database hatası: Ürün oluşturulamadı.',
      ok: false,
      productId: null,
    }
  }

  let defaultVariantId: string | null = null
  let totalStock = hasVariants ? 0 : base.stock
  const imageRecords: PersistVariantResult['variantImages'] = []

  if (hasVariants && variantState) {
    try {
      const variantResult = await persistVariantGraph(
        supabase,
        productId,
        variantState,
        now,
        defaultVariantClientId,
      )

      defaultVariantId = variantResult.defaultVariantId
      totalStock = variantResult.totalStock
      imageRecords.push(...variantResult.variantImages)
    } catch (error) {
      logger.error('[products.createProduct] variant persistence failed', error)
      return {
        message: 'Varyasyonlar kaydedilirken bir hata oluştu.',
        ok: false,
        productId,
      }
    }
  }

  if (sharedImages.length > 0) {
    let sortCursor = imageRecords.length
    const sharedSorted = [...sharedImages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    for (const image of sharedSorted) {
      imageRecords.push({
        id: randomUUID(),
        productId,
        variantId: null,
        url: image.url,
        fileId: image.fileId ?? null,
        alt: image.alt ?? `${base.cardTitle || productTitle} görseli ${sortCursor + 1}`,
        sortOrder: sortCursor,
        createdAt: now,
      })
      sortCursor += 1
    }
  }

  if (!hasVariants && imageRecords.length === 0 && fallbackImages.length > 0) {
    let sortCursor = 0
    const fallbackSorted = [...fallbackImages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    for (const image of fallbackSorted) {
      imageRecords.push({
        id: randomUUID(),
        productId,
        variantId: null,
        url: image.url,
        fileId: image.fileId ?? null,
        alt: image.alt ?? `${base.cardTitle || productTitle} görseli ${sortCursor + 1}`,
        sortOrder: sortCursor,
        createdAt: now,
      })
      sortCursor += 1
    }
  }

  if (imageRecords.length > 0) {
    const { error: imagesError } = await supabase.from('product_images').insert(imageRecords)
    if (imagesError) {
      logger.error('[products.createProduct] product_images insert failed', imagesError)
      return {
        message: 'Görseller kaydedilirken bir hata oluştu.',
        ok: false,
        productId,
      }
    }
  }

  let personalizationResult: PersistPersonalizationResult = {
    isPersonalizable: personalizationEnabled,
    configId: null,
  }

  try {
    personalizationResult = await persistPersonalizationGraph(supabase, productId, personalizationState, now)
  } catch (error) {
    logger.error('[products.createProduct] personalization persistence failed', error)
    return {
      message: 'Kişiselleştirme alanları kaydedilirken bir hata oluştu.',
      ok: false,
      productId,
    }
  }

  const { error: finalUpdateError } = await supabase
    .from('products')
    .update({
      defaultVariantId,
      hasVariants,
      stock: totalStock,
      colors: Array.from(colorHexSet),
      isPersonalizable: personalizationResult.isPersonalizable,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', productId)

  if (finalUpdateError) {
    logger.error('[products.createProduct] post-update failed', finalUpdateError)
    return {
      message: 'Ürün verileri güncellenirken bir hata oluştu.',
      ok: false,
      productId,
    }
  }

  const { data: verification, error: verificationError } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .maybeSingle()

  if (verificationError || !verification?.id) {
    logger.error('[products.createProduct] verification failed', verificationError ?? new Error('Product not found after insert'))
    return {
      message: 'Ürün veritabanında doğrulanamadı.',
      ok: false,
      productId,
    }
  }

  revalidatePath('/admin/products')
  return {
    message: 'Ürün başarıyla oluşturuldu.',
    ok: true,
    productId,
  }
}

// Update product action
export async function updateProduct(
  id: string,
  prevState: State,
  formData: FormData,
): Promise<State> {
  const validationResult = UpdateProduct.safeParse({
    name: formData.get('name'),
    cardTitle: formData.get('cardTitle'),
    description: formData.get('description'),
    price: formData.get('price'),
    oldPrice: formData.get('oldPrice') || undefined,
    categoryId: formData.get('categoryId'),
    stock: formData.get('stock'),
    isActive: formData.get('isActive') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    isNewArrival: formData.get('isNewArrival') === 'on',
    isProductOfWeek: formData.get('isProductOfWeek') === 'on',
    productOfWeekCategoryId: formData.get('productOfWeekCategoryId') || undefined,
    colors: undefined,
  })

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
      message: 'Eksik alanlar. Ürün güncellenemedi.',
      ok: false,
      productId: id,
    }
  }

  const base = validationResult.data
  const variantState = parseVariantState(formData.get('variantState'))
  const personalizationState = parsePersonalizationState(formData.get('personalizationState'))
  const personalizationEnabled = Boolean(personalizationState?.enabled && (personalizationState?.fields?.length ?? 0) > 0)
  const fallbackImages = parseImageList(formData.get('images'))
  const sharedImagesState = variantState?.sharedImages ?? []
  const sharedImages = sharedImagesState.length > 0 ? sharedImagesState : fallbackImages
  const hasVariants = Boolean(variantState?.hasVariants && (variantState?.variants.length ?? 0) > 0)

  let defaultVariantClientId: string | null = null
  let defaultVariantDraft: VariantDraft | undefined

  if (hasVariants && variantState) {
    const fallbackVariant = variantState.variants[0]
    defaultVariantDraft =
      variantState.variants.find((variant) => variant.id === variantState.defaultVariantClientId) ??
      variantState.variants.find((variant) => variant.isDefault) ??
      fallbackVariant
    defaultVariantClientId = defaultVariantDraft?.id ?? null
  }

  const productTitle = hasVariants ? (defaultVariantDraft?.title || base.name) : base.name
  const productDescription = hasVariants
    ? defaultVariantDraft?.description ?? base.description ?? null
    : base.description ?? null

  const colorHexSet = new Set<string>()
  if (hasVariants && variantState) {
    for (const option of variantState.options) {
      if (option.displayType === 'swatch') {
        for (const value of option.values || []) {
          if (value.hexValue) {
            colorHexSet.add(value.hexValue.toLowerCase())
          }
        }
      }
    }
  }

  const slug = generateSlug(base.cardTitle || productTitle)
  const now = new Date().toISOString()
  const supabase = getSupabaseAdmin()

  const { error: updateError } = await supabase
    .from('products')
    .update({
      name: productTitle,
      cardTitle: base.cardTitle ?? null,
      slug,
      description: productDescription,
      price: (base.price || 0).toString(),
      oldPrice: base.oldPrice ? base.oldPrice.toString() : null,
      categoryId: base.categoryId,
      stock: hasVariants ? 0 : base.stock,
      isActive: base.isActive,
      isFeatured: base.isFeatured,
      isNewArrival: base.isNewArrival,
      isProductOfWeek: base.isProductOfWeek,
      productOfWeekCategoryId: base.productOfWeekCategoryId || null,
      hasVariants,
      isPersonalizable: personalizationEnabled,
      colors: Array.from(colorHexSet),
      updatedAt: now,
    })
    .eq('id', id)

  if (updateError) {
    logger.error('[products.updateProduct] product update failed', updateError)
    return {
      message: 'Database hatası: Ürün güncellenemedi.',
      ok: false,
      productId: id,
    }
  }

  // Clear existing variant graph and images before re-inserting the new structure
  await supabase.from('product_variants').delete().eq('productId', id)
  await supabase.from('product_options').delete().eq('productId', id)
  await supabase.from('product_images').delete().eq('productId', id)

  let defaultVariantId: string | null = null
  let totalStock = hasVariants ? 0 : base.stock
  const imageRecords: PersistVariantResult['variantImages'] = []

  if (hasVariants && variantState) {
    try {
      const variantResult = await persistVariantGraph(
        supabase,
        id,
        variantState,
        now,
        defaultVariantClientId,
      )

      defaultVariantId = variantResult.defaultVariantId
      totalStock = variantResult.totalStock
      imageRecords.push(...variantResult.variantImages)
    } catch (error) {
      logger.error('[products.updateProduct] variant persistence failed', error)
      return {
        message: 'Varyasyonlar kaydedilirken bir hata oluştu.',
        ok: false,
        productId: id,
      }
    }
  }

  if (sharedImages.length > 0) {
    let sortCursor = imageRecords.length
    const sharedSorted = [...sharedImages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    for (const image of sharedSorted) {
      imageRecords.push({
        id: randomUUID(),
        productId: id,
        variantId: null,
        url: image.url,
        fileId: image.fileId ?? null,
        alt: image.alt ?? `${base.cardTitle || productTitle} görseli ${sortCursor + 1}`,
        sortOrder: sortCursor,
        createdAt: now,
      })
      sortCursor += 1
    }
  }

  if (!hasVariants && imageRecords.length === 0 && fallbackImages.length > 0) {
    let sortCursor = 0
    const fallbackSorted = [...fallbackImages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    for (const image of fallbackSorted) {
      imageRecords.push({
        id: randomUUID(),
        productId: id,
        variantId: null,
        url: image.url,
        fileId: image.fileId ?? null,
        alt: image.alt ?? `${base.cardTitle || productTitle} görseli ${sortCursor + 1}`,
        sortOrder: sortCursor,
        createdAt: now,
      })
      sortCursor += 1
    }
  }

  if (imageRecords.length > 0) {
    const { error: imagesError } = await supabase.from('product_images').insert(imageRecords)
    if (imagesError) {
      logger.error('[products.updateProduct] product_images insert failed', imagesError)
      return {
        message: 'Görseller kaydedilirken bir hata oluştu.',
        ok: false,
        productId: id,
      }
    }
  }

  let personalizationResult: PersistPersonalizationResult = {
    isPersonalizable: personalizationEnabled,
    configId: null,
  }

  try {
    personalizationResult = await persistPersonalizationGraph(supabase, id, personalizationState, now)
  } catch (error) {
    logger.error('[products.updateProduct] personalization persistence failed', error)
    return {
      message: 'Kişiselleştirme alanları kaydedilirken bir hata oluştu.',
      ok: false,
      productId: id,
    }
  }

  const { error: finalUpdateError } = await supabase
    .from('products')
    .update({
      defaultVariantId,
      hasVariants,
      stock: totalStock,
      colors: Array.from(colorHexSet),
      isPersonalizable: personalizationResult.isPersonalizable,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)

  if (finalUpdateError) {
    logger.error('[products.updateProduct] post-update failed', finalUpdateError)
    return {
      message: 'Ürün verileri güncellenirken bir hata oluştu.',
      ok: false,
      productId: id,
    }
  }

  const { data: verification, error: verificationError } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (verificationError || !verification?.id) {
    logger.error('[products.updateProduct] verification failed', verificationError ?? new Error('Product not found after update'))
    return {
      message: 'Ürün veritabanında doğrulanamadı.',
      ok: false,
      productId: id,
    }
  }

  revalidatePath('/admin/products')
  return {
    message: 'Ürün başarıyla güncellendi.',
    ok: true,
    productId: id,
  }
}

// Delete product action
export async function deleteProduct(id: string) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Supabase error:', error)
      throw new Error('Database Hatası: Ürün silinemedi.')
    }
    
    revalidatePath('/admin/products')
  } catch (error) {
    logger.error('Delete product error:', error)
    throw new Error('Database Hatası: Ürün silinemedi.')
  }
}

// Fetch products with pagination
export async function fetchFilteredProducts(
  query: string,
  currentPage: number,
) {
  const ITEMS_PER_PAGE = 6
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  try {
    const supabase = getSupabaseAdmin()
    
    let queryBuilder = supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name, slug),
        product_images(id, url, fileId, alt, sortOrder)
      `)
      .order('createdAt', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1)

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { data: products, error } = await queryBuilder

    if (error) {
      logger.error('Supabase error:', error)
      throw new Error('Ürünler getirilemedi.')
    }

    return products || []
  } catch (error) {
    logger.error('Database Error:', error)
    throw new Error('Ürünler getirilemedi.')
  }
}

// Fetch products pages count
export async function fetchProductsPages(query: string) {
  const ITEMS_PER_PAGE = 6

  try {
    const supabase = getSupabaseAdmin()
    
    let queryBuilder = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { count, error } = await queryBuilder

    if (error) {
      logger.error('Supabase error:', error)
      throw new Error('Ürün sayısı getirilemedi.')
    }

    const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)
    return totalPages
  } catch (error) {
    logger.error('Database Error:', error)
    throw new Error('Ürün sayısı getirilemedi.')
  }
}

// Fetch product by ID
export async function fetchProductById(id: string): Promise<ProductWithVariants | null> {
  try {
    const supabase = getSupabaseAdmin()

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories!left(id, name, slug),
        product_images(id, url, fileId, alt, sortOrder, variantId)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      logger.error('[products.fetchProductById] supabase error', error)
      return null
    }

    if (!product) {
      logger.debug('[products.fetchProductById] not found', { id })
      return null
    }

    return hydrateProductWithVariants(supabase, product)
  } catch (error) {
    logger.error('Product fetch error:', error)
    return null
  }
}

// Fetch categories for select options
export async function fetchCategories() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, parentId')
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) {
      logger.error('Supabase error:', error)
      throw new Error('Kategoriler getirilemedi.')
    }

    return categories || []
  } catch (error) {
    logger.error('Database Error:', error)
    throw new Error('Kategoriler getirilemedi.')
  }
}

/**
 * Get product statistics for admin dashboard
 */
export async function getProductStats() {
  try {
    const supabase = getSupabaseAdmin();
    
    const [totalProducts, recentProducts] = await Promise.all([
      // Total products count
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true }),
      
      // Recent products (last 30 days)
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return {
      totalProducts: totalProducts.count || 0,
      recentProducts: recentProducts.count || 0,
    };
  } catch (error) {
    logger.error('Error in getProductStats:', error);
    return {
      totalProducts: 0,
      recentProducts: 0,
    };
  }
}

// Fetch all products for admin use (event-theme assignments)
export async function fetchProducts() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        colors,
        product_images(url, alt, sortOrder),
        category:categories!inner(id, name, slug)
      `)
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) {
      logger.error('Supabase error:', error)
      throw new Error('Ürünler getirilemedi.')
    }

    // Transform the data to match the expected interface
    const transformedProducts = products?.map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: typeof product.price === 'object' ? parseFloat(product.price.toString()) : product.price,
      images: (product.product_images || []).map((img: any) => ({ url: img.url, alt: img.alt || null })),
      colors: product.colors || [],
      category: {
        id: product.category?.id || '',
        name: product.category?.name || 'Kategori Yok',
        slug: product.category?.slug || ''
      }
    })) || []

    return transformedProducts
  } catch (error) {
    logger.error('Database Error:', error)
    throw new Error('Ürünler getirilemedi.')
  }
}

// Fetch products with optional filters (customer products page)
export async function fetchProductsFiltered(
  colors?: string[],
  options?: {
    categoryId?: string
    query?: string
    minPrice?: number
    maxPrice?: number
    inStockOnly?: boolean
    sort?: 'popularity' | 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name'
  }
) {
  try {
    const supabase = getSupabaseAdmin()

    let queryBuilder = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        categoryId,
        stock,
        createdAt,
        colors,
        product_images(url, alt, sortOrder),
        category:categories!inner(id, name, slug)
      `)
      .eq('isActive', true)

    // Sort
    const sort = options?.sort || 'popularity'
    switch (sort) {
      case 'newest':
        queryBuilder = queryBuilder.order('createdAt', { ascending: false })
        break
      case 'oldest':
        queryBuilder = queryBuilder.order('createdAt', { ascending: true })
        break
      case 'price-asc':
        queryBuilder = queryBuilder.order('price', { ascending: true })
        break
      case 'price-desc':
        queryBuilder = queryBuilder.order('price', { ascending: false })
        break
      case 'name':
        queryBuilder = queryBuilder.order('name', { ascending: true })
        break
      case 'popularity':
      default:
        queryBuilder = queryBuilder.order('createdAt', { ascending: false })
        break
    }

    if (colors && colors.length > 0) {
      // Postgres array contains: colors @> colors[]
      queryBuilder = queryBuilder.contains('colors', colors)
    }

    if (options?.query) {
      const q = options.query
      queryBuilder = queryBuilder.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }

    if (options?.categoryId) {
      queryBuilder = queryBuilder.eq('categoryId', options.categoryId)
    }

    if (options?.minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', options.minPrice)
    }

    if (options?.maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', options.maxPrice)
    }

    if (options?.inStockOnly) {
      queryBuilder = queryBuilder.gt('stock', 0)
    }

    const { data: products, error } = await queryBuilder

    if (error) {
      logger.error('Supabase error:', error)
      throw new Error('Ürünler getirilemedi.')
    }

    const transformed = (products || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: typeof product.price === 'object' ? parseFloat(product.price.toString()) : product.price,
      images: (product.product_images || []).map((img: any) => ({ url: img.url, alt: img.alt || null })),
      colors: product.colors || [],
      category: product.category,
      categoryId: product.categoryId,
      stock: product.stock,
      createdAt: product.createdAt,
    }))

    return transformed
  } catch (error) {
    logger.error('Database Error:', error)
    throw new Error('Ürünler getirilemedi.')
  }
}

// Collect dynamic color suggestions from products.colors and theme_styles.colors
export async function fetchColorSuggestions(limit: number = 24): Promise<string[]> {
  try {
    const supabase = getSupabaseAdmin()

    // Fetch colors from products
    const { data: productColorsData } = await supabase
      .from('products')
      .select('colors')
      .eq('isActive', true)

    // Fetch colors from theme styles
    const { data: themeColorsData } = await supabase
      .from('theme_styles')
      .select('colors')
      .eq('isActive', true)

    const productColors = (productColorsData || [])
      .flatMap((row: any) => Array.isArray(row.colors) ? row.colors : [])
    const themeColors = (themeColorsData || [])
      .flatMap((row: any) => Array.isArray(row.colors) ? row.colors : [])

    // Normalize, dedupe and keep order by frequency
    const all = [...productColors, ...themeColors]
      .filter(Boolean)
      .map((c: string) => c.toLowerCase())

    const freq = new Map<string, number>()
    for (const c of all) freq.set(c, (freq.get(c) || 0) + 1)

    const uniqueSorted = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c)

    // Fallback defaults if empty
    if (uniqueSorted.length === 0) {
      return ['#ffffff','#000000','#ff0000','#ffa500','#ffff00','#00ff00','#00ffff','#0000ff','#800080','#ff69b4']
    }

    return uniqueSorted.slice(0, limit)
  } catch (error) {
    logger.error('Renk önerileri getirilirken hata:', error)
    return ['#ffffff','#000000','#ff0000','#ffa500','#ffff00','#00ff00','#00ffff','#0000ff','#800080','#ff69b4']
  }
}

// Customer site functions

const ITEMS_PER_PAGE = 12;

export async function fetchProductsByCategory(
  categorySlug: string,
  currentPage: number = 1,
  query?: string,
  sortBy: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name' | 'popularity' = 'newest',
  minPrice?: number,
  maxPrice?: number
): Promise<ProductWithCategory[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const supabase = getSupabaseAdmin();
    
    // Önce kategoriyi bul
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        children:categories!parentId(
          id,
          name,
          slug,
          children:categories!parentId(id, name, slug)
        )
      `)
      .eq('slug', categorySlug)
      .single();

    if (categoryError || !category) {
      return [];
    }

    // Tüm alt kategorilerin ID'lerini topla
    const categoryIds = [category.id];
    
    // 2. seviye alt kategoriler
    if (category.children) {
      category.children.forEach((child: { id: string; children?: { id: string }[] }) => {
        categoryIds.push(child.id);
        // 3. seviye alt kategoriler
        if (child.children) {
          child.children.forEach((grandChild: { id: string }) => {
            categoryIds.push(grandChild.id);
          });
        }
      });
    }

    // Sıralama seçenekleri
    let orderColumn = 'createdAt';
    let ascending = false;
    
    switch (sortBy) {
      case 'oldest':
        orderColumn = 'createdAt';
        ascending = true;
        break;
      case 'price-asc':
        orderColumn = 'price';
        ascending = true;
        break;
      case 'price-desc':
        orderColumn = 'price';
        ascending = false;
        break;
      case 'name':
        orderColumn = 'name';
        ascending = true;
        break;
    }

    let queryBuilder = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        isActive,
        createdAt,
        categoryId,
        product_images(url, alt, sortOrder),
        category:categories!inner(id, name, slug)
      `)
      .in('categoryId', categoryIds)
      .eq('isActive', true)
      .order(orderColumn, { ascending })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }

    const { data: products, error } = await queryBuilder;

    if (error) {
      logger.error('Supabase error:', error);
      return [];
    }

    if (!products) return [];

    // Supabase sonuçlarını ProductWithCategory'ye dönüştür
    return products.map((product: any) => 
      convertSupabaseToProductWithCategory({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        gallery: [],
        is_active: product.is_active,
        created_at: product.created_at,
        category: product.category
      })
    );
  } catch (error) {
    logger.error('Kategori ürünleri getirilirken hata:', error);
    return [];
  }
}

export async function fetchProductsCategoryPages(
  categorySlug: string,
  query?: string,
  minPrice?: number,
  maxPrice?: number
): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Önce kategoriyi bul
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select(`
        id,
        children:categories!parentId(
          id,
          children:categories!parentId(id)
        )
      `)
      .eq('slug', categorySlug)
      .single();

    if (categoryError || !category) {
      return 0;
    }

    // Tüm alt kategorilerin ID'lerini topla
    const categoryIds = [category.id];
    
    if (category.children) {
      category.children.forEach((child: { id: string; children?: { id: string }[] }) => {
        categoryIds.push(child.id);
        if (child.children) {
          child.children.forEach((grandChild: { id: string }) => {
            categoryIds.push(grandChild.id);
          });
        }
      });
    }

    let queryBuilder = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .in('categoryId', categoryIds)
      .eq('isActive', true);

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }

    const { count, error } = await queryBuilder;

    if (error) {
      logger.error('Supabase error:', error);
      return 0;
    }

    return Math.ceil((count || 0) / ITEMS_PER_PAGE);
  } catch (error) {
    logger.error('Kategori sayfa sayısı hesaplanırken hata:', error);
    return 0;
  }
}

export async function fetchCategoryBySlug(slug: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        *,
        parent:categories!parentId(id, name, slug),
        children:categories!parentId(
          id,
          name,
          slug,
          products!inner(count)
        ),
        products!inner(count)
      `)
      .eq('slug', slug)
      .eq('isActive', true)
      .single();

    if (error) {
      logger.error('Supabase error:', error);
      return null;
    }

    return category;
  } catch (error) {
    logger.error('Kategori getirilirken hata:', error);
    return null;
  }
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  try {
    const supabase = getSupabaseAdmin()

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(
          id,
          name,
          slug,
          parent:categories!parentId(id, name, slug)
        ),
        product_images(id, url, fileId, alt, sortOrder, variantId)
      `)
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      logger.error('[products.fetchProductBySlug] supabase error', error)
      return null
    }

    if (!product) {
      logger.debug('[products.fetchProductBySlug] not found', { slug })
      return null
    }

    return hydrateProductWithVariants(supabase, product)
  } catch (error) {
    logger.error('Ürün getirilirken hata:', error)
    return null
  }
}

export async function fetchRelatedProducts(productId: string, categoryId: string, limit: number = 4): Promise<ProductWithCategory[]> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        product_images(url, alt, sortOrder),
        isActive,
        createdAt,
        categoryId,
        category:categories!inner(id, name, slug)
      `)
      .eq('categoryId', categoryId)
      .eq('isActive', true)
      .neq('id', productId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Supabase error:', error);
      return [];
    }

    if (!products) return [];

    // Supabase sonuçlarını ProductWithCategory'ye dönüştür
    return products.map((product: any) => {
      const gallery = Array.isArray(product.product_images)
        ? product.product_images
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((img: any) => img.url)
        : []
      return convertSupabaseToProductWithCategory({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        gallery,
        is_active: product.is_active,
        created_at: product.created_at,
        category: product.category,
      })
    });
  } catch (error) {
    logger.error('İlgili ürünler getirilirken hata:', error);
    return [];
  }
}

// Search products with sorting and filtering
export async function fetchSearchProducts(
  query: string,
  currentPage: number = 1,
  sortBy: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name' | 'popularity' = 'newest',
  minPrice?: number,
  maxPrice?: number
): Promise<ProductWithCategory[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const supabase = getSupabaseAdmin();
    
    // Sıralama seçenekleri
    let orderColumn = 'createdAt';
    let ascending = false;
    
    switch (sortBy) {
      case 'oldest':
        orderColumn = 'createdAt';
        ascending = true;
        break;
      case 'price-asc':
        orderColumn = 'price';
        ascending = true;
        break;
      case 'price-desc':
        orderColumn = 'price';
        ascending = false;
        break;
      case 'name':
        orderColumn = 'name';
        ascending = true;
        break;
      case 'popularity':
        // Popülerlik için createdAt kullanıyoruz (gelecekte view count eklenebilir)
        orderColumn = 'createdAt';
        ascending = false;
        break;
    }

    let queryBuilder = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        isActive,
        createdAt,
        categoryId,
        product_images(url, alt, sortOrder),
        category:categories!inner(id, name, slug)
      `)
      .eq('isActive', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order(orderColumn, { ascending })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }

    const { data: products, error } = await queryBuilder;

    if (error) {
      logger.error('Supabase error:', error);
      return [];
    }

    if (!products) return [];

    // Supabase sonuçlarını ProductWithCategory'ye dönüştür
    return products.map((product: any) => {
      const gallery = Array.isArray(product.product_images)
        ? product.product_images
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((img: any) => img.url)
        : []
      return convertSupabaseToProductWithCategory({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        gallery,
        is_active: product.is_active,
        created_at: product.created_at,
        category: product.category
      })
    });
  } catch (error) {
    logger.error('Arama ürünleri getirilirken hata:', error);
    return [];
  }
}

// Get search results page count
export async function fetchSearchProductsPages(
  query: string,
  minPrice?: number,
  maxPrice?: number
): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    
    let queryBuilder = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('isActive', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }

    const { count, error } = await queryBuilder;

    if (error) {
      logger.error('Supabase error:', error);
      return 0;
    }

    return Math.ceil((count || 0) / ITEMS_PER_PAGE);
  } catch (error) {
    logger.error('Arama sayfa sayısı hesaplanırken hata:', error);
    return 0;
  }
}

// Get price range for category or search
export async function fetchPriceRange(
  categorySlug?: string,
  searchQuery?: string
): Promise<{ min: number; max: number }> {
  try {
    const supabase = getSupabaseAdmin();
    
    let queryBuilder = supabase
      .from('products')
      .select('price')
      .eq('isActive', true);

    if (categorySlug) {
      // Get category and its children IDs
      const { data: category } = await supabase
        .from('categories')
        .select(`
          id,
          children:categories!parentId(
            id,
            children:categories!parentId(id)
          )
        `)
        .eq('slug', categorySlug)
        .single();

      if (category) {
        const categoryIds = [category.id];
        if (category.children) {
          category.children.forEach((child: { id: string; children?: { id: string }[] }) => {
            categoryIds.push(child.id);
            if (child.children) {
              child.children.forEach((grandChild: { id: string }) => {
                categoryIds.push(grandChild.id);
              });
            }
          });
        }
        queryBuilder = queryBuilder.in('categoryId', categoryIds);
      }
    }

    if (searchQuery) {
      queryBuilder = queryBuilder.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data: products, error } = await queryBuilder;

    if (error || !products || products.length === 0) {
      return { min: 0, max: 10000 };
    }

    const prices = products.map(p => p.price).filter(p => p != null);
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  } catch (error) {
    logger.error('Fiyat aralığı hesaplanırken hata:', error);
    return { min: 0, max: 10000 };
  }
}

/**
 * Fetch featured products for homepage
 */
export async function fetchFeaturedProducts(limit: number = 8): Promise<FeaturedProduct[]> {
  try {
    // Use admin client to bypass RLS policies
    const supabase = getSupabaseAdmin();
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        isActive,
        createdAt,
        categoryId,
        colors,
        category:categories!inner(id, name, slug),
        product_images(url, alt, sortOrder)
      `)
      .eq('isActive', true)
      .eq('isFeatured', true)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Öne çıkan ürünler getirilirken hata:', error);
      return [];
    }

    if (!products) return [];

    // Supabase sonuçlarını ProductWithCategory'ye dönüştür
    const productsWithCategory = products.map((product: any) => {
      const gallery = Array.isArray(product.product_images)
        ? product.product_images
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((img: any) => img.url)
        : []
      return convertSupabaseToProductWithCategory({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: typeof product.price === 'object' ? parseFloat(product.price.toString()) : product.price,
        gallery,
        colors: Array.isArray(product.colors) ? product.colors : [],
        is_active: product.is_active,
        created_at: product.created_at,
        category: product.category
      })
    });

    // FeaturedProduct'a dönüştür
    return productsWithCategory.map(convertToFeaturedProduct);
  } catch (error) {
    logger.error('Öne çıkan ürünler getirilirken hata:', error);
    return [];
  }
}

/**
 * Fetch new arrivals for homepage
 */
export async function fetchNewArrivals(limit: number = 8): Promise<SimpleProduct[]> {
  try {
    // Use admin client to bypass RLS policies
    const supabase = getSupabaseAdmin()
    const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      description,
      price,
      isActive,
      isNewArrival,
      createdAt,
      categoryId,
      colors,
      category:categories!inner(id, name, slug),
      product_images(url, alt, sortOrder)
    `)
    .eq('isActive', true)
    .eq('isNewArrival', true)
    .order('createdAt', { ascending: false })
    .limit(limit);

    if (error) {
      logger.error('Yeni ürünler getirilirken hata:', error);
      return [];
    }

    if (!products) return [];

    // Supabase sonuçlarını ProductWithCategory'ye dönüştür
    const productsWithCategory = products.map((product: any) => {
      const gallery = Array.isArray(product.product_images)
        ? product.product_images
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((img: any) => img.url)
        : []
      return convertSupabaseToProductWithCategory({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: typeof product.price === 'object' ? parseFloat(product.price.toString()) : product.price,
        gallery,
        colors: Array.isArray(product.colors) ? product.colors : [],
        is_active: product.is_active,
        created_at: product.created_at,
        category: product.category
      })
    });

    // SimpleProduct'a dönüştür
    return productsWithCategory.map(convertToSimpleProduct);
  } catch (error) {
    logger.error('Yeni ürünler getirilirken hata:', error);
    return [];
  }
}






