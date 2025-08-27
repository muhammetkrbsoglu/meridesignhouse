export type DesignTemplate = {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  elements: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class DesignService {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  static async getTemplates(query?: string): Promise<DesignTemplate[]> {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.request<DesignTemplate[]>(`/designs/templates${q}`);
  }

  static async createDesign(token: string, payload: { name: string; description?: string; designData: Record<string, any>; templateId?: string; isPublic?: boolean; }) {
    return this.request(`/designs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  }

  static async updateDesign(token: string, id: string, payload: Partial<{ name: string; description?: string; designData: Record<string, any>; templateId?: string; isPublic?: boolean; }>) {
    return this.request(`/designs/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  }
}


