'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchProps {
  placeholder?: string;
  categorySlug?: string;
  className?: string;
}

export function Search({ 
  placeholder = "Ürün ara...", 
  categorySlug,
  className = ""
}: SearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedSearchTerm) {
      params.set('query', debouncedSearchTerm);
    } else {
      params.delete('query');
    }
    
    // Reset to first page when search changes
    params.delete('page');
    
    const queryString = params.toString();
    
    if (categorySlug) {
      const url = `/categories/${categorySlug}${queryString ? `?${queryString}` : ''}`;
      router.push(url);
    } else {
      // Global arama → tüm ürünler sayfası
      const url = `/products${queryString ? `?${queryString}` : ''}`;
      router.push(url);
    }
  }, [debouncedSearchTerm, router, searchParams, categorySlug]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className={`relative z-[100000000] ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
        />
        
        {searchTerm && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Search suggestions could be added here in the future */}
    </div>
  );
}