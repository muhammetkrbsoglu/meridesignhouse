'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { createOrderFromCart } from '@/lib/actions/orders';
import { getCartItems, getFavoriteItems, addToCart } from '@/lib/actions/cart';
import { listUserAddresses } from '@/lib/actions/profile';
import { supabase } from '@/lib/supabase-browser';
import { Loader2, Truck, ArrowLeft, Copy, Check, Clock, Shield, Phone, Heart, Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { recommendCheapestService } from '@/lib/shipping';

interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    product_images: Array<{
      url: string;
      alt: string | null;
      sortOrder: number | null;
    }>;
    category: {
      name: string;
    } | null;
  };
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

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [copied, setCopied] = useState(false);
  // PTT cascaded address state
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);
  const [neighborhoods, setNeighborhoods] = useState<Array<{ id: number; name: string; postal_code?: string }>>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [shippingEstimateTRY, setShippingEstimateTRY] = useState<number | null>(null);
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

  const preloadAttemptsRef = useRef(0);
  const prefilledRef = useRef(false);

  useEffect(() => {
    loadCartItems();
    preloadAddresses();
    loadFavoriteItems();
    // load cities for cascaded selection
    fetch('/api/address/iller')
      .then(r => r.json())
      .then((res) => setCities(res.data || []))
      .catch(() => {});
  }, []);

  // Auth-ready listener + resilient retry loop
  useEffect(() => {
    let unsub: (() => void) | undefined;

    const tryPreloadLoop = async () => {
      if (prefilledRef.current) return;
      const maxAttempts = 8; // ~ up to ~4s with backoff
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
      while (!prefilledRef.current && preloadAttemptsRef.current < maxAttempts) {
        preloadAttemptsRef.current += 1;
        await preloadAddresses();
        if (prefilledRef.current) break;
        await delay(500);
      }
    };

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        tryPreloadLoop();
      } else {
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            tryPreloadLoop();
            listener.subscription.unsubscribe();
          }
        });
        unsub = () => listener.subscription.unsubscribe();
      }
    })();

    return () => { if (unsub) unsub(); };
  }, []);

  const loadCartItems = async () => {
    try {
      const items = await getCartItems();
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart items:', error);
      toast.error('Sepet yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const preloadAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const list = await listUserAddresses(user.id);
      setAddresses(list || []);
      if (!list || list.length === 0) return;
      const defaultShipping = list.find((a: any) => a.is_default_shipping) || list[0];
      const defaultBilling = list.find((a: any) => a.is_default_billing) || defaultShipping;
      const isShippingEmpty = !formData.shippingFullName && !formData.shippingAddress && !formData.shippingCity;
      if (defaultShipping && isShippingEmpty) {
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
        prefilledRef.current = true;
      }
    } catch (e) {
      // swallow; we'll retry via loop
    }
  };

  // Cascaded loaders
  const onSelectCity = async (id: string) => {
    setSelectedCityId(id);
    setSelectedDistrictId('');
    setDistricts([]);
    setNeighborhoods([]);
    if (!id) return;
    try {
      const res = await fetch(`/api/address/ilceler?ilId=${id}`);
      const json = await res.json();
      setDistricts(json.data || []);
    } catch {}
  };

  const onSelectDistrict = async (id: string) => {
    setSelectedDistrictId(id);
    setNeighborhoods([]);
    if (!id) return;
    try {
      const res = await fetch(`/api/address/mahalleler?ilceId=${id}`);
      const json = await res.json();
      setNeighborhoods(json.data || []);
    } catch {}
  };

  const onSelectNeighborhood = (postal: string | undefined, name: string) => {
    // Fill city/district/postal code fields from selection; leave address line free text
    const cityName = cities.find(c => String(c.id) === selectedCityId)?.name || formData.shippingCity;
    const districtName = districts.find(d => String(d.id) === selectedDistrictId)?.name || formData.shippingDistrict;
    setFormData(prev => ({
      ...prev,
      shippingCity: cityName,
      shippingDistrict: districtName,
      shippingPostalCode: (postal || '').slice(0, 5)
    }));
  };

  const loadFavoriteItems = async () => {
    try {
      const items = await getFavoriteItems();
      setFavoriteItems(items);
    } catch (error) {
      console.error('Error loading favorite items:', error);
    }
  };

  const handleAddFavoriteToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      toast.success('Ürün sepete eklendi');
      loadCartItems();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Sepete eklenirken hata oluştu');
    }
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    // Use estimated shipping if available, else fallback to previous simple logic
    const shipping = shippingEstimateTRY != null ? shippingEstimateTRY : (subtotal < 500 ? (formData.shippingMethod === 'express' ? 75 : 50) : 0);
    const tax = subtotal * 0.18;
    const total = subtotal + shipping + tax;
    return { subtotal, shipping, tax, total };
  };

  // Estimate shipping whenever address postal code or cart changes
  useEffect(() => {
    // Simple single-parcel estimate: actual weight from products if available; fallback to 1kg
    const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
    const actualWeightKg = Math.max(1, totalQty * 0.5); // fallback heuristic 0.5kg per item
    // Default parcel dimensions (cm)
    const dimensionsCm = { length: 30, width: 20, height: 10 };
    // Only estimate if we have a postal code and city
    if (formData.shippingPostalCode && formData.shippingCity) {
      const quote = recommendCheapestService({ actualWeightKg, dimensionsCm }, { remoteArea: false });
      setShippingEstimateTRY(quote.total);
    } else {
      setShippingEstimateTRY(null);
    }
  }, [formData.shippingPostalCode, formData.shippingCity, cartItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 handleSubmit called', { event: e, cartItems: cartItems.length });
    e.preventDefault();
    console.log('📋 Form validation check');
    if (cartItems.length === 0) {
      console.log('❌ Cart is empty');
      toast.error('Sepetiniz boş');
      return;
    }
    console.log('✅ Cart has items, proceeding with order creation');
    setSubmitting(true);
    try {
      console.log('📝 Preparing checkout data', { formData });
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
      console.log('📤 Calling createOrderFromCart with data:', checkoutData);
      const result = await createOrderFromCart(checkoutData);
      console.log('📥 createOrderFromCart result:', result);
      if (result.success) {
        console.log('✅ Order created successfully, order number:', result.orderNumber);
        setOrderNumber(result.orderNumber);
        setShowSuccessModal(true);
      } else {
        console.log('❌ Order creation failed:', result.error);
        console.log('🔍 Debug info:', result.debug);
        toast.error(result.error || 'Sipariş oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('💥 Checkout error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      console.log('🏁 handleSubmit finished, setting submitting to false');
      setSubmitting(false);
    }
  };

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      toast.success('Sipariş numarası kopyalandı');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Kopyalama başarısız');
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </CustomerLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <CustomerLayout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Sepetiniz Boş</h1>
          <p className="text-gray-600 mb-6">Sipariş verebilmek için sepetinizde ürün bulunmalıdır.</p>
          <Link href="/products">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Alışverişe Devam Et
            </Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const { subtotal, shipping, tax, total } = calculateTotals();

  return (
    <CustomerLayout>
      <div className="min-h-[100svh] bg-gray-50 py-8 pb-[env(safe-area-inset-bottom)] supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/cart" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Sepete Dön
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Sipariş Oluştur</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="mr-2 h-5 w-5" />
                      Teslimat Adresi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addresses.length > 0 && (
                      <div>
                        <Label className="text-base font-medium">Kayıtlı Adreslerim</Label>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {addresses.map((a: any) => {
                            const isDefault = a.is_default_shipping;
                            const isSelected = formData.shippingFullName === a.full_name && formData.shippingAddress === a.address;
                            return (
                              <div
                                key={a.id}
                                className={`border rounded-lg p-3 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    shippingFullName: a.full_name,
                                    shippingAddress: a.address,
                                    shippingCity: a.city,
                                    shippingDistrict: a.state || '',
                                    shippingPostalCode: a.postal_code || '',
                                    shippingCountry: a.country || 'Türkiye',
                                    shippingPhone: a.phone,
                                    ...(prev.useSameAddress ? {
                                      billingFullName: a.full_name,
                                      billingAddress: a.address,
                                      billingCity: a.city,
                                      billingDistrict: a.state || '',
                                      billingPostalCode: a.postal_code || '',
                                      billingCountry: a.country || 'Türkiye'
                                    } : {})
                                  }));
                                }}
                              >
                                <div className="flex items-start justify_between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-sm">{a.label}</span>
                                      {isDefault && (
                                        <Badge variant="secondary" className="text-xs">Varsayılan</Badge>
                                      )}
                                      {isSelected && (
                                        <Badge variant="default" className="text-xs bg-blue-600">Seçili</Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      <div className="font-medium">{a.full_name}</div>
                                      <div>{a.address}</div>
                                      <div>{a.city} {a.state && `- ${a.state}`}</div>
                                      <div className="text-xs text-gray-500">{a.phone}</div>
                                    </div>
                                  </div>
                                  <div className="ml-2">
                                    {isSelected ? (
                                      <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                    ) : (
                                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          💡 <strong>İpucu:</strong> Kayıtlı adreslerinizden birini seçerek formu otomatik doldurabilirsiniz.
                        </div>
                        <Separator className="my-4" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shippingFullName">Ad Soyad *</Label>
                        <Input id="shippingFullName" value={formData.shippingFullName} onChange={(e) => handleInputChange('shippingFullName', e.target.value)} required />
                      </div>
                      <div>
                        <Label htmlFor="shippingPhone">Telefon *</Label>
                        <Input id="shippingPhone" type="tel" value={formData.shippingPhone} onChange={(e) => handleInputChange('shippingPhone', e.target.value)} required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="shippingAddress">Adres *</Label>
                      <Textarea id="shippingAddress" value={formData.shippingAddress} onChange={(e) => handleInputChange('shippingAddress', e.target.value)} required rows={3} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Şehir (PTT)</Label>
                        <select
                          className="mt-1 w-full border rounded-md h-10 px-3"
                          value={selectedCityId}
                          onChange={(e) => onSelectCity(e.target.value)}
                          aria-label="PTT şehir seçimi"
                        >
                          <option value="">Seçiniz</option>
                          {cities.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>İlçe (PTT)</Label>
                        <select
                          className="mt-1 w-full border rounded_md h-10 px-3"
                          value={selectedDistrictId}
                          onChange={(e) => onSelectDistrict(e.target.value)}
                          disabled={!selectedCityId}
                          aria-label="PTT ilçe seçimi"
                        >
                          <option value="">Seçiniz</option>
                          {districts.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Mahalle (PTT) + Posta Kodu</Label>
                        <select
                          className="mt-1 w-full border rounded-md h-10 px-3"
                          onChange={(e) => {
                            const val = e.target.value;
                            const nb = neighborhoods.find(n => String(n.id) === val);
                            if (nb) onSelectNeighborhood(nb.postal_code, nb.name);
                          }}
                          disabled={!selectedDistrictId}
                          aria-label="PTT mahalle ve posta kodu seçimi"
                          aria-describedby="ptt-help"
                        >
                          <option value="">Seçiniz</option>
                          {neighborhoods.map(n => (
                            <option key={n.id} value={n.id}>{n.name} {n.postal_code ? `(${n.postal_code})` : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">Seçim yaptığınızda şehir, ilçe ve posta kodu otomatik doldurulur. Sokak/kapı bilgisini yukarıdaki adres alanına yazınız.</div>
                    <div>
                      <Label htmlFor="shippingCountry">Ülke *</Label>
                      <Input id="shippingCountry" value={formData.shippingCountry} onChange={(e) => handleInputChange('shippingCountry', e.target.value)} required />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fatura Adresi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="useSameAddress" checked={formData.useSameAddress} onCheckedChange={(checked) => handleInputChange('useSameAddress', checked as boolean)} />
                      <Label htmlFor="useSameAddress">Teslimat adresi ile aynı</Label>
                    </div>
                    {!formData.useSameAddress && (
                      <div className="space-y-4">
                        {addresses.length > 0 && (
                          <div>
                            <Label className="text-base font-medium">Fatura Adresi Seç</Label>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {addresses.map((a: any) => {
                                const isDefault = a.is_default_billing;
                                const isSelected = formData.billingFullName === a.full_name && formData.billingAddress === a.address;
                                return (
                                  <div 
                                    key={`billing-${a.id}`}
                                    className={`border rounded-lg p-3 cursor-pointer transition-all ${isSelected ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        billingFullName: a.full_name,
                                        billingAddress: a.address,
                                        billingCity: a.city,
                                        billingDistrict: a.state || '',
                                        billingPostalCode: a.postal_code || '',
                                        billingCountry: a.country || 'Türkiye'
                                      }));
                                    }}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-sm">{a.label}</span>
                                          {isDefault && (
                                            <Badge variant="secondary" className="text-xs">
                                              Varsayılan Fatura
                                            </Badge>
                                          )}
                                          {isSelected && (
                                            <Badge variant="default" className="text-xs bg-green-600">
                                              Seçili
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          <div className="font-medium">{a.full_name}</div>
                                          <div>{a.address}</div>
                                          <div>{a.city} {a.state && `- ${a.state}`}</div>
                                        </div>
                                      </div>
                                      <div className="ml-2">
                                        {isSelected ? (
                                          <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                          </div>
                                        ) : (
                                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              💡 <strong>İpucu:</strong> Fatura adresi için kayıtlı adreslerinizden birini seçebilirsiniz.
                            </div>
                            <Separator className="my-4" />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="billingFullName">Ad Soyad *</Label>
                            <Input
                              id="billingFullName"
                              value={formData.billingFullName}
                              onChange={(e) => handleInputChange('billingFullName', e.target.value)}
                              required={!formData.useSameAddress}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="billingAddress">Adres *</Label>
                          <Textarea
                            id="billingAddress"
                            value={formData.billingAddress}
                            onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                            required={!formData.useSameAddress}
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="billingCity">Şehir *</Label>
                            <Input
                              id="billingCity"
                              value={formData.billingCity}
                              onChange={(e) => handleInputChange('billingCity', e.target.value)}
                              required={!formData.useSameAddress}
                            />
                          </div>
                          <div>
                            <Label htmlFor="billingDistrict">İlçe *</Label>
                            <Input
                              id="billingDistrict"
                              value={formData.billingDistrict}
                              onChange={(e) => handleInputChange('billingDistrict', e.target.value)}
                              required={!formData.useSameAddress}
                            />
                          </div>
                          <div>
                            <Label htmlFor="billingPostalCode">Posta Kodu *</Label>
                            <Input
                              id="billingPostalCode"
                              value={formData.billingPostalCode}
                              onChange={(e) => handleInputChange('billingPostalCode', e.target.value)}
                              required={!formData.useSameAddress}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="billingCountry">Ülke *</Label>
                          <Input
                            id="billingCountry"
                            value={formData.billingCountry}
                            onChange={(e) => handleInputChange('billingCountry', e.target.value)}
                            required={!formData.useSameAddress}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="mr-2 h-5 w-5" />
                      Teslimat Seçenekleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.shippingMethod === 'standard' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleInputChange('shippingMethod', 'standard')}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value="standard"
                            checked={formData.shippingMethod === 'standard'}
                            onChange={() => handleInputChange('shippingMethod', 'standard')}
                            className="text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium">Standart Teslimat</div>
                            <div className="text-sm text-gray-600">3-5 iş günü</div>
                            <div className="text-sm text-gray-600">₺50 (500₺ üzeri ücretsiz)</div>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.shippingMethod === 'express' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleInputChange('shippingMethod', 'express')}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value="express"
                            checked={formData.shippingMethod === 'express'}
                            onChange={() => handleInputChange('shippingMethod', 'express')}
                            className="text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium">Hızlı Teslimat</div>
                            <div className="text-sm text-gray-600">1-2 iş günü</div>
                            <div className="text-sm text-gray-600">₺75 (500₺ üzeri ücretsiz)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-blue-900">Kargo Bilgileri</div>
                          <div className="text-blue-700 mt-1">
                            • Kargo ücreti <strong>kapıda</strong> alıcı tarafından ödenir<br/>
                            • Tahmini ücret, adres ve paket ölçülerine göre hesaplanır<br/>
                            • Takip numarası oluşturulunca paylaşılır
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sipariş Notları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Siparişiniz hakkında özel notlarınız..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Phone className="mr-2 h-5 w-5" />
                      Onay Süreci
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Phone className="h-6 w-6 text-green-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-green-900 mb-2">WhatsApp Onay Süreci</div>
                          <div className="text-sm text-green-700 space-y-1">
                            <p>• Siparişiniz oluşturulduktan sonra WhatsApp üzerinden onaylanacaktır</p>
                            <p>• Müşteri hizmetlerimiz en kısa sürede sizinle iletişime geçecektir</p>
                            <p>• Onay sonrası ödeme bilgileri paylaşılacaktır</p>
                            <p>• Sipariş takip numaranız: <strong>MDH-YYYYMMDD-XXXX</strong> formatında</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </form>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sipariş Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {item.product.product_images && item.product.product_images.length > 0 ? (
                            <Image
                              src={item.product.product_images[0].url}
                              alt={item.product.product_images[0].alt || item.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                          <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                            {item.quantity}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                          <p className="text-xs text-gray-600">
                            {item.quantity} × ₺{item.product.price.toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          ₺{(item.product.price * item.quantity).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ara Toplam</span>
                      <span>₺{subtotal.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Kargo</span>
                      <span>
                        {shipping === 0 ? (
                          <span className="text-green-600">Ücretsiz</span>
                        ) : (
                          `₺${shipping.toLocaleString('tr-TR')}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>KDV (%18)</span>
                      <span>₺{tax.toLocaleString('tr-TR')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Toplam</span>
                      <span>₺{total.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    type="submit"
                    form="checkout-form"
                    disabled={submitting}
                    className="w-full"
                    size="lg"
                    onClick={(e) => {
                      console.log('🔘 Button clicked!', { 
                        type: e.currentTarget.type, 
                        form: e.currentTarget.form?.id,
                        submitting,
                        cartItems: cartItems.length 
                      });
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sipariş Oluşturuluyor...
                      </>
                    ) : (
                      `Sipariş Oluştur - ₺${total.toLocaleString('tr-TR')}`
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Favorite Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm">
                    <Heart className="mr-2 h-4 w-4" />
                    Favori Ürünler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {favoriteItems.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 mb-3">
                        Favori ürünlerinizi hızlıca sepete ekleyebilirsiniz.
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {favoriteItems.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 p-2 border rounded-lg hover:bg_gray-50">
                            <div className="relative w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {item.product.product_images && item.product.product_images.length > 0 ? (
                                <Image
                                  src={item.product.product_images[0].url}
                                  alt={item.product.product_images[0].alt || item.product.name}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items_center justify-center">
                                  <span className="text-gray-400 text-xs">No Image</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-xs truncate">{item.product.name}</h4>
                              <p className="text-xs text-gray-600">
                                ₺{item.product.price.toLocaleString('tr-TR')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddFavoriteToCart(item.product.id)}
                              className="text-xs px-2 py-1 h-6"
                            >
                              + Ekle
                            </Button>
                          </div>
                        ))}
                      </div>
                      {favoriteItems.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{favoriteItems.length - 3} daha fazla ürün
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Heart className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Henüz favori ürününüz yok</p>
                      <Link href="/products" className="text-xs text-blue-600 hover:underline">
                        Ürünleri keşfet
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Notices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm">
                    <Shield className="mr-2 h-4 w-4" />
                    Güvenlik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-xs text-gray-600">
                    <div className="flex items-start space-x-2">
                      <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-900">Güvenli Alışveriş</div>
                        <div>SSL sertifikası ile korunmaktadır</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-blue-900">KVKK Uyumlu</div>
                        <div>Kişisel verileriniz güvende</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Link href="/privacy" className="text-blue-600 hover:underline">Gizlilik Politikası</Link>
                      <span className="mx-2">•</span>
                      <Link href="/terms" className="text-blue-600 hover:underline">Kullanım Şartları</Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4" />
                    İletişim Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-xs text-gray-600">
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">Müşteri Hizmetleri</div>
                      <div className="space-y-1">
                        <div>📞 +90 555 123 45 67</div>
                        <div>📧 info@meridesignhouse.com</div>
                        <div>🕒 09:00 - 18:00 (Pazartesi-Cuma)</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">WhatsApp Destek</div>
                      <div className="space-y-1">
                        <div>💬 Anında yanıt</div>
                        <div>📱 7/24 destek</div>
                        <div>🔗 Sipariş takibi</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Siparişiniz Oluşturuldu!</h2>
              <p className="text-gray-600 mb-4">
                Siparişiniz onay sürecinde. Onay için WhatsApp üzerinden en kısa sürede iletişime geçilecektir.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="text-sm text-gray-600 mb-2">Sipariş Takip Numarası:</div>
                <div className="flex items-center justify-center space-x-2">
                  <code className="bg-white px-3 py-1 rounded border text-lg font-mono">
                    {orderNumber}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyOrderNumber}
                    className="flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => router.push('/orders')}
                  className="flex-1"
                >
                  Siparişlerim
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="flex-1"
                >
                  Anasayfa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}