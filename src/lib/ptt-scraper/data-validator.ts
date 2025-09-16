import * as fs from 'fs';
import * as path from 'path';

export interface AddressData {
  il: string;
  ilce: string;
  mahalle: string;
  postaKodu: string;
  koordinat?: {
    lat: number;
    lng: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export interface ValidationRule {
  name: string;
  description: string;
  validate: (data: AddressData) => { isValid: boolean; message?: string };
  weight: number;
}

export class PTTDataValidator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.rules = [
      {
        name: 'postaKoduFormat',
        description: 'Posta kodu 5 haneli sayı olmalı',
        validate: (data) => {
          const isValid = /^\d{5}$/.test(data.postaKodu);
          return {
            isValid,
            message: isValid ? undefined : `Geçersiz posta kodu formatı: ${data.postaKodu}`
          };
        },
        weight: 30
      },
      {
        name: 'postaKoduRange',
        description: 'Posta kodu geçerli aralıkta olmalı (01000-81999)',
        validate: (data) => {
          const postaKoduNum = parseInt(data.postaKodu);
          const isValid = postaKoduNum >= 1000 && postaKoduNum <= 81999;
          return {
            isValid,
            message: isValid ? undefined : `Posta kodu aralık dışında: ${data.postaKodu}`
          };
        },
        weight: 25
      },
      {
        name: 'ilFormat',
        description: 'İl adı büyük harfli ve geçerli olmalı',
        validate: (data) => {
          const isValid = /^[A-ZÇĞIİÖŞÜ\s]+$/.test(data.il) && data.il.length >= 2;
          return {
            isValid,
            message: isValid ? undefined : `Geçersiz il adı: ${data.il}`
          };
        },
        weight: 20
      },
      {
        name: 'ilceFormat',
        description: 'İlçe adı büyük harfli ve geçerli olmalı',
        validate: (data) => {
          const isValid = /^[A-ZÇĞIİÖŞÜ\s]+$/.test(data.ilce) && data.ilce.length >= 2;
          return {
            isValid,
            message: isValid ? undefined : `Geçersiz ilçe adı: ${data.ilce}`
          };
        },
        weight: 20
      },
      {
        name: 'mahalleFormat',
        description: 'Mahalle adı geçerli formatda olmalı',
        validate: (data) => {
          const hasValidSuffix = /MAH|KÖY|BEL|MAHALLESİ|KÖYÜ|BELEDİYESİ$/i.test(data.mahalle);
          const isValidLength = data.mahalle.length >= 3 && data.mahalle.length <= 100;
          const isValid = hasValidSuffix && isValidLength;
          return {
            isValid,
            message: isValid ? undefined : `Geçersiz mahalle adı: ${data.mahalle}`
          };
        },
        weight: 15
      },
      {
        name: 'postaKoduConsistency',
        description: 'Mahalle adındaki posta kodu ile postaKodu alanı tutarlı olmalı',
        validate: (data) => {
          const postaKoduFromMahalle = data.mahalle.match(/\b(\d{5})\b/)?.[1];
          const isValid = !postaKoduFromMahalle || postaKoduFromMahalle === data.postaKodu;
          return {
            isValid,
            message: isValid ? undefined : `Posta kodu tutarsızlığı: ${data.postaKodu} vs ${postaKoduFromMahalle}`
          };
        },
        weight: 25
      },
      {
        name: 'turkishCharacters',
        description: 'Türkçe karakterler doğru kullanılmalı',
        validate: (data) => {
          const hasInvalidChars = /[çÇğĞıIİöÖşŞüÜ]/.test(data.il + data.ilce + data.mahalle);
          const isValid = !hasInvalidChars;
          return {
            isValid,
            message: isValid ? undefined : `Türkçe karakter sorunu tespit edildi`
          };
        },
        weight: 10
      },
      {
        name: 'duplicateCheck',
        description: 'Aynı il-ilçe-mahalle kombinasyonu tekrar etmemeli',
        validate: (data) => {
          // Bu kural dataset seviyesinde kontrol edilir
          return { isValid: true };
        },
        weight: 15
      }
    ];
  }

