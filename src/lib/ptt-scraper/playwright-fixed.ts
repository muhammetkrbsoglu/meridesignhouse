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

export class PTTPlaywrightFixed {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl = 'https://postakodu.ptt.gov.tr';

  async init() {
    console.log('🚀 PTT Playwright Fixed Scraper başlatılıyor...');
    
    this.browser = await chromium.launch({
      headless: false, // Görsel olarak takip etmek için
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    // User agent ve headers ayarla
    await this.page.setExtraHTTPHeaders({
      'Accept-Charset': 'UTF-8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
    });
  }

  async testBasicConnection(): Promise<boolean> {
    try {
      console.log('🔗 PTT sitesine bağlanılıyor...');
      await this.page!.goto(this.baseUrl, { waitUntil: 'networkidle' });
      
      console.log('✅ Site yüklendi');
      
      // Sayfa başlığını kontrol et
      const title = await this.page!.title();
      console.log(`📄 Sayfa başlığı: ${title}`);
      
      // Tab'ı bul ve tıkla
      console.log('🔍 Posta Kodu tab\'ı aranıyor...');
      
      // Farklı selector'ları dene
      const tabSelectors = [
        '#MainContent_tabbb_postakodTab',
        'a[href*="postakod"]',
        'a:has-text("Posta Kodu")',
        '.ajax__tab_header a',
        '[id*="postakod"]'
      ];
      
      let tabFound = false;
      for (const selector of tabSelectors) {
        try {
          const element = await this.page!.locator(selector).first();
          if (await element.count() > 0) {
            console.log(`✅ Tab bulundu: ${selector}`);
            await element.click();
            await this.page!.waitForTimeout(3000);
            tabFound = true;
            break;
          }
        } catch (error) {
          console.log(`❌ Selector başarısız: ${selector}`);
        }
      }
      
      if (!tabFound) {
        console.log('⚠️ Tab bulunamadı, sayfa yapısını kontrol edelim...');
        
        // Sayfa içeriğini kontrol et
        const pageContent = await this.page!.content();
        console.log('📄 Sayfa içeriği (ilk 500 karakter):');
        console.log(pageContent.substring(0, 500));
        
        return false;
      }
      
      // İl dropdown'ını kontrol et
      console.log('🔍 İl dropdown\'ı aranıyor...');
      const ilSelect = await this.page!.locator('#MainContent_DropDownList1');
      
      if (await ilSelect.count() > 0) {
        console.log('✅ İl dropdown\'ı bulundu');
        
        // İl seçeneklerini say
        const ilOptions = await this.page!.evaluate(() => {
          const select = document.querySelector('#MainContent_DropDownList1') as HTMLSelectElement;
          if (select) {
            return Array.from(select.options).length;
          }
          return 0;
        });
        
        console.log(`📊 ${ilOptions} il seçeneği bulundu`);
        return true;
      } else {
        console.log('❌ İl dropdown\'ı bulunamadı');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Bağlantı testi hatası:', error);
      return false;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser kapatıldı');
    }
  }
}

// Test çalıştırma
export async function runBasicTest() {
  const scraper = new PTTPlaywrightFixed();
  
  try {
    await scraper.init();
    const success = await scraper.testBasicConnection();
    
    if (success) {
      console.log('🎉 Temel bağlantı testi başarılı!');
    } else {
      console.log('❌ Temel bağlantı testi başarısız!');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Test hatası:', error);
    return false;
  } finally {
    await scraper.close();
  }
}

// CLI çalıştırma
if (require.main === module) {
  runBasicTest().catch(console.error);
}
