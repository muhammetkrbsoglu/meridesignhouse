import type { Product, ProductResponse, ProductFilter as ProductFilters } from '@shared/types/product';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ProductService {
  private static async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async getProducts(filters: ProductFilters = {}): Promise<{ products: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    
    const res = await this.makeRequest<ProductResponse>(endpoint);
    return {
      products: res.products,
      pagination: {
        page: res.page,
        limit: res.limit,
        total: res.total,
        totalPages: res.totalPages,
      },
    };
  }

  static async getProduct(id: string): Promise<Product> {
    return this.makeRequest<Product>(`/products/${id}`);
  }

  static async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    try {
      return await this.makeRequest<Product[]>(`/products/featured?limit=${limit}`);
    } catch (e) {
      // Fallback to generic products endpoint with isFeatured filter if backend expects it
      const params = new URLSearchParams({ limit: String(limit), isFeatured: 'true' });
      const res = await this.makeRequest<ProductResponse>(`/products?${params.toString()}`);
      return res.products;
    }
  }

  static async getNewProducts(limit: number = 8): Promise<Product[]> {
    return this.makeRequest<Product[]>(`/products/new?limit=${limit}`);
  }

  static async getProductsByCategory(categoryId: string, filters: ProductFilters = {}): Promise<{ products: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/products/category/${categoryId}${queryString ? `?${queryString}` : ''}`;
    
    const res = await this.makeRequest<ProductResponse>(endpoint);
    return {
      products: res.products,
      pagination: {
        page: res.page,
        limit: res.limit,
        total: res.total,
        totalPages: res.totalPages,
      },
    };
  }

  static async searchProducts(query: string, filters: ProductFilters = {}): Promise<{ products: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    return this.getProducts({
      ...filters,
      search: query,
    });
  }
}
