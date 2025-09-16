'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface CategoryFiltersProps {
  currentSort?: string;
  minPrice?: number;
  maxPrice?: number;
  priceRange?: [number, number];
}

export function CategoryFilters({ 
  currentSort = 'newest',
  minPrice = 0,
  maxPrice = 10000,
  priceRange = [0, 10000]
}: CategoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);

  useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  const updateSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset to first page when filters change
    params.delete('page');
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    updateSearchParams('sort', value);
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    setLocalPriceRange(value);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (localPriceRange[0] > minPrice) {
      params.set('minPrice', localPriceRange[0].toString());
    } else {
      params.delete('minPrice');
    }
    
    if (localPriceRange[1] < maxPrice) {
      params.set('maxPrice', localPriceRange[1].toString());
    } else {
      params.delete('maxPrice');
    }
    
    // Reset to first page when filters change
    params.delete('page');
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    const query = searchParams.get('query');
    
    if (query) {
      params.set('query', query);
    }
    
    router.push(`${pathname}?${params.toString()}`);
    setLocalPriceRange([minPrice, maxPrice]);
  };

  const hasActiveFilters = 
    currentSort !== 'newest' || 
    priceRange[0] > minPrice || 
    priceRange[1] < maxPrice;

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sıralama
        </label>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sıralama seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">En Yeni</SelectItem>
            <SelectItem value="oldest">En Eski</SelectItem>
            <SelectItem value="price-asc">Fiyat (Düşük → Yüksek)</SelectItem>
            <SelectItem value="price-desc">Fiyat (Yüksek → Düşük)</SelectItem>
            <SelectItem value="name">İsim (A → Z)</SelectItem>
            <SelectItem value="popularity">Popülerlik</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fiyat Aralığı
        </label>
        <div className="px-2">
          <Slider
            value={localPriceRange}
            onValueChange={handlePriceRangeChange}
            max={maxPrice}
            min={minPrice}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{formatCurrency(localPriceRange[0])}</span>
            <span>{formatCurrency(localPriceRange[1])}</span>
          </div>
          <Button 
            onClick={applyPriceFilter}
            className="w-full mt-3"
            size="sm"
          >
            Fiyat Filtresini Uygula
          </Button>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <Button 
            onClick={clearFilters}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Filtreleri Temizle
          </Button>
        </div>
      )}
    </div>
  );
}