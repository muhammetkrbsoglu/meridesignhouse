export function generateAltText(input?: { name?: string; categoryName?: string; prefix?: string; fallback?: string }) {
  const title = input?.name?.trim()
  if (title && title.length > 0) return title
  if (input?.categoryName) return `${input.categoryName} ürünü`
  if (input?.prefix) return input.prefix
  return input?.fallback || 'Ürün görseli'
}


