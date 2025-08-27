import type { Category } from '@shared/types/category';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class CategoryService {
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

  static async getCategories(): Promise<Category[]> {
    return this.makeRequest<Category[]>('/categories');
  }

  static async getCategoriesPublic(): Promise<Category[]> {
    return this.makeRequest<Category[]>('/categories');
  }

  static async getCategory(id: string): Promise<Category> {
    return this.makeRequest<Category>(`/categories/${id}`);
  }

  static async getCategoryBySlug(slug: string): Promise<Category> {
    return this.makeRequest<Category>(`/categories/slug/${slug}`);
  }

  static async getCategoryTree(): Promise<Category[]> {
    return this.makeRequest<Category[]>('/categories/tree');
  }
}
