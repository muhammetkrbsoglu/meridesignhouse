# MeriDesignHouse Geliştirme Kuralları

## 📋 Genel Geliştirme Prensipleri

### 🎯 Kod Kalitesi
- **TypeScript Strict Mode**: Tüm kod TypeScript ile yazılmalı ve strict mode aktif olmalı
- **ESLint & Prettier**: Kod formatlaması ve linting kurallarına uyulmalı
- **Type Safety**: Any type kullanımından kaçınılmalı, proper typing yapılmalı
- **Error Handling**: Tüm async işlemler try-catch ile sarılmalı

### 🏗️ Mimari Kuralları
- **Component Structure**: Atomic design prensiplerine uygun component yapısı
- **Separation of Concerns**: Business logic, UI logic ve data logic ayrı tutulmalı
- **Single Responsibility**: Her component/function tek bir sorumluluğa sahip olmalı
- **DRY Principle**: Kod tekrarından kaçınılmalı, reusable componentler yazılmalı

## 📁 Dosya ve Klasör Yapısı

### Klasör Organizasyonu
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth group routes
│   ├── admin/             # Admin panel routes
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   └── [feature]/        # Feature-specific components
├── lib/                  # Utility libraries
│   ├── actions/          # Server actions
│   ├── hooks/            # Custom hooks
│   └── utils/            # Helper functions
├── types/                # TypeScript type definitions
└── styles/               # Global styles
```

### Dosya Adlandırma
- **Components**: PascalCase (örn: `ProductCard.tsx`)
- **Pages**: kebab-case (örn: `product-detail.tsx`)
- **Utilities**: camelCase (örn: `formatPrice.ts`)
- **Types**: PascalCase (örn: `ProductTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE (örn: `API_ENDPOINTS.ts`)

## 🎨 UI/UX Geliştirme Kuralları

### Design System
- **Shadcn/ui**: Base component library olarak kullanılmalı
- **Tailwind CSS**: Styling için Tailwind utility classes kullanılmalı
- **Responsive Design**: Mobile-first approach ile responsive tasarım
- **Accessibility**: WCAG 2.1 AA standartlarına uygun geliştirme

### Component Geliştirme
```typescript
// ✅ Doğru component yapısı
interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  className?: string;
}

export function ProductCard({ product, onAddToCart, className }: ProductCardProps) {
  // Component logic
}

// ❌ Yanlış - props typing yok
export function ProductCard(props: any) {
  // ...
}
```

### State Management
- **Local State**: useState hook'u ile basit state yönetimi
- **Global State**: Context API veya Zustand ile global state
- **Server State**: React Query/SWR ile server state yönetimi
- **Form State**: React Hook Form ile form state yönetimi

## 🔧 Backend Geliştirme Kuralları

### API Geliştirme
- **RESTful Design**: REST API prensiplerine uygun endpoint tasarımı
- **Error Handling**: Consistent error response formatı
- **Validation**: Zod ile input validation
- **Authentication**: Supabase Auth ile güvenli authentication

### Veritabanı Kuralları
```typescript
// ✅ Doğru Prisma model yapısı
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  String
  
  @@map("products")
}
```

### Server Actions
```typescript
// ✅ Doğru server action yapısı
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  categoryId: z.string()
})

export async function createProduct(formData: FormData) {
  try {
    const validatedFields = createProductSchema.parse({
      name: formData.get('name'),
      price: Number(formData.get('price')),
      categoryId: formData.get('categoryId')
    })
    
    // Database operation
    const product = await prisma.product.create({
      data: validatedFields
    })
    
    revalidatePath('/admin/products')
    return { success: true, product }
  } catch (error) {
    return { success: false, error: 'Failed to create product' }
  }
}
```

## 🔒 Güvenlik Kuralları

### Authentication & Authorization
- **Row Level Security**: Supabase RLS policies kullanılmalı
- **Input Validation**: Tüm user input'ları validate edilmeli
- **SQL Injection**: Prisma ORM ile güvenli database queries
- **XSS Protection**: User content'i sanitize edilmeli

### Environment Variables
```bash
# ✅ Doğru env variable yapısı
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="..."
IMAGEKIT_PUBLIC_KEY="..."
IMAGEKIT_PRIVATE_KEY="..."
```

## 📊 Performance Kuralları

