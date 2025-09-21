import { NextResponse } from 'next/server'
import { fetchProductById } from '@/lib/actions/products'

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  const { id } = context.params

  if (!id) {
    return NextResponse.json({ error: 'Ürün kimliği gerekli' }, { status: 400 })
  }

  const product = await fetchProductById(id)

  if (!product) {
    return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
  }

  return NextResponse.json({
    id: product.id,
    name: product.name,
    cardTitle: product.cardTitle,
    description: product.description,
    price: product.price,
    stock: product.stock,
    hasVariants: product.hasVariants,
    defaultVariantId: product.defaultVariantId,
    options: product.options,
    variants: product.variants,
    images: product.product_images,
  })
}
