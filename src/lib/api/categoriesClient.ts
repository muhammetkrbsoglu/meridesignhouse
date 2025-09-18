'use client'

import { callRpc } from './rpcClient'
import type { CategoryWithChildren } from '@/types/category'

export function fetchAllMainCategoriesWithHierarchy() {
  return callRpc<CategoryWithChildren[]>('categories:fetchAllMainCategoriesWithHierarchy')
}

