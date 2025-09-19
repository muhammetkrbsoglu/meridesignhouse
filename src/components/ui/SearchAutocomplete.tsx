'use client'

import { useState, useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useDebounce } from '@/hooks/useDebounce'
import { getSearchSuggestions, getPopularSearches, logSearch, SearchSuggestion } from '@/lib/actions/search'
import { formatPrice } from '../../lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { fetchFeaturedProducts } from '@/lib/actions/products'

interface SearchAutocompleteProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  autoFocus?: boolean
  maxSuggestions?: number
  footerContent?: ReactNode
  onNavigate?: () => void
}

export function SearchAutocomplete({
  placeholder = 'Urun, kategori veya set ara...',
  className = '',
  onSearch,
  autoFocus = false,
  maxSuggestions,
  footerContent,
  onNavigate
}: SearchAutocompleteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [weeklyProduct, setWeeklyProduct] = useState<any>(null)
  const [weeklyProductLoading, setWeeklyProductLoading] = useState(false)

  const debouncedQuery = useDebounce(query, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = 'search-suggestions'

  // Lock body scroll when search is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  const limitedSuggestions = typeof maxSuggestions === 'number' && maxSuggestions >= 0
    ? suggestions.slice(0, maxSuggestions)
    : suggestions

  // Auto focus when requested
  useEffect(() => {
    if (!autoFocus) return
    if (typeof window === 'undefined') return
    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
    return () => window.clearTimeout(timer)
  }, [autoFocus])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Load popular searches and weekly product on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [searches, featured] = await Promise.all([
          getPopularSearches(),
          fetchFeaturedProducts(1)
        ])
        setPopularSearches(searches)
        setWeeklyProduct(featured[0] || null)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
  }, [])


  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length >= 2) {
        setIsLoading(true)
        setLoadError(null)

        try {
          const result = await getSearchSuggestions(debouncedQuery)
          setSuggestions(result.suggestions)
          setLoadError(result.hadError ? 'Arama onerilerinin bir kismi yuklenemedi. Enter ile tam arama yapabilirsiniz.' : null)
        } catch (error) {
          console.error('Arama onerileri alinirken hata olustu:', error)
          setSuggestions([])
          setLoadError('Arama onerileri su anda yuklenemiyor. Enter ile aramayi tamamlayabilirsiniz.')
        } finally {
          setIsLoading(false)
        }
      } else {
        setSuggestions([])
        setIsLoading(false)
        setLoadError(null)
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

    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))

    logSearch(searchQuery)

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
    if (onNavigate) {
      onNavigate()
    }
  }

  const handleRecentSearchClick = (search: string) => {
    setQuery(search)
    handleSearch(search)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch(query)
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const hasDropdownContent =
    query.length >= 2 ||
    recentSearches.length > 0 ||
    popularSearches.length > 0 ||
    Boolean(footerContent)

  const showDropdown = isOpen && hasDropdownContent

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <label htmlFor="site-search" className="sr-only">Site ici arama</label>
        <input
          id="site-search"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Site ici arama"
          aria-haspopup="listbox"
          aria-controls={showDropdown ? listboxId : undefined}
          className="w-full rounded-full border border-white/40 bg-white/30 pl-5 pr-14 py-3 text-base shadow-[0_16px_40px_-30px_rgba(15,23,42,0.55)] transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-200"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 transform flex items-center space-x-2">
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setSuggestions([])
                setLoadError(null)
                inputRef.current?.focus()
              }}
              className="rounded-full bg-white/70 p-2 text-gray-500 shadow-sm transition hover:bg-white/90 hover:text-gray-700"
              type="button"
              aria-label="Arama metnini temizle"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => handleSearch(query)}
            className="rounded-full p-1 transition-colors hover:bg-gray-100"
            type="button"
            aria-label="Ara"
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Arama onerileri"
          className="absolute top-full left-0 right-0 z-[200] md:z-[100000] mt-3 max-h-fit overflow-y-auto rounded-2xl rounded-b-2xl md:rounded-3xl border border-white/25 bg-white/30 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.5)]"
        >
          {isLoading && (
            <div className="p-4 text-center text-gray-500" aria-live="polite">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" aria-hidden="true" />
              <span className="sr-only">Yukleniyor</span>
            </div>
          )}

          {!isLoading && limitedSuggestions.length > 0 && (
            <div className="border-b border-white/20">
              <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Oneriler
              </div>
              {limitedSuggestions.map((suggestion) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex w-full items-center space-x-3 px-4 py-3 text-left transition-colors hover:bg-white/70"
                  role="option"
                  aria-selected="false"
                  aria-label={`${suggestion.name} - ${suggestion.type === 'product' ? 'Urun' : suggestion.type === 'category' ? 'Kategori' : 'Set'}`}
                >
                  {suggestion.image && (
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100" aria-hidden="true">
                      <Image
                        src={suggestion.image}
                        alt={suggestion.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {suggestion.name}
                      </span>
                      <span
                        className={`text-xs rounded-full px-2 py-1 ${
                          suggestion.type === 'product'
                            ? 'bg-blue-100 text-blue-800'
                            : suggestion.type === 'category'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {suggestion.type === 'product' ? 'Urun' : suggestion.type === 'category' ? 'Kategori' : 'Set'}
                      </span>
                    </div>
                    {suggestion.price && (
                      <div className="mt-1 text-sm text-gray-600">
                        {formatPrice(suggestion.price)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {loadError && (
            <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50/80 border-b border-white/20">
              {loadError}
            </div>
          )}

          {!isLoading && query.length < 2 && recentSearches.length > 0 && (
            <div className="border-b border-white/20">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Son Aramalar
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-blue-600 transition-colors hover:text-blue-800"
                  type="button"
                  aria-label="Son aramalari temizle"
                >
                  Temizle
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className="flex w-full items-center space-x-3 px-4 py-2 text-left transition-colors hover:bg-white/70"
                  role="option"
                  aria-selected="false"
                  aria-label={`Son arama: ${search}`}
                >
                  <ClockIcon className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {!isLoading && query.length < 2 && popularSearches.length > 0 && (
            <div className="border-b border-white/20">
              <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Populer Aramalar
              </div>
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className="flex w-full items-center space-x-3 px-4 py-2 text-left transition-colors hover:bg-white/70"
                  role="option"
                  aria-selected="false"
                  aria-label={`Populer arama: ${search}`}
                >
                  <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Haftanın Seçimi - Sadece mobilde ve arama yapılmadığında göster */}
          {!isLoading && query.length < 2 && weeklyProduct && (
            <div className="border-t border-white/20">
              <div className="px-4 py-3 pb-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Haftanın Seçimi
                </div>
                <Link
                  href={`/products/${weeklyProduct.slug}`}
                  className="group block bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border-2 border-rose-200 hover:border-rose-300 hover:shadow-md transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex gap-3 p-3">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {weeklyProduct.imageUrl ? (
                        <Image
                          src={weeklyProduct.imageUrl}
                          alt={weeklyProduct.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-rose-600 transition-colors">
                        {weeklyProduct.name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {weeklyProduct.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-lg font-bold text-rose-600">
                          {formatPrice(weeklyProduct.price)}
                        </span>
                        <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-medium">
                          ⭐ Öne Çıkan
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {!isLoading && query.length >= 2 && limitedSuggestions.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500" aria-live="polite">
              <MagnifyingGlassIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" aria-hidden="true" />
              <p className="text-sm">
                &ldquo;<span className="font-medium">{query}</span>&rdquo; icin sonuc bulunamadi
              </p>
              <p className="mt-1 text-xs">Farkli anahtar kelimeler deneyebilirsiniz</p>
            </div>
          )}

          {footerContent && (
            <div className="border-t border-gray-100">
              {footerContent}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
