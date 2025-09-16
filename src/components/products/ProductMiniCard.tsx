import Link from 'next/link'
import Image from 'next/image'

export interface ProductMiniCardProps {
  slug?: string
  name?: string
  imageUrl?: string
  quantity?: number
  className?: string
}

export function ProductMiniCard({ slug = '', name = '', imageUrl, quantity = 1, className = '' }: ProductMiniCardProps) {
  return (
    <Link href={slug ? `/products/${slug}` : '#'} className={`group block rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="relative">
        <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
        {typeof quantity === 'number' && quantity > 0 && (
          <div className="absolute top-2 left-2 rounded-full bg-rose-600/95 text-white text-xs px-2 py-0.5 shadow">
            Adet: {quantity}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-medium text-stone-800 line-clamp-2 group-hover:text-rose-600 transition-colors">{name}</div>
      </div>
    </Link>
  )
}


