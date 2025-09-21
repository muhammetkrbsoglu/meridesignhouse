import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  PersonalizationAnswer,
  PersonalizationConfig,
  PersonalizationField,
  PersonalizationPayload,
} from '@/types/personalization'

export type PersonalizationValue = {
  value: string | string[] | null
  displayValue?: string
  metadata?: Record<string, any> | null
}

type PersonalizationState = Record<string, PersonalizationValue>

type PersonalizationHookResult = {
  fields: PersonalizationField[]
  values: PersonalizationState
  touched: Record<string, boolean>
  setFieldValue: (fieldKey: string, value: PersonalizationValue) => void
  markTouched: (fieldKey: string) => void
  touchAll: () => void
  errors: Record<string, string | null>
  isComplete: boolean
  buildPayload: () => PersonalizationPayload | null
  reset: () => void
}

const isEmptyValue = (value: string | string[] | null) => {
  if (Array.isArray(value)) {
    return value.length === 0
  }
  if (typeof value === 'string') {
    return value.trim().length === 0
  }
  return value === null
}

const initialiseState = (config: PersonalizationConfig | null): PersonalizationState => {
  const initial: PersonalizationState = {}
  if (config?.fields) {
    for (const field of config.fields) {
      initial[field.key] = { value: null, displayValue: undefined, metadata: null }
    }
  }
  return initial
}

export const usePersonalization = (config: PersonalizationConfig | null): PersonalizationHookResult => {
  const [state, setState] = useState<PersonalizationState>(() => initialiseState(config))
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setState(initialiseState(config))
    setTouched({})
  }, [config])

  const fields = useMemo(() => config?.fields ?? [], [config])

  const setFieldValue = useCallback((fieldKey: string, value: PersonalizationValue) => {
    setState((prev) => ({
      ...prev,
      [fieldKey]: value,
    }))
  }, [])

  const markTouched = useCallback((fieldKey: string) => {
    setTouched((prev) => ({ ...prev, [fieldKey]: true }))
  }, [])

  const touchAll = useCallback(() => {
    const next: Record<string, boolean> = {}
    for (const field of fields) {
      next[field.key] = true
    }
    setTouched(next)
  }, [fields])

  const errors = useMemo(() => {
    const result: Record<string, string | null> = {}
    for (const field of fields) {
      const entry = state[field.key]
      if (field.isRequired) {
        if (!entry || isEmptyValue(entry.value)) {
          result[field.key] = 'Bu alan zorunludur.'
          continue
        }
      }
      result[field.key] = null
    }
    return result
  }, [fields, state])

  const isComplete = useMemo(() => {
    if (!config?.requireCompletion) {
      return true
    }
    return fields.every((field) => {
      if (!field.isRequired) return true
      const entry = state[field.key]
      return entry && !isEmptyValue(entry.value)
    })
  }, [config?.requireCompletion, fields, state])

  const buildPayload = useCallback((): PersonalizationPayload | null => {
    if (!config || fields.length === 0) {
      return null
    }

    const answers: PersonalizationAnswer[] = fields
      .map((field) => {
        const entry = state[field.key] || { value: null }
        if (isEmptyValue(entry.value)) {
          if (!field.isRequired) {
            return null
          }
        }
        return {
          fieldKey: field.key,
          fieldLabel: field.label,
          type: field.type,
          value: entry.value,
          displayValue: entry.displayValue,
          metadata: entry.metadata ?? null,
        }
      })
      .filter((answer): answer is PersonalizationAnswer => Boolean(answer && !isEmptyValue(answer.value)))

    const completed = config.requireCompletion ? isComplete : answers.length > 0

    return {
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
      answers,
    }
  }, [config, fields, isComplete, state])

  const reset = useCallback(() => {
    setState(initialiseState(config))
    setTouched({})
  }, [config])

  return {
    fields,
    values: state,
    touched,
    setFieldValue,
    markTouched,
    touchAll,
    errors,
    isComplete,
    buildPayload,
    reset,
  }
}
