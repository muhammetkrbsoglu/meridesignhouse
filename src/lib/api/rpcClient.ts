'use client'

interface RpcResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function callRpc<T = unknown>(action: string, args: any[] = []): Promise<T> {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({ action, args }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Sunucu hatası')
  }

  const payload: RpcResponse<T> = await response.json()

  if (!payload.success) {
    throw new Error(payload.error || 'İşlem tamamlanamadı')
  }

  return payload.data as T
}
