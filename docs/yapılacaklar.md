# Yapılacaklar (Faz 5 Öncesi Teknik Hazırlık Planı)

Bu dosya, Faz 5 (Canvas tabanlı Tasarım Editörü) geliştirmesine başlamadan önce yapılacak teknik hazırlıkları, borçları ve kabul kriterlerini içerir. Şu an uygulanmayacak, ileride referans olarak kullanılacaktır.

## Amaç
- Faz 5’e sağlam bir zemin hazırlamak: tutarlı API/guard, standart veri erişimi, güçlü tip sözleşmeleri, güvenlik ve performans temelleri.
- Admin ve kullanıcı akışlarında editörün gerektirdiği eksik kenar durumlarını kapatmak.

## Önkoşullar ve Bağımlılıklar
- Tasarım verisinin saklanması ve siparişle ilişkisi (büyük JSON, `OrderItem.designData`).
- Güvenli medya akışı (ImageKit), yetkilendirme, büyük state yönetimi (Zustand), performans.

## Teknik Borçlar ve Düzeltmeler

### Backend
- Guard import tutarlılığı: tüm controller’lar `backend/src/auth/clerk.guard.ts`’i kullansın.
- Auth uçları: `auth/profile` hata yanıtlarını standardize et (401/403/404 ayrımı), log ve rate-limit ekle.
- Global güvenlik/perf: `helmet`, `compression`, `cors` prod whitelist ile aktif.
- Logging & error handling: global exception filter, request-id, structured logs.
- Prisma performansı: yalnız gerekli alanları seç, indeksleri gözden geçir, N+1 risklerini azalt; DTO filtre/limit/sort validasyonu sıkılaştır.
- Rate limiting: Auth ve kritik uçlara IP/Token bazlı sınırlama.

### Frontend
- Sabit URL’ler: sayfalardaki `http://localhost:3001` çağrılarını env tabanlı servis katmanına taşı.
- Servis standardizasyonu: `apiClient` (baseURL, JSON parse, hata haritalama, opsiyonel `Authorization`, no-store, retry)
- Tip uyumu: `shared/types` güncelle ve senkronize et; `Category`, `ProductFilter` vb. hizala.
- Hata/Yükleniyor durumları: profile/messages/orders/checkout için tutarlı UI (Toast + boş veri durumları).
- Global senk: giriş sonrası cart/wishlist senk akışı; race condition guard’ları.

## Güvenlik
- Auth header zorunluluğu: token yoksa 401; frontend’de yönlendirme.
- Input validation: DTO’larda class-validator kuralları (min/max/regex/enum).
- Medya güvenliği: ImageKit imzalı yükleme, mime/limit kontrolleri, URL imzalama.
- CORS: prod origin whitelist; gereksiz geniş izinleri kapat.

## Performans
- API sayfalama ve caching: tüm liste uçlarında limit/offset + stabil sort; Next tarafında ISR/CDN planı.
- Görsel optimizasyonu: ImageKit parametreleri (boyut/kalite); responsive görseller.
- Frontend: code-splitting, lazy, `Suspense` kullanım alanları.

## DevOps ve Ortam
- Ortam değişkenleri: `.env`/`.env.local` doğrulaması (`NEXT_PUBLIC_API_URL`, Clerk, ImageKit, vb.).
- CI/CD: install → build → test → lint → type-check pipeline; PR zorunlulukları.
- Deployment: Vercel (frontend), backend host/Docker; CORS/Origins ayarı.
- Monitoring/Analytics: Microsoft Clarity’i `layout.tsx`’e ekle; basit hata izleme.

## Admin Panel Hazırlıkları (Faz 6’ya Zemin)
- Ürün/Kategori/Sipariş yönetimi: CRUD formları, ImageKit upload, sayfalama/arama, sipariş durum güncelleme akışı.
- WhatsApp yönlendirme tetikleyicileri.
- Yetki: Admin guard/rol kontrolünün UI karşılığı.

## Mesajlaşma (Opsiyonel Ön Hazırlık)
- Backend hazır; frontend’i servis katmanına taşı; mesaj durum tipleri (PENDING/READ/REPLIED) ve order seçimi için tipler netleştir.

## Faz 5 İçin Altyapı Hazırlıkları
- Veri modeli: `OrderItem.designData` kullanılacak; kullanıcıya özel kalıcı tasarımlar için gerekirse `Design` modeli değerlendirilebilir.
- Tasarım JSON şeması: `shared/types/design.ts` ile tip tanımı (katmanlar, elementler, metin/font/renk/pozisyon, ölçek/rotation, z-index).
- Medya/Asset: editor elementleri için ImageKit klasör yapısı ve erişim kuralları.
- API uçları: `GET /designs/templates`, `POST /designs`, `GET /designs/:id`, `PUT /designs/:id`, `DELETE /designs/:id` servis sözleşmeleri ve frontend servisleri.
- Performans: büyük JSON state için Zustand store, undo/redo, throttled autosave (debounce), snapshot stratejisi.

## Kabul Kriterleri
- Backend: tekil guard kaynağı; CORS/helmet/compression aktif; kritik uçlarda rate-limit; DTO validasyonları güncel; tüm liste uçlarında sayfalama+filtre+sort.
- Frontend: sabit URL yok; tüm istekler `apiClient` üzerinden; token otomatik ekleniyor; sayfalarda tutarlı loading/error/empty state; shared tipler güncel; build/type-check temiz.
- DevOps: CI yeşil (lint, type-check, unit/integration); Vercel preview; Clarity aktif.
- Hazırlık: tasarım verisi tipleri ve servis sözleşmeleri net; ImageKit akışı tanımlı.

## Riskler ve Azaltma
- Auth model farkları: Clerk kullanıcı alanlarını shared tip ile normalize et.
- Performans: büyük tasarım JSON’larında lag → incremental save + debounced persist + sanallaştırma.
- Tip drift: Backend/Frontend ayrışması → `shared/types` tek kaynak, workspace senkronu.

## Önerilen Zaman Planı
- Gün 1: Backend güvenlik/perf (helmet/cors/compression/rate-limit), guard konsolidasyonu, DTO validasyon gözden geçirme.
- Gün 2: Frontend `apiClient`, sabit URL refactor, token enjeksiyon standardı; profile/messages/orders servisleştirme.
- Gün 3: Shared tip senkronu; Product/Category filtre tipleri; messages/order tipleri.
- Gün 4: CI/CD pipeline; Vercel preview; Clarity entegrasyonu.
- Gün 5: Admin hazırlıkları (listeler, sayfalama/arama, sipariş durum UI).
- Gün 6: Faz 5 altyapısı (design JSON tipi, servis sözleşmeleri, ImageKit klasör planı).
- Gün 7: Kabul kriterleri kontrolü, düzeltmeler, dokümantasyon güncellemesi.

---

Not: Bu dosya, Project.md ve ROADMAP.md ile uyumludur; kısıt ve teknoloji seçimleri RULES.md’e göre belirlenmiştir.