  /**
   * Tek bir adres verisini doğrular
   */
  public validateAddress(address: AddressData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalWeight = 0;
    let validWeight = 0;

    for (const rule of this.rules) {
      if (rule.name === 'duplicateCheck') continue; // Dataset seviyesinde kontrol edilir
      
      const result = rule.validate(address);
      totalWeight += rule.weight;
      
      if (result.isValid) {
        validWeight += rule.weight;
      } else {
        if (rule.weight >= 20) {
          errors.push(result.message || `${rule.name} kuralı başarısız`);
        } else {
          warnings.push(result.message || `${rule.name} kuralı başarısız`);
        }
      }
    }

    const score = totalWeight > 0 ? Math.round((validWeight / totalWeight) * 100) : 0;
    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      score
    };
  }

  /**
   * Tüm veri setini doğrular
   */
  public validateDataset(data: AddressData[]): {
    results: ValidationResult[];
    summary: {
      totalAddresses: number;
      validAddresses: number;
      invalidAddresses: number;
      averageScore: number;
      totalErrors: number;
      totalWarnings: number;
      duplicateAddresses: number;
    };
  } {
    console.log('🔍 Veri doğrulama başlatılıyor...');
    
    const results: ValidationResult[] = [];
    const addressKeys = new Set<string>();
    let duplicateCount = 0;

    for (const address of data) {
      // Duplicate kontrolü
      const key = `${address.il}-${address.ilce}-${address.mahalle}`.toLowerCase();
      if (addressKeys.has(key)) {
        duplicateCount++;
        console.log(`⚠️ Duplicate adres: ${address.il} > ${address.ilce} > ${address.mahalle}`);
      } else {
        addressKeys.add(key);
      }

      const result = this.validateAddress(address);
      results.push(result);

      // Detaylı log
      if (!result.isValid) {
        console.log(`❌ ${address.il} > ${address.ilce} > ${address.mahalle} (${address.postaKodu})`);
        result.errors.forEach(error => console.log(`   ❌ ${error}`));
        result.warnings.forEach(warning => console.log(`   ⚠️ ${warning}`));
      }
    }

    // Özet istatistikler
    const validAddresses = results.filter(r => r.isValid).length;
    const invalidAddresses = results.length - validAddresses;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    const summary = {
      totalAddresses: data.length,
      validAddresses,
      invalidAddresses,
      averageScore: Math.round(averageScore),
      totalErrors,
      totalWarnings,
      duplicateAddresses: duplicateCount
    };

    console.log('✅ Veri doğrulama tamamlandı!');
    console.log(`📊 Toplam: ${summary.totalAddresses}, Geçerli: ${summary.validAddresses}, Geçersiz: ${summary.invalidAddresses}`);
    console.log(`📈 Ortalama Skor: ${summary.averageScore}%`);
    console.log(`❌ Hatalar: ${summary.totalErrors}, ⚠️ Uyarılar: ${summary.totalWarnings}`);
    console.log(`🔄 Duplicate: ${summary.duplicateAddresses}`);

    return { results, summary };
  }

  /**
   * Doğrulama raporu oluşturur
   */
  public generateValidationReport(validationResult: {
    results: ValidationResult[];
    summary: any;
  }): string {
    const { results, summary } = validationResult;
    
    const report = `
# PTT Veri Doğrulama Raporu

## 📊 Genel İstatistikler
- **Toplam Adres:** ${summary.totalAddresses}
- **Geçerli Adres:** ${summary.validAddresses} (${((summary.validAddresses / summary.totalAddresses) * 100).toFixed(1)}%)
- **Geçersiz Adres:** ${summary.invalidAddresses} (${((summary.invalidAddresses / summary.totalAddresses) * 100).toFixed(1)}%)
- **Ortalama Kalite Skoru:** ${summary.averageScore}%
- **Toplam Hata:** ${summary.totalErrors}
- **Toplam Uyarı:** ${summary.totalWarnings}
- **Duplicate Adres:** ${summary.duplicateAddresses}

## 🎯 Kalite Değerlendirmesi
${this.getQualityAssessment(summary.averageScore)}

## 📋 Kural Detayları
${this.getRuleDetails(results)}

## 🔧 Öneriler
${this.getRecommendations(summary)}
`;

    return report;
  }

  private getQualityAssessment(score: number): string {
    if (score >= 90) return '🟢 **Mükemmel** - Veri kalitesi çok yüksek';
    if (score >= 80) return '🟡 **İyi** - Veri kalitesi kabul edilebilir';
    if (score >= 70) return '🟠 **Orta** - Veri kalitesi iyileştirilmeli';
    return '🔴 **Düşük** - Veri kalitesi kritik seviyede';
  }

  private getRuleDetails(results: ValidationResult[]): string {
    const ruleStats = this.rules.map(rule => {
      const failedCount = results.filter(r => 
        r.errors.some(e => e.includes(rule.name)) || 
        r.warnings.some(w => w.includes(rule.name))
      ).length;
      
      return `- **${rule.name}**: ${rule.description} - ${failedCount} başarısız`;
    }).join('\n');

    return ruleStats;
  }

  private getRecommendations(summary: any): string {
    const recommendations = [];
    
    if (summary.averageScore < 80) {
      recommendations.push('- Veri temizleme algoritması güçlendirilmeli');
    }
    
    if (summary.totalErrors > summary.totalAddresses * 0.1) {
      recommendations.push('- Hata yönetimi iyileştirilmeli');
    }
    
    if (summary.duplicateAddresses > 0) {
      recommendations.push('- Duplicate kontrolü eklenmeli');
    }
    
    if (summary.totalWarnings > summary.totalAddresses * 0.2) {
      recommendations.push('- Veri formatı standartlaştırılmalı');
    }
    
    return recommendations.join('\n');
  }

  /**
   * Doğrulama sonuçlarını dosyaya kaydeder
   */
  public async saveValidationReport(validationResult: any, filename?: string): Promise<string> {
    const outputDir = path.join(process.cwd(), 'data', 'ptt', 'validation');
    
    // Klasörü oluştur
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `ptt-validation-report-${timestamp}.md`;
    const filepath = path.join(outputDir, filename || defaultFilename);

    const report = this.generateValidationReport(validationResult);
    fs.writeFileSync(filepath, report, 'utf8');
    
    console.log(`📋 Doğrulama raporu kaydedildi: ${filepath}`);
    return filepath;
  }
}

// CLI çalıştırma
export async function validatePTTData(inputFile: string, outputFile?: string) {
  const validator = new PTTDataValidator();
  
  try {
    // Veriyi oku
    console.log(`📖 Veri okunuyor: ${inputFile}`);
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    // Veriyi doğrula
    const validationResult = validator.validateDataset(data.data || data);
    
    // Raporu kaydet
    const reportPath = await validator.saveValidationReport(validationResult, outputFile);
    
    return validationResult;
  } catch (error) {
    console.error('❌ Veri doğrulama hatası:', error);
    throw error;
  }
}

// CLI çalıştırma
if (require.main === module) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];
  
  if (!inputFile) {
    console.log('Kullanım: tsx data-validator.ts <input-file> [output-file]');
    console.log('Örnek: tsx data-validator.ts ../data/ptt/ptt-addresses-2025-09-14.json');
    process.exit(1);
  }
  
  validatePTTData(inputFile, outputFile).catch(console.error);
}
