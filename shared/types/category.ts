export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  imageUrl?: string;
  description?: string;
  order: number;
  isActive: boolean;
  children?: Category[];
  createdAt: Date;
  updatedAt: Date;
}
