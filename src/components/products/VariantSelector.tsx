'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { ProductOption, ProductOptionValue } from '@/types/product'

interface VariantSelectorProps {
  options: ProductOption[]
  selectedValues: Record<string, string | null | undefined>
  onSelect: (optionId: string, valueId: string) => void
  isValueAvailable?: (optionId: string, valueId: string) => boolean
  disabled?: boolean
  className?: string
}

const renderValueLabel = (
  option: ProductOption,
  value: ProductOptionValue,
  isSelected: boolean,
  isAvailable: boolean,
  onSelect: () => void,
) => {
  const commonClasses = cn(
    'relative flex items-center justify-center rounded-full border text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-300',
    'min-w-[44px] px-3 py-2 uppercase tracking-wide sm:min-w-[48px]',
    isSelected
      ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-sm'
      : 'border-gray-200 bg-white text-gray-700 hover:border-rose-200 hover:text-rose-600',
    !isAvailable && 'cursor-not-allowed opacity-40 hover:border-gray-200 hover:text-gray-500',
  )

  if (option.displayType === 'swatch') {
    return (
      <button
        key={value.id}
        type="button"
        onClick={onSelect}
        disabled={!isAvailable}
        className={cn(
          'flex flex-col items-center gap-1 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-300',
          !isAvailable && 'pointer-events-none',
        )}
        aria-pressed={isSelected}
      >
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors',
            isSelected ? 'border-rose-500 shadow-sm' : 'border-transparent',
            !isAvailable && 'opacity-40',
          )}
          style={{ backgroundColor: value.hexValue || '#f5f5f5' }}
        />
        <span className={cn('text-[10px] font-medium uppercase text-gray-600', isSelected && 'text-rose-600')}>
          {value.label || value.value}
        </span>
      </button>
    )
  }

  if (option.displayType === 'pill') {
    return (
      <button key={value.id} type="button" onClick={onSelect} disabled={!isAvailable} className={commonClasses} aria-pressed={isSelected}>
        {value.label || value.value}
      </button>
    )
  }

  return (
    <button
      key={value.id}
      type="button"
      onClick={onSelect}
      disabled={!isAvailable}
      className={cn(
        'rounded-lg border px-4 py-2 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-300',
        isSelected ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-sm' : 'border-gray-200 hover:border-rose-200 hover:text-rose-600',
        !isAvailable && 'cursor-not-allowed opacity-40 hover:border-gray-200 hover:text-gray-500',
      )}
      aria-pressed={isSelected}
    >
      {value.label || value.value}
    </button>
  )
}

export const VariantSelector = memo(function VariantSelector({
  options,
  selectedValues,
  onSelect,
  isValueAvailable,
  disabled = false,
  className,
}: VariantSelectorProps) {
  if (!options || options.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {options.map((option) => {
        const selectedValueId = selectedValues[option.id]
        const optionValues = (option.values || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

        return (
          <div key={option.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{option.label}</span>
                {selectedValueId && (
                  <span className="text-xs text-gray-500">
                    {(option.values || []).find((value) => value.id === selectedValueId)?.label || 'Seçildi'}
                  </span>
                )}
              </div>
            </div>
            <div
              className={cn(
                'flex flex-wrap gap-2 sm:gap-3',
                option.displayType === 'swatch' && 'gap-4 sm:gap-5',
                option.displayType === 'text' && 'gap-2.5',
                'max-w-full',
                'pt-1',
                option.displayType === 'swatch' && 'pt-2',
              )}
            >
              {optionValues.map((value) => {
                const isSelected = selectedValueId === value.id
                const isAvailable = !disabled && (isValueAvailable ? isValueAvailable(option.id, value.id) : true)

                const handleSelect = () => {
                  if (disabled || !isAvailable) return
                  onSelect(option.id, value.id)
                }

                return renderValueLabel(option, value, Boolean(isSelected), isAvailable, handleSelect)
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
})
