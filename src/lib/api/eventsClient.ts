'use client'

import { callRpc } from './rpcClient'
import type { EventType, ThemeStyle } from '@/types/event'

export function fetchEventTypes() {
  return callRpc<EventType[]>('events:fetchEventTypes')
}

export function fetchThemeStyles() {
  return callRpc<ThemeStyle[]>('events:fetchThemeStyles')
}

