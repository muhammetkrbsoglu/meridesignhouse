Mobile typography adjustments (date: 2025-09-19)

Scope: Minimal font-size and truncation tweaks for better mobile fit. No structural/layout changes.

1) src/components/products/ProductGrid.tsx
- Product name: text-base sm:text-lg (was text-lg)
- Description: text-xs sm:text-sm (was text-sm)
- Price: text-xl sm:text-2xl (was text-2xl)
- Original price: text-xs sm:text-sm (was text-sm)
- Category badge: added max-w-[70%] + truncate
- Stock row: added whitespace-nowrap on badges and quantity

2) src/components/home/FeaturedProducts.tsx
- Product name: text-base sm:text-lg (was text-lg)
- Description: text-xs sm:text-sm (was text-sm)
- Price: text-xl sm:text-2xl (was text-2xl)
- Original price: text-xs sm:text-sm (was text-sm)
- Discount badge: text-[11px] sm:text-xs (was text-xs)

3) src/components/home/NewArrivals.tsx
- Product name: text-base sm:text-lg (was text-lg)
- Price: text-lg sm:text-xl (was text-xl)

4) src/components/layout/BottomTabBar.tsx
- Product name: text-[13px] sm:text-sm (was text-sm)

5) src/app/categories/[slug]/page.tsx
- Section title: text-base sm:text-lg (was text-lg)
- Round discount badge text: text-[10px] sm:text-xs (was text-[9px])

6) src/components/layout/MobileCategoryMenu.tsx
- Product name in featured list: text-[11px] sm:text-xs (was text-xs)

7) src/app/about/page.tsx
- h1: text-3xl sm:text-4xl md:text-5xl (was text-4xl md:text-6xl lg:text-7xl)
- h2 story/misyon/vizyon/değerler: text-2xl sm:text-3xl md:text-4xl (was text-3xl md:text-4xl)
- h3 kart başlıkları: text-xl sm:text-2xl (was text-2xl)
- paragraflar: text-sm sm:text-base (was text-lg)
- kısa açıklamalar: text-base sm:text-lg (was text-lg)

8) src/app/contact/page.tsx
- h1: text-3xl sm:text-4xl (was text-4xl)
- intro paragraf: text-sm sm:text-base (was text-lg)
- CardTitle (WhatsApp/Instagram): text-base sm:text-lg (was default)
- CardDescription: text-xs sm:text-sm (was default)
- Form başlıkları: CardTitle text-base sm:text-lg; CardDescription text-xs sm:text-sm (was default)

9) src/app/profile/page.tsx
- h1: text-2xl sm:text-3xl (was text-3xl)
- intro paragraf: text-sm sm:text-base (was default)

10) src/app/orders/page.tsx
- Başlık: text-2xl sm:text-3xl (was text-3xl)
- Intro paragraf: text-sm sm:text-base (was default)
- Arama CardTitle: text-base sm:text-lg (was default)
- Label: text-xs sm:text-sm (was default)
- Destek dropdown: text-[13px] sm:text-sm (was default)
- Özet metinleri: text-xs sm:text-sm (was text-sm)
- Toplam tutar: text-base sm:text-lg (was text-lg)

Revert instructions:
- Revert this commit or restore the original class names stated above per file.

