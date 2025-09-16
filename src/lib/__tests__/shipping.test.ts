import { calculateChargeableWeightKg, recommendCheapestService } from '../shipping'

describe('Shipping Utils', () => {
  describe('calculateChargeableWeightKg', () => {
    it('should calculate chargeable weight correctly for standard package', () => {
      const result = calculateChargeableWeightKg({
        actualWeightKg: 1.5,
        dimensionsCm: {
          length: 30,
          width: 20,
          height: 10
        }
      })
      
      expect(result).toBeCloseTo(1.5) // max(1.5, 1.2)
    })

    it('should use volumetric weight when higher than actual weight', () => {
      const result = calculateChargeableWeightKg({
        actualWeightKg: 0.5,
        dimensionsCm: {
          length: 50,
          width: 40,
          height: 30
        }
      })
      
      expect(result).toBeCloseTo(12.0) // max(0.5, 12.0)
    })

    it('should handle edge case with zero dimensions', () => {
      const result = calculateChargeableWeightKg({
        actualWeightKg: 2.0,
        dimensionsCm: {
          length: 0,
          width: 0,
          height: 0
        }
      })
      
      expect(result).toBe(2.0)
    })
  })

  describe('recommendCheapestService', () => {
    it('should return SURAT recommendation for standard package', () => {
      const result = recommendCheapestService({
        actualWeightKg: 2.0,
        dimensionsCm: {
          length: 30,
          width: 20,
          height: 10
        }
      })
      
      expect(result.carrier).toBe('SURAT')
      expect(result.serviceCode).toBe('STD')
      expect(result.serviceName).toBe('Sürat Standart')
      expect(result.currency).toBe('TRY')
      expect(result.total).toBeGreaterThan(0)
    })

    it('should handle remote area requests', () => {
      const result = recommendCheapestService({
        actualWeightKg: 1.0,
        dimensionsCm: {
          length: 25,
          width: 15,
          height: 8
        }
      }, { remoteArea: true })
      
      expect(result.carrier).toBe('SURAT')
      expect(result.components.remoteArea).toBe(25)
    })
  })
})
