export type PersonalizationFieldType = 'text' | 'textarea' | 'date' | 'select' | 'catalog' | 'note';

export interface PersonalizationCatalogTemplate {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  recommendedSizes?: string[];
  tags?: string[];
}

export interface PersonalizationFieldOption {
  value: string;
  label: string;
  description?: string;
  imageUrl?: string;
  metadata?: Record<string, any> | null;
}

export interface PersonalizationField {
  id: string;
  key: string;
  label: string;
  type: PersonalizationFieldType;
  placeholder?: string;
  helperText?: string;
  isRequired?: boolean;
  sortOrder?: number;
  options?: PersonalizationFieldOption[];
  metadata?: Record<string, any> | null;
}

export interface PersonalizationConfigSettings {
  catalogTemplates?: PersonalizationCatalogTemplate[];
  requireCatalogBeforeSize?: boolean;
  [key: string]: any;
}

export interface PersonalizationConfig {
  id: string;
  productId: string;
  requireCompletion: boolean;
  stepCount: number;
  settings?: PersonalizationConfigSettings;
  fields: PersonalizationField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonalizationAnswer {
  fieldKey: string;
  fieldLabel: string;
  type: PersonalizationFieldType;
  value: string | string[] | null;
  displayValue?: string;
  metadata?: Record<string, any> | null;
}

export interface PersonalizationPayload {
  completed: boolean;
  completedAt?: string;
  answers: PersonalizationAnswer[];
}
