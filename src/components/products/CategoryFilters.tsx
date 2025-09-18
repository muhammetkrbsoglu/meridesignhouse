'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface CategoryFiltersProps {
  categorySlug: string;
}

const sortOptions = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'oldest', label: 'En Eski' },
  { value: 'price-asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price-desc', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'name-asc', label: 'İsim: A-Z' },
  { value: 'name-desc', label: 'İsim: Z-A' },
];

export function CategoryFilters({ categorySlug }: CategoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentSort = searchParams.get('sort') || 'newest';
  const currentSortLabel = sortOptions.find(option => option.value === currentSort)?.label || 'En Yeni';

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (sortValue === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', sortValue);
    }
    
    // Reset to first page when sorting changes
    params.delete('page');
    
    const queryString = params.toString();
    const url = `/categories/${categorySlug}${queryString ? `?${queryString}` : ''}`;
    
    router.push(url);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* Results Info */}
      <div className="text-sm text-gray-600">
        <span>Ürünler sıralanıyor</span>
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full sm:w-48 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
        >
          <span>{currentSortLabel}</span>
          <ChevronDownIcon 
            className={`ml-2 h-4 w-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 z-20 w-full sm:w-48 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="py-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                      currentSort === option.value
                        ? 'bg-rose-50 text-rose-600 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
