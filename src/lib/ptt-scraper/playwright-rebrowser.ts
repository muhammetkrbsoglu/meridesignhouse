import { chromium, Browser, Page } from 'rebrowser-playwright';
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

export interface ScrapedData {
  timestamp: string;
  totalCount: number;
  data: AddressData[];
}

export class PTTRebrowserScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl = 'https://postakodu.ptt.gov.tr';

  async init() {
    console.log('🚀 PTT Rebrowser Scraper başlatılıyor...');
    
    // Rebrowser patches environment variables
    process.env.REBROWSER_PATCHES_SOURCE_URL = 'jquery.min.js';
    process.env.REBROWSER_PATCHES_RUNTIME_FIX_MODE = 'alwaysIsolated';
    process.env.REBROWSER_PATCHES_UTILITY_WORLD_NAME = 'customUtilityWorld';
    
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ]
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    // User agent ve headers ayarla
    await this.page.setExtraHTTPHeaders({
      'Accept-Charset': 'UTF-8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
    });
    
    // Stealth mode için ek ayarlar
    await this.page.addInitScript(() => {
      // WebDriver detection'ı engelle
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Chrome detection'ı engelle
      window.chrome = {
        runtime: {},
      };
      
      // Plugin detection'ı engelle
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Language detection'ı engelle
      Object.defineProperty(navigator, 'languages', {
        get: () => ['tr-TR', 'tr', 'en'],
      });
    });
  }

  async scrapeAllData(): Promise<ScrapedData> {
    console.log('📊 Tüm adres verileri çekiliyor...');
    
    try {
      // PTT sitesine git
      await this.page!.goto(this.baseUrl, { waitUntil: 'networkidle' });
      
      // Posta Kodu tab'ına tıkla
      console.log('🔍 Posta Kodu tab\'ına tıklanıyor...');
      await this.page!.locator('text=Posta Kodu Sorgulama').first().click();
      await this.page!.waitForTimeout(3000);
      
      // İl listesini çek
      const iller = await this.scrapeIller();
      console.log(`✅ ${iller.length} il bulundu`);

      const allData: AddressData[] = [];
      let processedCount = 0;

      // Sadece ilk 2 ili test et
      const testIller = iller.slice(0, 2);
      console.log(`🧪 Test için ${testIller.length} il işlenecek: ${testIller.map(i => i.text).join(', ')}`);

      for (const il of testIller) {
        console.log(`🏙️ ${il.text} işleniyor...`);
        
        try {
          // İlçeleri çek
          const ilceler = await this.scrapeIlceler(il.value);
          console.log(`  📍 ${ilceler.length} ilçe bulundu`);

          if (ilceler.length === 0) {
            console.log(`  ⚠️ ${il.text} için ilçe bulunamadı, atlanıyor...`);
            continue;
          }

          // Sadece ilk 2 ilçeyi test et
          const testIlceler = ilceler.slice(0, 2);
          console.log(`  🧪 Test için ${testIlceler.length} ilçe işlenecek: ${testIlceler.map(i => i.text).join(', ')}`);

          for (const ilce of testIlceler) {
            try {
              // Mahalleleri çek
              const mahalleler = await this.scrapeMahalleler(ilce.value);
              console.log(`    🏘️ ${ilce.text}: ${mahalleler.length} mahalle`);

              if (mahalleler.length === 0) {
                console.log(`    ⚠️ ${ilce.text} için mahalle bulunamadı, atlanıyor...`);
                continue;
              }

              // Sadece ilk 2 mahalleyi test et
              const testMahalleler = mahalleler.slice(0, 2);
              console.log(`    🧪 Test için ${testMahalleler.length} mahalle işlenecek`);

              for (const mahalle of testMahalleler) {
                try {
                  // Posta kodunu çek
                  const postaKodu = await this.scrapePostaKodu(mahalle.value);
                  
                  if (postaKodu) {
                    allData.push({
                      il: il.text,
                      ilce: ilce.text,
                      mahalle: mahalle.text,
                      postaKodu
                    });
                    processedCount++;
                    console.log(`    ✅ ${mahalle.text}: ${postaKodu}`);
                  } else {
                    console.log(`    ⚠️ ${mahalle.text}: Posta kodu bulunamadı`);
                  }

                  // Rate limiting
                  await this.delay(2000);
                } catch (error) {
                  console.error(`    ❌ Mahalle hatası (${mahalle.text}):`, error);
                }
              }
            } catch (error) {
              console.error(`  ❌ İlçe hatası (${ilce.text}):`, error);
            }
          }
        } catch (error) {
          console.error(`❌ İl hatası (${il.text}):`, error);
        }
      }

      const result: ScrapedData = {
        timestamp: new Date().toISOString(),
        totalCount: allData.length,
        data: allData
      };

      console.log(`✅ Toplam ${result.totalCount} adres verisi çekildi`);
      return result;

    } catch (error) {
      console.error('❌ Scraping hatası:', error);
      throw error;
    }
  }

  private async scrapeIller(): Promise<{text: string, value: string}[]> {
    const iller = await this.page!.evaluate(() => {
      const select = document.querySelector('#MainContent_DropDownList1') as HTMLSelectElement;
      if (select) {
        return Array.from(select.options)
          .map(opt => ({
            text: opt.textContent?.trim(),
            value: opt.value
          }))
          .filter(opt => opt.text && opt.text !== 'Lütfen Seçiniz' && opt.value !== '-1');
      }
      return [];
    });

    return iller as {text: string, value: string}[];
  }

  private async scrapeIlceler(ilValue: string): Promise<{text: string, value: string}[]> {
    try {
      // İl seç
      await this.page!.selectOption('#MainContent_DropDownList1', ilValue);
      await this.page!.waitForTimeout(5000);
      
      const ilceler = await this.page!.evaluate(() => {
        const select = document.querySelector('#MainContent_DropDownList2') as HTMLSelectElement;
        if (select) {
          return Array.from(select.options)
            .map(opt => ({
              text: opt.textContent?.trim(),
              value: opt.value
            }))
            .filter(opt => opt.text && opt.text !== 'Lütfen Seçiniz' && opt.value !== '-1');
        }
        return [];
      });

      return ilceler as {text: string, value: string}[];
    } catch (error) {
      console.error(`İlçe çekme hatası (${ilValue}):`, error);
      return [];
    }
  }

  private async scrapeMahalleler(ilceValue: string): Promise<{text: string, value: string}[]> {
    try {
      // İlçe seç
      await this.page!.selectOption('#MainContent_DropDownList2', ilceValue);
      await this.page!.waitForTimeout(5000);
      
      const mahalleler = await this.page!.evaluate(() => {
        const select = document.querySelector('#MainContent_DropDownList3') as HTMLSelectElement;
        if (select) {
          return Array.from(select.options)
            .map(opt => ({
              text: opt.textContent?.trim(),
              value: opt.value
            }))
            .filter(opt => opt.text && opt.text !== 'Lütfen Seçiniz' && opt.value !== '-1');
        }
        return [];
      });

      return mahalleler as {text: string, value: string}[];
    } catch (error) {
      console.error(`Mahalle çekme hatası (${ilceValue}):`, error);
      return [];
    }
  }

  private async scrapePostaKodu(mahalleValue: string): Promise<string | null> {
    try {
      // Mahalle seç
      await this.page!.selectOption('#MainContent_DropDownList3', mahalleValue);
      await this.page!.waitForTimeout(3000);
      
      // Posta kodu butonuna tıkla
      await this.page!.click('#MainContent_Button1');
      await this.page!.waitForTimeout(5000);
      
      // Posta kodunu çek
      const postaKodu = await this.page!.evaluate(() => {
        // Farklı selector'ları dene
        const selectors = [
          '#MainContent_Label1',
          '#MainContent_Label2', 
          '#MainContent_Label3',
          '#MainContent_Label7',
          '.aciklaEtiket',
          '.baslikEtiket',
          '[id*="Label"]',
          '[class*="result"]',
          '[class*="posta"]'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim();
            if (text && text.length > 0) {
              // Posta kodu formatını kontrol et (5 haneli sayı)
              const match = text.match(/\b\d{5}\b/);
              if (match) {
                return match[0];
              }
            }
          }
        }
        
        // Sayfa içinde herhangi bir yerde 5 haneli sayı ara
        const allText = document.body.textContent || '';
        const matches = allText.match(/\b\d{5}\b/g);
        if (matches && matches.length > 0) {
          return matches[0];
        }
        
        return null;
      });
      
      return postaKodu;
    } catch (error) {
      console.error(`Posta kodu çekme hatası (${mahalleValue}):`, error);
      return null;
    }
  }

  async saveData(data: ScrapedData, filename?: string): Promise<string> {
    const outputDir = path.join(process.cwd(), 'data', 'ptt');
    
    // Klasörü oluştur
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `ptt-addresses-rebrowser-${timestamp}.json`;
    const filepath = path.join(outputDir, filename || defaultFilename);

    // UTF-8 BOM ile kaydet (Türkçe karakterler için)
    const bom = '\uFEFF';
    const jsonString = bom + JSON.stringify(data, null, 2);
    fs.writeFileSync(filepath, jsonString, 'utf8');
    
    console.log(`💾 Veri kaydedildi: ${filepath}`);
    return filepath;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser kapatıldı');
    }
  }
}

// Manuel çalıştırma
export async function runRebrowserScraping() {
  const scraper = new PTTRebrowserScraper();
  
  try {
    await scraper.init();
    const data = await scraper.scrapeAllData();
    const filepath = await scraper.saveData(data);
    
    console.log('🎉 Rebrowser Scraping tamamlandı!');
    console.log(`📁 Dosya: ${filepath}`);
    console.log(`📊 Toplam: ${data.totalCount} adres`);
    
    return data;
  } catch (error) {
    console.error('❌ Rebrowser Scraping hatası:', error);
    throw error;
  } finally {
    await scraper.close();
  }
}

// CLI çalıştırma
if (require.main === module) {
  runRebrowserScraping().catch(console.error);
}
