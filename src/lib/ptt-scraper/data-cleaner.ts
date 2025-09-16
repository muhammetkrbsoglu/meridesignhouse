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

export interface CleanedAddressData extends AddressData {
  temizMahalle: string;
  postaKoduFromMahalle?: string;
  isValidPostaKodu: boolean;
  isConsistent: boolean;
  warnings: string[];
}

export interface ScrapedData {
  timestamp: string;
  totalCount: number;
  data: AddressData[];
}

export interface CleanedScrapedData {
  timestamp: string;
  totalCount: number;
  originalCount: number;
  cleanedCount: number;
  data: CleanedAddressData[];
  statistics: {
    validPostaKodu: number;
    consistentData: number;
    warnings: number;
    errors: number;
  };
}

export class PTTDataCleaner {
  
  /**
   * Mahalle adını temizler
   */
  private cleanMahalleName(mahalle: string): string {
    return mahalle
      .split('/')[0]  // İlk kısmı al (mahalle adı)
      .trim()         // Boşlukları temizle
      .replace(/\s+/g, ' ')  // Çoklu boşlukları tek boşluk yap
      .replace(/MAH\s*$/, 'MAH')  // MAH sonuna düzgün boşluk ekle
      .replace(/\s+MAH$/, ' MAH'); // MAH'dan önceki boşlukları düzenle
  }

  /**
   * Mahalle adından posta kodunu çıkarır
   */
  private extractPostaKoduFromMahalle(mahalle: string): string | null {
    const match = mahalle.match(/\b(\d{5})\b/);
    return match ? match[1] : null;
  }

  /**
   * Posta kodu formatını doğrular
   */
  private isValidPostaKodu(postaKodu: string): boolean {
    return /^\d{5}$/.test(postaKodu);
  }

  /**
   * Veri tutarlılığını kontrol eder
   */
  private checkConsistency(mahalle: string, postaKodu: string): {
    isConsistent: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const postaKoduFromMahalle = this.extractPostaKoduFromMahalle(mahalle);
    
    if (postaKoduFromMahalle && postaKoduFromMahalle !== postaKodu) {
      warnings.push(`Posta kodu tutarsızlığı: ${postaKodu} vs ${postaKoduFromMahalle}`);
    }

    if (!this.isValidPostaKodu(postaKodu)) {
      warnings.push(`Geçersiz posta kodu formatı: ${postaKodu}`);
    }

    if (mahalle.length > 100) {
      warnings.push(`Çok uzun mahalle adı: ${mahalle.length} karakter`);
    }

    if (!mahalle.includes('MAH') && !mahalle.includes('KÖY') && !mahalle.includes('BEL')) {
      warnings.push(`Mahalle adı formatı şüpheli: ${mahalle}`);
    }

    return {
      isConsistent: warnings.length === 0,
      warnings
    };
  }

  /**
   * Tek bir adres verisini temizler
   */
  public cleanAddressData(address: AddressData): CleanedAddressData {
    const temizMahalle = this.cleanMahalleName(address.mahalle);
    const postaKoduFromMahalle = this.extractPostaKoduFromMahalle(address.mahalle);
    const isValidPostaKodu = this.isValidPostaKodu(address.postaKodu);
    const consistency = this.checkConsistency(address.mahalle, address.postaKodu);

    return {
      ...address,
      temizMahalle,
      postaKoduFromMahalle,
      isValidPostaKodu,
      isConsistent: consistency.isConsistent,
      warnings: consistency.warnings
    };
  }

  /**
   * Tüm veri setini temizler
   */
  public cleanDataset(data: ScrapedData): CleanedScrapedData {
    console.log('🧹 Veri temizleme başlatılıyor...');
    
    const cleanedData: CleanedAddressData[] = [];
    let statistics = {
      validPostaKodu: 0,
      consistentData: 0,
      warnings: 0,
      errors: 0
    };

    for (const address of data.data) {
      try {
        const cleaned = this.cleanAddressData(address);
        cleanedData.push(cleaned);

        // İstatistikleri güncelle
        if (cleaned.isValidPostaKodu) statistics.validPostaKodu++;
        if (cleaned.isConsistent) statistics.consistentData++;
        if (cleaned.warnings.length > 0) statistics.warnings++;
        
        // Uyarıları logla
        if (cleaned.warnings.length > 0) {
          console.log(`⚠️ ${address.il} > ${address.ilce} > ${address.mahalle}:`);
          cleaned.warnings.forEach(warning => console.log(`   - ${warning}`));
        }
      } catch (error) {
        console.error(`❌ Veri temizleme hatası:`, error);
        statistics.errors++;
      }
    }

    const result: CleanedScrapedData = {
      timestamp: new Date().toISOString(),
      totalCount: cleanedData.length,
      originalCount: data.data.length,
      cleanedCount: cleanedData.length,
      data: cleanedData,
      statistics
    };

    console.log('✅ Veri temizleme tamamlandı!');
    console.log(`📊 Orijinal: ${result.originalCount}, Temizlenen: ${result.cleanedCount}`);
    console.log(`📈 Geçerli posta kodu: ${statistics.validPostaKodu}`);
    console.log(`📈 Tutarlı veri: ${statistics.consistentData}`);
    console.log(`⚠️ Uyarılar: ${statistics.warnings}`);
    console.log(`❌ Hatalar: ${statistics.errors}`);

    return result;
  }

