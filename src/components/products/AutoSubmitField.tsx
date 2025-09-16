"use client"

import React from 'react'
import { FunnelIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

type HiddenParam = { name: string; value: string }

export function AutoSubmitNumberInput({
  action,
  name,
  defaultValue,
  step = '0.01',
  hidden = [],
  label,
  className,
}: {
  action: string
  name: string
  defaultValue?: number | string
  step?: string
  hidden?: HiddenParam[]
  label?: string
  className?: string
}) {
  return (
    <form action={action} className={className}>
      {hidden.map((h) => (
        <input key={`${h.name}-${h.value}`} type="hidden" name={h.name} value={h.value} />
      ))}
      {label && <div className="text-xs text-gray-500 mb-1">{label}</div>}
      <input
        className="w-full border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        name={name}
        defaultValue={defaultValue ?? ''}
        type="number"
        step={step}
        onChange={(e) => {
          (e.currentTarget.form as HTMLFormElement)?.requestSubmit()
        }}
      />
    </form>
  )
}

export function AutoSubmitSelect({
  action,
  name,
  defaultValue,
  options,
  hidden = [],
  className,
  label,
}: {
  action: string
  name: string
  defaultValue?: string
  options: { value: string; label: string }[]
  hidden?: HiddenParam[]
  className?: string
  label?: string
}) {
  return (
    <form action={action} className={className}>
      {hidden.map((h) => (
        <input key={`${h.name}-${h.value}`} type="hidden" name={h.name} value={h.value} />
      ))}
      {label && <div className="text-xs text-gray-500 mb-1">{label}</div>}
      <div className="relative inline-flex items-center">
        <FunnelIcon className="h-4 w-4 text-gray-400 absolute left-2 pointer-events-none" />
        <select
          name={name}
          defaultValue={defaultValue}
          className="appearance-none border rounded-md pl-8 pr-8 py-1.5 text-xs bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          onChange={(e) => {
            (e.currentTarget.form as HTMLFormElement)?.requestSubmit()
          }}
          aria-label={label || 'Sırala'}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDownIcon className="h-4 w-4 text-gray-400 absolute right-2 pointer-events-none" />
      </div>
    </form>
  )
}
