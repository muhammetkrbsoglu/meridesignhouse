type Booleanish = string | undefined | null

function toBool(value: Booleanish, defaultValue: boolean): boolean {
  if (value === undefined || value === null) return defaultValue
  const v = String(value).trim().toLowerCase()
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false
  return defaultValue
}

export const config = {
  cronSecret: process.env.CRON_SECRET || '',

  // Feature flags
  shipping: {
    enablePolling: toBool(process.env.SHIPPING_ENABLE_POLLING, true),
    estimateOnly: toBool(process.env.SHIPPING_ESTIMATE_ONLY, true),
  },

  // Carrier credentials (placeholders)
  dhl: {
    apiKey: process.env.DHL_API_KEY || '',
    apiSecret: process.env.DHL_API_SECRET || '',
    accountNumber: process.env.DHL_ACCOUNT_NUMBER || '',
  },
  surat: {
    username: process.env.SURAT_USERNAME || '',
    password: process.env.SURAT_PASSWORD || '',
    customerCode: process.env.SURAT_CUSTOMER_CODE || '',
  },
}


