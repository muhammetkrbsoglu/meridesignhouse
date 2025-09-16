import { Suspense } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { CartContent } from '@/components/cart/CartContent'
import { CartSkeleton } from '@/components/cart/CartSkeleton'

export default function CartPage() {
  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sepetim</h1>
            <p className="text-gray-600">Sepetinizdeki ürünleri görüntüleyin ve düzenleyin</p>
          </div>

          <Suspense fallback={<CartSkeleton />}>
            <CartContent />
          </Suspense>
        </div>
      </div>
    </CustomerLayout>
  )
}