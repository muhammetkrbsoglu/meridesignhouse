import { chromium, Browser, Page } from 'playwright';
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

export class PTTPlaywrightScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl = 'https://postakodu.ptt.gov.tr';

  async init() {
    console.log('🚀 PTT Playwright Scraper başlatılıyor...');
    
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    // User agent ve headers ayarla
    await this.page.setExtraHTTPHeaders({
      'Accept-Charset': 'UTF-8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
    });
    
    // JavaScript execution context'ini ayarla
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        get: function() { return 'tr-TR'; }
      });
    });
  }

  async scrapeAllData(): Promise<ScrapedData> {
    console.log('📊 Tüm adres verileri çekiliyor...');
    
    try {
      // İl listesini çek
      const iller = await this.scrapeIller();
      console.log(`✅ ${iller.length} il bulundu`);

      const allData: AddressData[] = [];
      let processedCount = 0;

      for (const il of iller) {
        console.log(`🏙️ ${il.text} işleniyor...`);
        
        try {
          // İlçeleri çek
          const ilceler = await this.scrapeIlceler(il.value);
          console.log(`  📍 ${ilceler.length} ilçe bulundu`);

          if (ilceler.length === 0) {
            console.log(`  ⚠️ ${il.text} için ilçe bulunamadı, atlanıyor...`);
            continue;
          }

          for (const ilce of ilceler) {
            try {
              // Mahalleleri çek
              const mahalleler = await this.scrapeMahalleler(ilce.value);
              console.log(`    🏘️ ${ilce.text}: ${mahalleler.length} mahalle`);

              if (mahalleler.length === 0) {
                console.log(`    ⚠️ ${ilce.text} için mahalle bulunamadı, atlanıyor...`);
                continue;
              }

              // Tüm mahalleleri işle
              console.log(`    🏘️ ${mahalleler.length} mahalle işlenecek`);
              
              for (const mahalle of mahalleler) {
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
                  }

                  // Rate limiting
                  await this.delay(500);
                } catch (error) {
                  console.error(`    ❌ Mahalle hatası (${mahalle.text}):`, error);
                  // Hata olsa bile devam et
                }
              }
            } catch (error) {
              console.error(`  ❌ İlçe hatası (${ilce.text}):`, error);
              // Hata olsa bile devam et
            }
          }
        } catch (error) {
          console.error(`❌ İl hatası (${il.text}):`, error);
          // Hata olsa bile devam et
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
    await this.page!.goto(this.baseUrl, { waitUntil: 'networkidle' });
    
    // Posta Kodu Sorgulama tab'ına tıkla
    try {
      await this.page!.waitForSelector('#MainContent_tabbb_postakodTab', { timeout: 10000 });
      await this.page!.click('#MainContent_tabbb_postakodTab');
      await this.page!.waitForTimeout(2000);
    } catch (error) {
      console.log('⚠️ Tab tıklama hatası, devam ediliyor...', error);
    }
    
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
      // Sayfa yeniden yükleme kontrolü
      await this.page!.reload({ waitUntil: 'networkidle' });
      await this.page!.waitForTimeout(2000);
      
      // Tab'ı tekrar tıkla
      try {
        await this.page!.waitForSelector('#MainContent_tabbb_postakodTab', { timeout: 10000 });
        await this.page!.click('#MainContent_tabbb_postakodTab');
        await this.page!.waitForTimeout(2000);
      } catch (error) {
        console.log('⚠️ Tab tıklama hatası, devam ediliyor...', error);
      }
      
      // İl seç
      await this.page!.waitForSelector('#MainContent_DropDownList1', { timeout: 10000 });
      await this.page!.selectOption('#MainContent_DropDownList1', ilValue);
      await this.page!.waitForTimeout(5000);
      
      // Element varlığını kontrol et - daha agresif
      let ilceSelect = await this.page!.locator('#MainContent_DropDownList2');
      let retryCount = 0;
      while (!(await ilceSelect.count()) && retryCount < 3) {
        console.log(`🔄 İlçe dropdown bulunamadı, tekrar deneniyor... (${retryCount + 1}/3)`);
        await this.page!.waitForTimeout(3000);
        ilceSelect = await this.page!.locator('#MainContent_DropDownList2');
        retryCount++;
      }
      
      if (!(await ilceSelect.count())) {
        console.log(`⚠️ İlçe dropdown'ı bulunamadı (${ilValue})`);
        return [];
      }
      
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
      
      // Element varlığını kontrol et - daha agresif
      let mahalleSelect = await this.page!.locator('#MainContent_DropDownList3');
      let retryCount = 0;
      while (!(await mahalleSelect.count()) && retryCount < 3) {
        console.log(`🔄 Mahalle dropdown bulunamadı, tekrar deneniyor... (${retryCount + 1}/3)`);
        await this.page!.waitForTimeout(3000);
        mahalleSelect = await this.page!.locator('#MainContent_DropDownList3');
        retryCount++;
      }
      
      if (!(await mahalleSelect.count())) {
        console.log(`⚠️ Mahalle dropdown'ı bulunamadı (${ilceValue})`);
        return [];
      }
      
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
      await this.page!.waitForTimeout(6000);
      
      // Posta kodunu çek - daha kapsamlı arama
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
              console.log(`Selector ${selector} metni:`, text);
              
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
          console.log('Sayfa içinde bulunan posta kodları:', matches);
          return matches[0];
        }
        
        return null;
      });
      
      if (postaKodu) {
        console.log(`    📮 Posta kodu: ${postaKodu}`);
        return postaKodu;
      } else {
        console.log(`    ⚠️ Posta kodu bulunamadı`);
        return null;
      }
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
    const defaultFilename = `ptt-addresses-playwright-${timestamp}.json`;
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
export async function runPlaywrightScraping() {
  const scraper = new PTTPlaywrightScraper();
  
  try {
    await scraper.init();
    const data = await scraper.scrapeAllData();
    const filepath = await scraper.saveData(data);
    
    console.log('🎉 Playwright Scraping tamamlandı!');
    console.log(`📁 Dosya: ${filepath}`);
    console.log(`📊 Toplam: ${data.totalCount} adres`);
    
    return data;
  } catch (error) {
    console.error('❌ Playwright Scraping hatası:', error);
    throw error;
  } finally {
    await scraper.close();
  }
}

// CLI çalıştırma
if (require.main === module) {
  runPlaywrightScraping().catch(console.error);
}
