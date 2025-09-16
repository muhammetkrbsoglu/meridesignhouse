'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';

interface SearchResult {
  id: string;
  il: string;
  ilce: string;
  mahalle: string;
  postaKodu: string;
  fullAddress: string;
}

interface AddressSearchProps {
  onAddressSelect?: (address: {
    il: string;
    ilce: string;
    mahalle: string;
    postaKodu: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export function AddressSearch({ 
  onAddressSelect, 
  placeholder = "Adres ara...",
  className 
}: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Arama yap
  const searchAddresses = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/address/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
        setShowResults(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Adres arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAddresses(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Klavye navigasyonu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Sonucu seç
  const handleSelectResult = (result: SearchResult) => {
    setQuery(result.fullAddress);
    setShowResults(false);
    setSelectedIndex(-1);
    
    if (onAddressSelect) {
      onAddressSelect({
        il: result.il,
        ilce: result.ilce,
        mahalle: result.mahalle,
        postaKodu: result.postaKodu
      });
    }
  };

  // Input'a odaklan
  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  // Dışarı tıklama
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>

      {/* Arama Sonuçları */}
      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((result, index) => (
            <div
              key={result.id}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleSelectResult(result)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.mahalle}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {result.ilce}, {result.il}
                  </p>
                  <p className="text-xs text-gray-400">
                    {result.postaKodu}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sonuç bulunamadı */}
      {showResults && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            Sonuç bulunamadı
          </div>
        </div>
      )}
    </div>
  );
}
