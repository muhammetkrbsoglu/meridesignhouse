'use client'

import { callRpc } from './rpcClient'
import type { ContactFormData } from '@/lib/actions/messages'

export function createContactMessage(payload: ContactFormData) {
  return callRpc('messages:createContactMessage', [payload])
}

export function backfillMessageUserIds() {
  return callRpc('messages:backfillMessageUserIds')
}
