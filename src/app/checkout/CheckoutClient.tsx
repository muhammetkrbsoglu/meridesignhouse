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
import { getCartItems, getFavoriteItems, addToCart } from '@/lib/actions/cart';
import { listUserAddresses } from '@/lib/actions/profile';
import { supabase } from '@/lib/supabase-browser';
import { Loader2, ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { MicroFeedback, HoverCard } from '@/components/motion/MicroFeedback';
import { Skeleton } from '@/components/motion/LoadingStates';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface CheckoutClientProps {
  initialAddresses: any[];
}

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
    product_images: Array<{ url: string; alt: string | null; sortOrder: number | null }>;
    category: { name: string } | null;
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

export default function CheckoutClient({ initialAddresses }: CheckoutClientProps) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [_addresses, setAddresses] = useState<any[]>(initialAddresses || []);
  const [_favoriteItems, setFavoriteItems] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { success, light, medium, error } = useHapticFeedback();
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
      await addToCart(productId, 1);
      toast.success('Ürün sepete eklendi');
      loadCartItems();
    } catch {
      toast.error('Sepete eklenirken hata oluştu');
    }
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInputFocus = (field: string) => {
    setFocusedField(field);
    light('Form alanına odaklanıldı');
  };

  const handleInputBlur = (field: string) => {
    setFocusedField(null);
    // Basic validation
    const value = formData[field as keyof CheckoutFormData];
    if (typeof value === 'string' && value.trim() === '' && field.includes('shipping')) {
      setErrors(prev => ({ ...prev, [field]: 'Bu alan zorunludur' }));
      error('Form hatası');
    }
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
      error('Sepet boş');
      return;
    }
    
    // Validate required fields
    const requiredFields = ['shippingFullName', 'shippingAddress', 'shippingCity', 'shippingDistrict', 'shippingPhone'];
    const newErrors: Record<string, string> = {};
    
    requiredFields.forEach(field => {
      const value = formData[field as keyof CheckoutFormData];
      if (typeof value === 'string' && value.trim() === '') {
        newErrors[field] = 'Bu alan zorunludur';
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      error('Form hatası');
      return;
    }
    
    setSubmitting(true);
    medium('Sipariş oluşturuluyor');
    
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
        success('Sipariş başarıyla oluşturuldu');
      } else {
        toast.error(result.error || 'Sipariş oluşturulurken hata oluştu');
        error('Sipariş hatası');
      }
    } catch {
      toast.error('Bir hata oluştu');
      error('Sipariş hatası');
    } finally {
      setSubmitting(false);
    }
  };

  const { total } = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Skeleton className="h-8 w-48 mb-4" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Label htmlFor="shippingFullName">Ad Soyad *</Label>
                  <HoverCard
                    className={`relative ${errors.shippingFullName ? 'animate-pulse' : ''}`}
                    shimmer={focusedField === 'shippingFullName'}
                    hapticType="light"
                    hapticMessage="Ad soyad alanı"
                  >
                    <Input 
                      id="shippingFullName" 
                      value={formData.shippingFullName} 
                      onChange={(e) => handleInputChange('shippingFullName', e.target.value)}
                      onFocus={() => handleInputFocus('shippingFullName')}
                      onBlur={() => handleInputBlur('shippingFullName')}
                      required 
                      autoComplete="name" 
                      inputMode="text"
                      className={`transition-all duration-200 ${
                        errors.shippingFullName 
                          ? 'border-red-500 ring-2 ring-red-500/20' 
                          : focusedField === 'shippingFullName'
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : ''
                      }`}
                    />
                    {errors.shippingFullName && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.shippingFullName}
                      </motion.p>
                    )}
                  </HoverCard>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Label htmlFor="shippingPhone">Telefon *</Label>
                  <HoverCard
                    className={`relative ${errors.shippingPhone ? 'animate-pulse' : ''}`}
                    shimmer={focusedField === 'shippingPhone'}
                    hapticType="light"
                    hapticMessage="Telefon alanı"
                  >
                    <Input 
                      id="shippingPhone" 
                      value={formData.shippingPhone} 
                      onChange={(e) => handleInputChange('shippingPhone', e.target.value)}
                      onFocus={() => handleInputFocus('shippingPhone')}
                      onBlur={() => handleInputBlur('shippingPhone')}
                      required 
                      type="tel" 
                      inputMode="tel" 
                      autoComplete="tel" 
                      placeholder="05xx xxx xx xx"
                      className={`transition-all duration-200 ${
                        errors.shippingPhone 
                          ? 'border-red-500 ring-2 ring-red-500/20' 
                          : focusedField === 'shippingPhone'
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : ''
                      }`}
                    />
                    {errors.shippingPhone && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.shippingPhone}
                      </motion.p>
                    )}
                  </HoverCard>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Label htmlFor="shippingAddress">Adres *</Label>
                <HoverCard
                  className={`relative ${errors.shippingAddress ? 'animate-pulse' : ''}`}
                  shimmer={focusedField === 'shippingAddress'}
                  hapticType="light"
                  hapticMessage="Adres alanı"
                >
                  <Textarea 
                    id="shippingAddress" 
                    value={formData.shippingAddress} 
                    onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                    onFocus={() => handleInputFocus('shippingAddress')}
                    onBlur={() => handleInputBlur('shippingAddress')}
                    required 
                    rows={3} 
                    autoComplete="street-address"
                    className={`transition-all duration-200 ${
                      errors.shippingAddress 
                        ? 'border-red-500 ring-2 ring-red-500/20' 
                        : focusedField === 'shippingAddress'
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : ''
                    }`}
                  />
                  {errors.shippingAddress && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1"
                    >
                      {errors.shippingAddress}
                    </motion.p>
                  )}
                </HoverCard>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <Label htmlFor="shippingCity">Şehir *</Label>
                  <HoverCard
                    className={`relative ${errors.shippingCity ? 'animate-pulse' : ''}`}
                    shimmer={focusedField === 'shippingCity'}
                    hapticType="light"
                    hapticMessage="Şehir alanı"
                  >
                    <Input 
                      id="shippingCity" 
                      value={formData.shippingCity} 
                      onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                      onFocus={() => handleInputFocus('shippingCity')}
                      onBlur={() => handleInputBlur('shippingCity')}
                      required 
                      autoComplete="address-level2"
                      className={`transition-all duration-200 ${
                        errors.shippingCity 
                          ? 'border-red-500 ring-2 ring-red-500/20' 
                          : focusedField === 'shippingCity'
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : ''
                      }`}
                    />
                    {errors.shippingCity && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.shippingCity}
                      </motion.p>
                    )}
                  </HoverCard>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <Label htmlFor="shippingDistrict">İlçe *</Label>
                  <HoverCard
                    className={`relative ${errors.shippingDistrict ? 'animate-pulse' : ''}`}
                    shimmer={focusedField === 'shippingDistrict'}
                    hapticType="light"
                    hapticMessage="İlçe alanı"
                  >
                    <Input 
                      id="shippingDistrict" 
                      value={formData.shippingDistrict} 
                      onChange={(e) => handleInputChange('shippingDistrict', e.target.value)}
                      onFocus={() => handleInputFocus('shippingDistrict')}
                      onBlur={() => handleInputBlur('shippingDistrict')}
                      required 
                      autoComplete="address-level3"
                      className={`transition-all duration-200 ${
                        errors.shippingDistrict 
                          ? 'border-red-500 ring-2 ring-red-500/20' 
                          : focusedField === 'shippingDistrict'
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : ''
                      }`}
                    />
                    {errors.shippingDistrict && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.shippingDistrict}
                      </motion.p>
                    )}
                  </HoverCard>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  <Label htmlFor="shippingPostalCode">Posta Kodu *</Label>
                  <HoverCard
                    className={`relative ${errors.shippingPostalCode ? 'animate-pulse' : ''}`}
                    shimmer={focusedField === 'shippingPostalCode'}
                    hapticType="light"
                    hapticMessage="Posta kodu alanı"
                  >
                    <Input 
                      id="shippingPostalCode" 
                      value={formData.shippingPostalCode} 
                      onChange={(e) => handleInputChange('shippingPostalCode', e.target.value)}
                      onFocus={() => handleInputFocus('shippingPostalCode')}
                      onBlur={() => handleInputBlur('shippingPostalCode')}
                      required 
                      inputMode="numeric" 
                      autoComplete="postal-code"
                      className={`transition-all duration-200 ${
                        errors.shippingPostalCode 
                          ? 'border-red-500 ring-2 ring-red-500/20' 
                          : focusedField === 'shippingPostalCode'
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : ''
                      }`}
                    />
                    {errors.shippingPostalCode && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-1"
                      >
                        {errors.shippingPostalCode}
                      </motion.p>
                    )}
                  </HoverCard>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{item.product.name} × {item.quantity}</span>
                      <span className="text-sm font-medium">₺{(item.product.price * item.quantity).toLocaleString('tr-TR')}</span>
                    </motion.div>
                  ))}
                  <Separator className="my-2" />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1.0 }}
                    className="flex justify-between text-sm font-semibold"
                  >
                    <span>Toplam</span>
                    <span className="text-rose-600">₺{total.toLocaleString('tr-TR')}</span>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.1 }}
            className="hidden lg:block"
          >
            <MicroFeedback
              onClick={() => {}}
              className="w-full"
              hapticType="medium"
              hapticMessage="Sipariş oluştur"
            >
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Sipariş Oluşturuluyor...' : `Sipariş Oluştur - ₺${total.toLocaleString('tr-TR')}`}
              </Button>
            </MicroFeedback>
          </motion.div>
        </form>
      </div>

      {/* Sticky submit bar (mobile) with Motion */}
      <motion.div 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[999] bg-white/95 backdrop-blur supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)] border-t"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <motion.div 
            className="flex-1"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-xs text-gray-500">Ödenecek Tutar</div>
            <motion.div 
              className="text-lg font-semibold text-rose-600"
              key={total}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              ₺{total.toLocaleString('tr-TR')}
            </motion.div>
          </motion.div>
          <MicroFeedback
            onClick={() => {}}
            className="flex-1"
            hapticType="medium"
            hapticMessage="Siparişi tamamla"
          >
            <Button form="checkout-form" type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Oluşturuluyor...' : 'Siparişi Tamamla'}
            </Button>
          </MicroFeedback>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.h2 
                className="text-xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                Siparişiniz Oluşturuldu!
              </motion.h2>
              <motion.p 
                className="text-sm text-gray-600 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                Takip numarası: <code className="px-2 py-1 bg-gray-100 rounded">{orderNumber}</code>
              </motion.p>
              <motion.div 
                className="flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <MicroFeedback
                  onClick={() => router.push('/orders')}
                  className="flex-1"
                  hapticType="success"
                  hapticMessage="Siparişlerim sayfasına git"
                >
                  <Button className="flex-1">Siparişlerim</Button>
                </MicroFeedback>
                <MicroFeedback
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1"
                  hapticType="light"
                  hapticMessage="Modalı kapat"
                >
                  <Button className="flex-1" variant="outline">Kapat</Button>
                </MicroFeedback>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


