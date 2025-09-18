'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getWhatsAppMessages } from '@/lib/actions/whatsapp-messages';
import { fetchProductById } from '@/lib/actions/products';
import { getPresetImageUrl } from '@/lib/imagekit';

interface WhatsAppMessage {
  id: string;
  customer_name: string;
  product_id: string;
  screenshot_url: string;
  alt_text: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  template_type?: 'whatsapp' | 'instagram';
}

interface Product {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

interface HappyCustomersProps {
  messages?: WhatsAppMessage[];
}

const defaultMessages: WhatsAppMessage[] = [
  {
    id: '1',
    customer_name: 'Büşra Hanım',
    product_id: 'bubble-mum',
    screenshot_url: '/placeholder-whatsapp-1.jpg',
    alt_text: 'WhatsApp ekran görüntüsü 1',
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_type: 'whatsapp'
  },
  {
    id: '2',
    customer_name: 'Ayşe Hanım',
    product_id: 'decorative-candle',
    screenshot_url: '/placeholder-whatsapp-2.jpg',
    alt_text: 'WhatsApp ekran görüntüsü 2',
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_type: 'whatsapp'
  },
  {
    id: '3',
    customer_name: 'Fatma Hanım',
    product_id: 'scented-candle',
    screenshot_url: '/placeholder-whatsapp-3.jpg',
    alt_text: 'WhatsApp ekran görüntüsü 3',
    is_active: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template_type: 'whatsapp'
  }
];

export default function HappyCustomers({ messages: initialMessages }: HappyCustomersProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>(initialMessages || []);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Load messages from database
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const dbMessages = await getWhatsAppMessages();
        if (dbMessages.length > 0) {
          setMessages(dbMessages);
        }
      } catch (error) {
        console.error('Error loading WhatsApp messages:', error);
      }
    };

    if (!initialMessages || initialMessages.length === 0) {
      loadMessages();
    }
  }, [initialMessages]);

  // Load current product
  useEffect(() => {
    const loadCurrentProduct = async () => {
      if (messages.length > 0) {
        try {
          const product = await fetchProductById(messages[currentMessageIndex]?.product_id);
          setCurrentProduct(product);
        } catch (error) {
          console.error('Error loading product:', error);
        }
      }
    };

    loadCurrentProduct();
  }, [messages, currentMessageIndex]);

  // Otomatik kaydırma
  useEffect(() => {
    if (isHovered || messages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length, isHovered]);

  const currentMessage = messages[currentMessageIndex];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-rose-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Başlık */}
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            💬 Müşteri Yorumları
          </motion.div>
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Memnun Müşterilerimizden Gelenler
          </motion.h2>
          <motion.p 
            className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Müşterilerimizin deneyimlerini ve tercihlerini keşfedin
          </motion.p>
        </motion.div>

        {/* Ana İçerik */}
        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-3 lg:gap-16">
          {/* Sol: Ürün Kartı */}
          <motion.div 
            className="flex flex-col items-center text-center lg:items-end lg:text-right"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="w-full max-w-sm rounded-xl border border-rose-200 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="inline-block bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
                ⭐ Müşteri Tercihi
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {currentMessage?.customer_name}'ın Tercihi
              </h3>
              <p className="text-rose-600 font-semibold mb-4">{currentProduct?.name || 'Ürün yükleniyor...'}</p>
              <div className="mt-4 h-48 w-full rounded-lg overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 relative">
                {currentProduct?.image ? (
                  <Image
                    src={currentProduct.image}
                    alt={currentProduct.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🖼️</div>
                      <span className="text-rose-500 font-medium">Ürün Görseli</span>
                    </div>
                  </div>
                )}
              </div>
              {currentProduct?.slug ? (
                <Link 
                  href={`/products/${currentProduct.slug}`}
                  className="mt-4 inline-block w-full rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 px-4 py-3 text-center font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Ürünü İncele
                </Link>
              ) : (
                <div className="mt-4 inline-block w-full rounded-lg bg-gray-400 px-4 py-3 text-center font-semibold text-white cursor-not-allowed">
                  Ürün Yükleniyor...
                </div>
              )}
            </div>
          </motion.div>

          {/* Merkez: Telefon Maketi */}
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <div 
              className="phone-mockup mt-8"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="phone-screen">
                 {messages.map((message, index) => (
                   <div
                     key={message.id}
                     className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                       index === currentMessageIndex 
                         ? 'opacity-100 translate-y-0' 
                         : index < currentMessageIndex
                         ? 'opacity-0 -translate-y-full'
                         : 'opacity-0 translate-y-full'
                     }`}
                   >
                     <Image
                       src={getPresetImageUrl(message.screenshot_url, 'whatsappMessage')}
                       alt={message.alt_text}
                       fill
                       className="absolute inset-0 w-full h-full object-cover"
                     />
                   </div>
                 ))}
              </div>
            </div>

          </motion.div>

          {/* Sağ: Değer Metni */}
          <motion.div 
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="w-full max-w-sm">
              <div className="inline-block bg-gradient-to-r from-purple-100 to-rose-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
                ✨ Değer Teklifimiz
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Modern ve Rekabetçi
              </h3>
              <p className="text-lg leading-8 text-gray-600">
                Yüksek kaliteli ürünleri uygun fiyatlarla sunarak müşteri memnuniyetini en üst düzeyde tutuyoruz. 
                Modern tasarım ve rekabetçi fiyatlarımızla her zaman yanınızdayız.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                  🎯 Kalite Garantisi
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                  💰 Uygun Fiyat
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  🚀 Hızlı Teslimat
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

    </section>
  );
}

