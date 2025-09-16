export interface AddressData {
  il: string;
  ilce: string;
  mahalle: string;
  postaKodu: string;
}

// Adres verilerini yöneten sınıf
export class AddressDataManager {
  private static instance: AddressDataManager;
  private data: AddressData[] = [];
  private lastUpdate: Date | null = null;

  private constructor() {}

  static getInstance(): AddressDataManager {
    if (!AddressDataManager.instance) {
      AddressDataManager.instance = new AddressDataManager();
    }
    return AddressDataManager.instance;
  }

  // Veri yükle
  async loadData(): Promise<void> {
    try {
      // En son veri dosyasını bul (dinamik import ile Node built-in)
      const fs = await import('fs');
      const path = await import('path');
      
      const dataDir = path.join(process.cwd(), 'data', 'ptt');
      if (!fs.existsSync(dataDir as unknown as string)) {
        console.log('📁 Veri klasörü bulunamadı (scraper devre dışı). Boş veri ile devam ediliyor.');
        this.data = [];
        this.lastUpdate = null;
        return;
      }

      const files = fs.readdirSync(dataDir as unknown as string)
        .filter((file: string) => file.startsWith('ptt-addresses-') && file.endsWith('.json'))
        .sort()
        .reverse();

      if (files.length === 0) {
        console.log('📁 Veri dosyası bulunamadı (scraper devre dışı). Boş veri ile devam ediliyor.');
        this.data = [];
        this.lastUpdate = null;
        return;
      }

      const latestFile = files[0];
      const filePath = path.join(dataDir as unknown as string, latestFile);
      const fileContent = fs.readFileSync(filePath as unknown as string, 'utf8');
      const parsedData = JSON.parse(fileContent);

      this.data = parsedData.data || [];
      this.lastUpdate = new Date(parsedData.timestamp);

      console.log(`✅ Adres verileri yüklendi: ${this.data.length} adres (${this.lastUpdate?.toLocaleDateString()})`);
    } catch (error) {
      console.error('❌ Veri yükleme hatası:', error);
      throw error;
    }
  }

  // Scraper kaldırıldı: runScraping devre dışı

  // İl listesi
  getIller(): string[] {
    const iller = [...new Set(this.data.map(item => item.il))];
    return iller.sort();
  }

  // İlçe listesi
  getIlceler(il: string): string[] {
    const ilceler = [...new Set(
      this.data
        .filter(item => item.il === il)
        .map(item => item.ilce)
    )];
    return ilceler.sort();
  }

  // Mahalle listesi
  getMahalleler(il: string, ilce: string): string[] {
    const mahalleler = [...new Set(
      this.data
        .filter(item => item.il === il && item.ilce === ilce)
        .map(item => item.mahalle)
    )];
    return mahalleler.sort();
  }

  // Posta kodu ara
  getPostaKodu(il: string, ilce: string, mahalle: string): string | null {
    const address = this.data.find(item => 
      item.il === il && 
      item.ilce === ilce && 
      item.mahalle === mahalle
    );
    return address?.postaKodu || null;
  }

  // Adres ara
  searchAddress(query: string): AddressData[] {
    const lowerQuery = query.toLowerCase();
    return this.data.filter(item => 
      item.il.toLowerCase().includes(lowerQuery) ||
      item.ilce.toLowerCase().includes(lowerQuery) ||
      item.mahalle.toLowerCase().includes(lowerQuery) ||
      item.postaKodu.includes(query)
    );
  }

  // Veri istatistikleri
  getStats() {
    return {
      totalAddresses: this.data.length,
      totalIller: this.getIller().length,
      totalIlceler: [...new Set(this.data.map(item => `${item.il}-${item.ilce}`))].length,
      lastUpdate: this.lastUpdate,
      dataSize: JSON.stringify(this.data).length
    };
  }

  // Veri güncelle
  async updateData(): Promise<void> {
    console.log('🔄 Adres verileri güncelleniyor...');
    await this.runScraping();
  }
}

// Singleton instance
export const addressDataManager = AddressDataManager.getInstance();
