import Link from 'next/link'

export const metadata = {
  title: '404 - Sayfa Bulunamadı | Meri DesignHouse',
  description: 'Aradığınız sayfa bulunamadı. Ana sayfaya dönebilir veya ürünlerimizi inceleyebilirsiniz.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  // Basit, server-fetch olmayan sürüm (ileride gerçek veri ile zenginleştirilecek)
  const categories = [
    { name: 'Düğün', href: '/categories/dugun' },
    { name: 'Doğum Günü', href: '/categories/dogum-gunu' },
    { name: 'Kına', href: '/categories/kina' },
  ]
  const recent = [
    { name: 'Yeni Ürün 1', href: '/products/yeni-urun-1' },
    { name: 'Yeni Ürün 2', href: '/products/yeni-urun-2' },
    { name: 'Yeni Ürün 3', href: '/products/yeni-urun-3' },
    { name: 'Yeni Ürün 4', href: '/products/yeni-urun-4' },
  ]

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center">
          <h1 className="text-7xl font-bold text-gray-300">404</h1>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">Sayfa Bulunamadı</h2>
          <p className="mt-2 text-gray-600">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
          <div className="mt-6">
            <Link href="/" className="inline-flex items-center px-5 py-2.5 rounded-md bg-rose-600 text-white hover:bg-rose-700">
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-lg border bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popüler Kategoriler</h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((c) => (
                <Link key={c.href} href={c.href} className="p-3 rounded-md border hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-900">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="p-5 rounded-lg border bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Eklenenler</h3>
            <div className="grid grid-cols-2 gap-3">
              {recent.map((p) => (
                <Link key={p.href} href={p.href} className="p-3 rounded-md border hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-900 line-clamp-2">{p.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



