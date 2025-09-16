export type DimensionsCm = {
  length: number
  width: number
  height: number
}

export type PackageInput = {
  actualWeightKg: number
  dimensionsCm: DimensionsCm
}

export type ShippingQuote = {
  carrier: 'SURAT' | 'DHL'
  serviceCode: string
  serviceName: string
  currency: 'TRY'
  total: number
  components: {
    base: number
    fuel?: number
    remoteArea?: number
  }
  etaDays?: { min: number; max: number }
}

// Volumetric weight (kg) from cm using divisor typical for domestic ground services
export function calculateVolumetricWeightKg(dimensions: DimensionsCm, divisor = 5000): number {
  const { length, width, height } = dimensions
  if (length <= 0 || width <= 0 || height <= 0) return 0
  return +(length * width * height / divisor).toFixed(3)
}

export function calculateChargeableWeightKg(pkg: PackageInput): number {
  const volumetric = calculateVolumetricWeightKg(pkg.dimensionsCm)
  return Math.max(pkg.actualWeightKg || 0, volumetric)
}

// Simple placeholder tariff for SURAT (TRY). Real contract rates will replace this.
function suratBaseRatePerKg(chargeableKg: number): number {
  if (chargeableKg <= 1) return 59
  if (chargeableKg <= 2) return 69
  if (chargeableKg <= 3) return 79
  // per kg increment after 3 kg
  const extra = Math.ceil(chargeableKg - 3) * 12
  return 79 + extra
}

export function recommendCheapestService(pkg: PackageInput, opts?: { remoteArea?: boolean }): ShippingQuote {
  const chargeable = calculateChargeableWeightKg(pkg)

  // SURAT Standard (domestic)
  const suratBase = suratBaseRatePerKg(chargeable)
  const remote = opts?.remoteArea ? 25 : 0
  const fuel = +(suratBase * 0.08).toFixed(2)
  const suratTotal = +(suratBase + fuel + remote).toFixed(2)

  const suratQuote: ShippingQuote = {
    carrier: 'SURAT',
    serviceCode: 'STD',
    serviceName: 'Sürat Standart',
    currency: 'TRY',
    total: suratTotal,
    components: { base: suratBase, fuel, remoteArea: remote || undefined },
    etaDays: { min: 1, max: 3 }
  }

  // DHL is international; since we have only domestic now, keep as higher placeholder
  const dhlQuote: ShippingQuote = {
    carrier: 'DHL',
    serviceCode: 'DOM-EXP',
    serviceName: 'DHL Domestic Express (placeholder)',
    currency: 'TRY',
    total: +(suratTotal * 1.8).toFixed(2),
    components: { base: +(suratBase * 1.6).toFixed(2), fuel: +(fuel * 1.2).toFixed(2) },
    etaDays: { min: 1, max: 2 }
  }

  return suratQuote.total <= dhlQuote.total ? suratQuote : dhlQuote
}


