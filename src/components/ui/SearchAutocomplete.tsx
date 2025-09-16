'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useDebounce } from '@/hooks/useDebounce'
import { getSearchSuggestions, getPopularSearches, logSearch, SearchSuggestion } from '@/lib/actions/search'
import { formatPrice } from '../../lib/utils'
import Image from 'next/image'

interface SearchAutocompleteProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
}

export function SearchAutocomplete({ 
  placeholder = "Ürün, kategori veya set ara...", 
  className = "",
  onSearch
}: SearchAutocompleteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const debouncedQuery = useDebounce(query, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Load popular searches on mount
  useEffect(() => {
    const loadPopularSearches = async () => {
      const popular = await getPopularSearches()
      setPopularSearches(popular)
    }
    loadPopularSearches()
  }, [])

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length >= 2) {
        setIsLoading(true)
        const results = await getSearchSuggestions(debouncedQuery)
        setSuggestions(results)
        setIsLoading(false)
      } else {
        setSuggestions([])
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))

    // Log search
    logSearch(searchQuery)

    // Navigate to search page
    router.push(`/products?query=${encodeURIComponent(searchQuery)}`)
    setIsOpen(false)
    setQuery('')
    
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'product') {
      router.push(`/products/${suggestion.slug}`)
    } else if (suggestion.type === 'category') {
      router.push(`/categories/${suggestion.slug}`)
    } else if (suggestion.type === 'bundle') {
      router.push(`/bundles/${suggestion.slug}`)
    }
    setIsOpen(false)
    setQuery('')
  }

  const handleRecentSearchClick = (search: string) => {
    setQuery(search)
    handleSearch(search)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const showDropdown = isOpen && (query.length >= 2 || recentSearches.length > 0 || popularSearches.length > 0)

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setSuggestions([])
                inputRef.current?.focus()
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => handleSearch(query)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100000000] max-h-96 overflow-y-auto">
          {/* Loading */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Öneriler
              </div>
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                >
                  {suggestion.image && (
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src={suggestion.image}
                        alt={suggestion.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        suggestion.type === 'product' 
                          ? 'bg-blue-100 text-blue-800' 
                          : suggestion.type === 'category'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                      }`}>
                        {suggestion.type === 'product' ? 'Ürün' : suggestion.type === 'category' ? 'Kategori' : 'Set'}
                      </span>
                    </div>
                    {suggestion.price && (
                      <div className="text-sm text-gray-600 mt-1">
                        {formatPrice(suggestion.price)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {!isLoading && query.length < 2 && recentSearches.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Son Aramalar
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Temizle
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                >
                  <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {!isLoading && query.length < 2 && popularSearches.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Popüler Aramalar
              </div>
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= 2 && suggestions.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">&quot;<span className="font-medium">{query}</span>&quot; için sonuç bulunamadı</p>
              <p className="text-xs mt-1">Farklı anahtar kelimeler deneyebilirsiniz</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}