  /**
   * Temizlenmiş veriyi dosyaya kaydeder
   */
  public async saveCleanedData(cleanedData: CleanedScrapedData, filename?: string): Promise<string> {
    const outputDir = path.join(process.cwd(), 'data', 'ptt', 'cleaned');
    
    // Klasörü oluştur
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `ptt-addresses-cleaned-${timestamp}.json`;
    const filepath = path.join(outputDir, filename || defaultFilename);

    // UTF-8 BOM ile kaydet (Türkçe karakterler için)
    const bom = '\uFEFF';
    const jsonString = bom + JSON.stringify(cleanedData, null, 2);
    fs.writeFileSync(filepath, jsonString, 'utf8');
    
    console.log(`💾 Temizlenmiş veri kaydedildi: ${filepath}`);
    return filepath;
  }

  /**
   * Veri kalitesi raporu oluşturur
   */
  public generateQualityReport(cleanedData: CleanedScrapedData): string {
    const { statistics, totalCount, originalCount } = cleanedData;
    
    const report = `
# PTT Veri Kalitesi Raporu

## 📊 Genel İstatistikler
- **Orijinal Veri:** ${originalCount} adres
- **Temizlenen Veri:** ${totalCount} adres
- **Veri Kaybı:** ${originalCount - totalCount} adres

## ✅ Kalite Metrikleri
- **Geçerli Posta Kodu:** ${statistics.validPostaKodu} (${((statistics.validPostaKodu / totalCount) * 100).toFixed(1)}%)
- **Tutarlı Veri:** ${statistics.consistentData} (${((statistics.consistentData / totalCount) * 100).toFixed(1)}%)
- **Uyarılar:** ${statistics.warnings}
- **Hatalar:** ${statistics.errors}

## 🎯 Kalite Skoru
${this.calculateQualityScore(statistics, totalCount)}%

## 📋 Öneriler
${this.generateRecommendations(statistics, totalCount)}
`;

    return report;
  }

  private calculateQualityScore(statistics: any, totalCount: number): number {
    const validPostaKoduScore = (statistics.validPostaKodu / totalCount) * 40;
    const consistentDataScore = (statistics.consistentData / totalCount) * 40;
    const warningPenalty = (statistics.warnings / totalCount) * 10;
    const errorPenalty = (statistics.errors / totalCount) * 20;
    
    return Math.max(0, Math.round(validPostaKoduScore + consistentDataScore - warningPenalty - errorPenalty));
  }

  private generateRecommendations(statistics: any, totalCount: number): string {
    const recommendations = [];
    
    if (statistics.validPostaKodu < totalCount * 0.9) {
      recommendations.push('- Posta kodu formatı kontrolü güçlendirilmeli');
    }
    
    if (statistics.consistentData < totalCount * 0.8) {
      recommendations.push('- Veri tutarlılığı kontrolü iyileştirilmeli');
    }
    
    if (statistics.warnings > totalCount * 0.1) {
      recommendations.push('- Mahalle adı temizleme algoritması geliştirilmeli');
    }
    
    if (statistics.errors > 0) {
      recommendations.push('- Hata yönetimi güçlendirilmeli');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- Veri kalitesi yüksek, mevcut süreç devam ettirilebilir');
    }
    
    return recommendations.join('\n');
  }
}

// CLI çalıştırma
export async function cleanPTTData(inputFile: string, outputFile?: string) {
  const cleaner = new PTTDataCleaner();
  
  try {
    // Veriyi oku
    console.log(`📖 Veri okunuyor: ${inputFile}`);
    const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf8')) as ScrapedData;
    
    // Veriyi temizle
    const cleanedData = cleaner.cleanDataset(rawData);
    
    // Temizlenmiş veriyi kaydet
    const filepath = await cleaner.saveCleanedData(cleanedData, outputFile);
    
    // Kalite raporu oluştur
    const report = cleaner.generateQualityReport(cleanedData);
    console.log('\n' + report);
    
    // Raporu dosyaya kaydet
    const reportPath = filepath.replace('.json', '-report.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`📋 Kalite raporu kaydedildi: ${reportPath}`);
    
    return cleanedData;
  } catch (error) {
    console.error('❌ Veri temizleme hatası:', error);
    throw error;
  }
}

// CLI çalıştırma
if (require.main === module) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];
  
  if (!inputFile) {
    console.log('Kullanım: tsx data-cleaner.ts <input-file> [output-file]');
    console.log('Örnek: tsx data-cleaner.ts ../data/ptt/ptt-addresses-2025-09-14.json');
    process.exit(1);
  }
  
  cleanPTTData(inputFile, outputFile).catch(console.error);
}
