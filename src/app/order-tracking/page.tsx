'use client'

import { useState } from 'react'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getOrderPublic } from '@/lib/actions/orders_public'
import { isValidTurkishPhone } from '@/lib/whatsapp-utils'
import { toast } from 'sonner'

export default function OrderTrackingPage() {
  const [trackingCode, setTrackingCode] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      if (!trackingCode.trim()) {
        toast.error('Takip kodu zorunludur')
        return
      }
      if (!isValidTurkishPhone(phone)) {
        toast.error('Geçerli bir telefon numarası girin')
        return
      }
      const res = await getOrderPublic(trackingCode.trim(), phone.trim())
      if (!res.success) {
        toast.error(res.error || 'Sipariş bulunamadı')
      } else {
        setResult(res.order)
      }
    } catch (_err) {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CustomerLayout>
      <div className="min-h-[100svh] bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Takip</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="tracking">Takip Kodu</Label>
                  <Input id="tracking" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="MDH-20250910-ABCD" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon Numarası</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sorgulanıyor...' : 'Sorgula'}
                </Button>
              </form>

              {result && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Durum</span>
                    <Badge>{result.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sipariş No</span>
                    <span className="font-mono">{result.orderNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Toplam</span>
                    <span>₺{(result.total || 0).toLocaleString('tr-TR')}</span>
                  </div>
                  {result.estimatedDelivery && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tahmini Teslimat</span>
                      <span>{new Date(result.estimatedDelivery).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                  {result.trackingNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Kargo Takip</span>
                      <Link className="text-rose-600 hover:underline" target="_blank" href={`https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(result.trackingNumber)}`}>
                        {result.trackingNumber}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  )
}


