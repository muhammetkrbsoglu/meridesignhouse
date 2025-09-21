// Merkezi Product tip tanımları
// Bu dosya tüm product ile ilgili tipleri içerir ve tutarlılığı sağlar

import { Decimal } from '@prisma/client/runtime/library';

// Temel Category tipi
export interface Category {
  id: string;
  name: string;
  slug: string;
}

// Genişletilmiş Category tipi (alt kategoriler ile)
export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  productCount?: number;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

// Product Image tipi
export interface ProductImage {
  id?: string;
  url: string;
  alt?: string | null;
  sortOrder?: number;
  variantId?: string | null;
  fileId?: string | null;
}

export interface ProductOption {
  id: string;
  productId: string;
  key: string;
  label: string;
  displayType: 'swatch' | 'pill' | 'text';
  sortOrder: number;
  values?: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  optionId: string;
  value: string;
  label: string;
  hexValue?: string | null;
  sortOrder?: number;
  media?: {
    url?: string | null;
    fileId?: string | null;
  } | null;
}

export interface ProductVariantOptionValue {
  optionId: string;
  optionKey: string;
  optionLabel: string;
  valueId: string;
  valueLabel: string;
  hexValue?: string | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  description?: string | null;
  sku?: string | null;
  stock?: number | null;
  isActive: boolean;
  sortOrder: number;
  optionValueKey: string;
  badgeHex?: string | null;
  optionValues?: ProductVariantOptionValue[];
  images?: ProductImage[];
}

export interface BaseProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  cardTitle?: string | null;
  price: number | Decimal;
  oldPrice?: number | Decimal | null;
  comparePrice?: number | Decimal | null;
  sku?: string | null;
  stock?: number;
  hasVariants?: boolean;
  defaultVariantId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isProductOfWeek?: boolean;
  productOfWeekCategoryId?: string | null;
  weight?: number | null;
  dimensions?: string | null;
  categoryId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Category ile birlikte Product tipi
export interface ProductWithCategory extends BaseProduct {
  category: Category;
  images: ProductImage[]; // Supabase'den gelen format
  // Bazı bileşenler legacy alan adını kullanıyor
  product_images?: ProductImage[];
  options?: ProductOption[];
  variants?: ProductVariant[];
}

export interface ProductWithVariants extends ProductWithCategory {
  defaultVariantId?: string | null;
  hasVariants?: boolean;
}

// Detaylı Product tipi (image objeler ile)
export interface ProductWithImages extends BaseProduct {
  category: Category;
  images: ProductImage[];
}

// Admin formu için Product tipi
export interface AdminProduct extends BaseProduct {
  images?: ProductImage[];
  options?: ProductOption[];
  variants?: ProductVariant[];
}

// Component'lar için basitleştirilmiş Product tipi
export interface SimpleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[]; // Sadece URL'ler
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

// Featured Products için tip
export interface FeaturedProduct {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number; // İndirim hesaplaması için
  imageUrl: string; // Tek resim URL'i
  category: {
    name: string;
  };
}

// Cart item için Product tipi
export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  category?: {
    name: string;
  } | null;
}

// Search için Product tipi
export interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  images: { url: string }[];
  price: Decimal | number;
}

// Menu için Product tipi
export interface MenuProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  categories: {
    name: string;
    slug: string;
  }[];
}

// Event Theme Assignment için Product tipi
export interface EventThemeProduct {
  id: string;
  name: string;
  slug: string;
  price: number | { toNumber(): number };
  images: { url: string; alt: string | null }[];
}

// Supabase query sonuçları için tip (join'ler array döndürür)
export interface SupabaseProductResult {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number | { toString(): string };
  gallery: string[]; // Supabase'deki gerçek field adı
  is_active?: boolean; // Supabase'deki gerçek field adı
  created_at?: string; // Supabase'deki gerçek field adı
  category: Category; // Supabase join sonucu object döndürür
}

// Tip dönüştürme fonksiyonları
export function convertSupabaseToProductWithCategory(
  supabaseProduct: SupabaseProductResult
): ProductWithCategory {
  return {
    id: supabaseProduct.id,
    name: supabaseProduct.name,
    slug: supabaseProduct.slug,
    description: supabaseProduct.description,
    price: typeof supabaseProduct.price === 'object' ? parseFloat(supabaseProduct.price.toString()) : supabaseProduct.price,
    images: supabaseProduct.gallery?.map(url => ({ url, alt: null })) || [],
    isActive: supabaseProduct.is_active,
    createdAt: supabaseProduct.created_at ? new Date(supabaseProduct.created_at) : undefined,
    category: supabaseProduct.category, // Kategori objesi
    categoryId: supabaseProduct.category?.id || '',
  };
}

export function convertToSimpleProduct(
  product: ProductWithCategory
): SimpleProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: typeof product.price === 'number' ? product.price : product.price.toNumber(),
    images: product.images.map(img => img.url),
    category: {
      id: product.category?.id || '',
      name: product.category?.name || 'Kategori yok',
      slug: product.category?.slug || '',
    },
  };
}

export function convertToFeaturedProduct(
  product: ProductWithCategory
): FeaturedProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: typeof product.price === 'number' ? product.price : product.price.toNumber(),
    originalPrice: product.oldPrice ? (typeof product.oldPrice === 'number' ? product.oldPrice : product.oldPrice.toNumber()) : undefined,
    imageUrl: product.images[0]?.url || '/placeholder-product.svg',
    category: {
      name: product.category.name,
    },
  };
}