### Image Optimization
- **ImageKit**: Tüm görseller ImageKit üzerinden serve edilmeli
- **Lazy Loading**: Görseller lazy loading ile yüklenmeli
- **WebP Format**: Modern image formatları kullanılmalı
- **Responsive Images**: Farklı ekran boyutları için optimize edilmiş görseller

### Code Splitting
```typescript
// ✅ Doğru dynamic import
const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel'), {
  loading: () => <AdminPanelSkeleton />,
  ssr: false
})

// ❌ Yanlış - tüm component'i import etme
import AdminPanel from '@/components/admin/AdminPanel'
```

### Caching Strategy
- **Static Generation**: Mümkün olduğunca static generation kullanılmalı
- **ISR**: Dynamic content için Incremental Static Regeneration
- **Client Caching**: React Query ile client-side caching
- **CDN**: Static assets için CDN kullanımı

## 🧪 Test Kuralları

### Unit Testing
```typescript
// ✅ Doğru test yapısı
import { render, screen } from '@testing-library/react'
import { ProductCard } from './ProductCard'

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99
  }
  
  it('should render product name', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })
})
```

### Integration Testing
- **API Routes**: API endpoint'leri test edilmeli
- **Database Operations**: Prisma operations test edilmeli
- **User Flows**: Critical user journeys test edilmeli

## 🚀 Deployment Kuralları

### Build Process
```bash
# ✅ Production build checklist
npm run lint          # Linting kontrolü
npm run type-check    # TypeScript kontrolü
npm run test          # Test suite
npm run build         # Production build
```

### Environment Setup
- **Development**: Local development environment
- **Staging**: Production benzeri test environment
- **Production**: Live production environment

### Database Migrations
```bash
# ✅ Doğru migration workflow
npx prisma migrate dev --name add_new_field
npx prisma generate
npx prisma db push
```

## 📝 Dokümantasyon Kuralları

### Code Documentation
```typescript
// ✅ Doğru JSDoc yapısı
/**
 * Calculates the total price including tax
 * @param price - Base price of the product
 * @param taxRate - Tax rate as decimal (e.g., 0.18 for 18%)
 * @returns Total price including tax
 */
function calculateTotalPrice(price: number, taxRate: number): number {
  return price * (1 + taxRate)
}
```

### Component Documentation
- **Props Interface**: Tüm props açıklanmalı
- **Usage Examples**: Component kullanım örnekleri
- **Storybook**: UI component'leri için Storybook stories

## 🔄 Git Workflow

### Branch Strategy
```bash
main                 # Production branch
develop             # Development branch
feature/feature-name # Feature branches
hotfix/fix-name     # Hotfix branches
```

### Commit Messages
```bash
# ✅ Doğru commit message formatı
feat: add product search functionality
fix: resolve cart calculation bug
docs: update API documentation
style: format code with prettier
refactor: optimize image loading
test: add unit tests for ProductCard
```

### Pull Request Rules
- **Code Review**: En az 1 kişi tarafından review edilmeli
- **Tests**: Tüm testler geçmeli
- **Linting**: Lint hataları olmamalı
- **Documentation**: Gerekli dokümantasyon güncellenmiş olmalı

## ⚠️ Yasaklanan Pratikler

### Kod Kalitesi
- ❌ `any` type kullanımı
- ❌ `console.log` production'da bırakma
- ❌ Hardcoded values
- ❌ Inline styles (Tailwind hariç)
- ❌ Direct DOM manipulation

### Güvenlik
- ❌ Sensitive data'yı client-side'da expose etme
- ❌ SQL queries'i string concatenation ile oluşturma
- ❌ User input'u validate etmeden kullanma
- ❌ API keys'i frontend'de expose etme

### Performance
- ❌ Büyük bundle'lar oluşturma
- ❌ Unnecessary re-renders
- ❌ Memory leaks
- ❌ Blocking operations on main thread

## 📞 Yardım ve Destek

### Code Review Checklist
- [ ] TypeScript errors yok
- [ ] ESLint warnings yok
- [ ] Tests geçiyor
- [ ] Performance impact değerlendirildi
- [ ] Security implications kontrol edildi
- [ ] Documentation güncellendi

### Debugging Guidelines
1. **Console Errors**: Browser console'da error var mı?
2. **Network Tab**: API calls başarılı mı?
3. **React DevTools**: Component state doğru mu?
4. **Database Logs**: Database operations başarılı mı?

---

**Son Güncelleme:** 2024-01-24  
**Versiyon:** 1.0  
**Geçerlilik:** Tüm proje boyunca