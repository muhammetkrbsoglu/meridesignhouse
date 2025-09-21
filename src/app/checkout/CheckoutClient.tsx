'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createOrderFromCart } from '@/lib/actions/orders';
import { getCartItems, getFavoriteItems, addToCart } from '@/lib/api/cartClient';
import { listUserAddresses } from '@/lib/actions/profile';
import { supabase } from '@/lib/supabase-browser';
import { Loader2, ArrowLeft, ShoppingCart } from 'lucide-react';
import type { CartItem } from '@/types/cart';
import Link from 'next/link';
import { toast } from 'sonner';

interface CheckoutClientProps {
  initialAddresses: any[];
}


interface CheckoutFormData {
  shippingFullName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone: string;
  useSameAddress: boolean;
  billingFullName: string;
  billingAddress: string;
  billingCity: string;
  billingDistrict: string;
  billingPostalCode: string;
  billingCountry: string;
  shippingMethod: 'standard' | 'express';
  notes: string;
}

export default function CheckoutClient({ initialAddresses }: CheckoutClientProps) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [_addresses, setAddresses] = useState<any[]>(initialAddresses || []);
  const [_favoriteItems, setFavoriteItems] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  // removed copied state as it's not used

  const [formData, setFormData] = useState<CheckoutFormData>({
    shippingFullName: '',
    shippingAddress: '',
    shippingCity: '',
    shippingDistrict: '',
    shippingPostalCode: '',
    shippingCountry: 'Türkiye',
    shippingPhone: '',
    useSameAddress: true,
    billingFullName: '',
    billingAddress: '',
    billingCity: '',
    billingDistrict: '',
    billingPostalCode: '',
    billingCountry: 'Türkiye',
    shippingMethod: 'standard',
    notes: ''
  });

  // Seed form from initialAddresses on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (initialAddresses && initialAddresses.length > 0) {
      const defaultShipping = initialAddresses.find((a: any) => a.is_default_shipping) || initialAddresses[0];
      const defaultBilling = initialAddresses.find((a: any) => a.is_default_billing) || defaultShipping;
      setFormData(prev => ({
        ...prev,
        shippingFullName: defaultShipping.full_name,
        shippingAddress: defaultShipping.address,
        shippingCity: defaultShipping.city,
        shippingDistrict: defaultShipping.state || '',
        shippingPostalCode: defaultShipping.postal_code || '',
        shippingCountry: defaultShipping.country || 'Türkiye',
        shippingPhone: defaultShipping.phone,
        billingFullName: defaultBilling.full_name,
        billingAddress: defaultBilling.address,
        billingCity: defaultBilling.city,
        billingDistrict: defaultBilling.state || '',
        billingPostalCode: defaultBilling.postal_code || '',
        billingCountry: defaultBilling.country || 'Türkiye'
      }));
    }
  }, [initialAddresses]);

  useEffect(() => {
    loadCartItems();
    loadFavoriteItems();

    // Fallback: if no initial addresses, try client-side after auth ready
    if (!initialAddresses || initialAddresses.length === 0) {
      const sub = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const list = await listUserAddresses(session.user.id);
          setAddresses(list || []);
          if (list && list.length > 0) {
            const defaultShipping = list.find((a: any) => a.is_default_shipping) || list[0];
            const defaultBilling = list.find((a: any) => a.is_default_billing) || defaultShipping;
            setFormData(prev => ({
              ...prev,
              shippingFullName: defaultShipping.full_name,
              shippingAddress: defaultShipping.address,
              shippingCity: defaultShipping.city,
              shippingDistrict: defaultShipping.state || '',
              shippingPostalCode: defaultShipping.postal_code || '',
              shippingCountry: defaultShipping.country || 'Türkiye',
              shippingPhone: defaultShipping.phone,
              billingFullName: defaultBilling.full_name,
              billingAddress: defaultBilling.address,
              billingCity: defaultBilling.city,
              billingDistrict: defaultBilling.state || '',
              billingPostalCode: defaultBilling.postal_code || '',
              billingCountry: defaultBilling.country || 'Türkiye'
            }));
          }
        }
      });
      return () => { sub.data.subscription.unsubscribe(); };
    }
  }, []);

  const loadCartItems = async () => {
    try {
      const items = await getCartItems();
      setCartItems(items);
    } catch (_error) {
      toast.error('Sepet yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteItems = async () => {
    try {
      const items = await getFavoriteItems();
      setFavoriteItems(items);
    } catch {}
  };

  const _handleAddFavoriteToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1, null);
      toast.success('Ürün sepete eklendi');
      loadCartItems();
    } catch {
      toast.error('Sepete eklenirken hata oluştu');
    }
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    let shipping = 0;
    if (subtotal < 500) shipping = formData.shippingMethod === 'express' ? 75 : 50;
    const tax = subtotal * 0.18;
    const total = subtotal + shipping + tax;
    return { subtotal, shipping, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Sepetiniz boş');
      return;
    }
    setSubmitting(true);
    try {
      const checkoutData = {
        shippingAddress: {
          fullName: formData.shippingFullName,
          address: formData.shippingAddress,
          city: formData.shippingCity,
          district: formData.shippingDistrict,
          postalCode: formData.shippingPostalCode,
          country: formData.shippingCountry,
          phone: formData.shippingPhone
        },
        billingAddress: formData.useSameAddress ? undefined : {
          fullName: formData.billingFullName,
          address: formData.billingAddress,
          city: formData.billingCity,
          district: formData.billingDistrict,
          postalCode: formData.billingPostalCode,
          country: formData.billingCountry
        },
        paymentMethod: 'whatsapp_approval',
        notes: formData.notes
      };
      const result = await createOrderFromCart(checkoutData);
      if (result.success) {
        setOrderNumber(result.orderNumber);
        setShowSuccessModal(true);
      } else {
        toast.error(result.error || 'Sipariş oluşturulurken hata oluştu');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const { total } = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ShoppingCart className="h-10 w-10 text-gray-400 mb-2" />
        <h1 className="text-2xl font-bold mb-4">Sepetiniz Boş</h1>
        <p className="text-gray-600 mb-6">Sipariş verebilmek için sepetinizde ürün bulunmalıdır.</p>
        <Link href="/products">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Alışverişe Devam Et
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-28 lg:pb-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Sipariş Oluştur</h1>
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teslimat Adresi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="shippingFullName">Ad Soyad *</Label>
                  <Input id="shippingFullName" value={formData.shippingFullName} onChange={(e) => handleInputChange('shippingFullName', e.target.value)} required autoComplete="name" inputMode="text" />
                </div>
                <div>
                  <Label htmlFor="shippingPhone">Telefon *</Label>
                  <Input id="shippingPhone" value={formData.shippingPhone} onChange={(e) => handleInputChange('shippingPhone', e.target.value)} required type="tel" inputMode="tel" autoComplete="tel" placeholder="05xx xxx xx xx" />
                </div>
              </div>
              <div>
                <Label htmlFor="shippingAddress">Adres *</Label>
                <Textarea id="shippingAddress" value={formData.shippingAddress} onChange={(e) => handleInputChange('shippingAddress', e.target.value)} required rows={3} autoComplete="street-address" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="shippingCity">Åehir *</Label>
                  <Input id="shippingCity" value={formData.shippingCity} onChange={(e) => handleInputChange('shippingCity', e.target.value)} required autoComplete="address-level2" />
                </div>
                <div>
                  <Label htmlFor="shippingDistrict">İlçe *</Label>
                  <Input id="shippingDistrict" value={formData.shippingDistrict} onChange={(e) => handleInputChange('shippingDistrict', e.target.value)} required autoComplete="address-level3" />
                </div>
                <div>
                  <Label htmlFor="shippingPostalCode">Posta Kodu *</Label>
                  <Input id="shippingPostalCode" value={formData.shippingPostalCode} onChange={(e) => handleInputChange('shippingPostalCode', e.target.value)} required inputMode="numeric" autoComplete="postal-code" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm">{item.product.name} × {item.quantity}</span>
                    <span className="text-sm font-medium">₺{(item.product.price * item.quantity).toLocaleString('tr-TR')}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between text-sm"><span>Toplam</span><span>₺{total.toLocaleString('tr-TR')}</span></div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={submitting} className="w-full hidden lg:inline-flex">
            {submitting ? 'Sipariş Oluşturuluyor...' : `Sipariş Oluştur - ₺${total.toLocaleString('tr-TR')}`}
          </Button>
        </form>
      </div>

      {/* Sticky submit bar (mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[999] bg-white/95 backdrop-blur supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)] border-t">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-500">Ödenecek Tutar</div>
            <div className="text-lg font-semibold">₺{total.toLocaleString('tr-TR')}</div>
          </div>
          <Button form="checkout-form" type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Oluşturuluyor...' : 'Siparişi Tamamla'}
          </Button>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Siparişiniz Oluşturuldu!</h2>
            <p className="text-sm text-gray-600 mb-4">Takip numarası: <code className="px-2 py-1 bg-gray-100 rounded">{orderNumber}</code></p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => router.push('/orders')}>Siparişlerim</Button>
              <Button className="flex-1" variant="outline" onClick={() => setShowSuccessModal(false)}>Kapat</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





