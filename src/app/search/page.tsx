import { redirect } from 'next/navigation';

interface SearchPageProps {
  searchParams?: {
    query?: string;
    page?: string;
    sort?: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name' | 'popularity';
    minPrice?: string;
    maxPrice?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  
  // Kalıcı yönlendirme: /search → /products (parametreleri koruyarak)
  const params = new URLSearchParams();
  if (sp?.query) params.set('query', sp.query);
  if (sp?.page) params.set('page', sp.page);
  if (sp?.sort) params.set('sort', sp.sort);
  if (sp?.minPrice) params.set('minPrice', sp.minPrice);
  if (sp?.maxPrice) params.set('maxPrice', sp.maxPrice);
  
  const redirectUrl = `/products${params.toString() ? `?${params.toString()}` : ''}`;
  redirect(redirectUrl);
}