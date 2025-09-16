import { chromium, Browser, Page } from 'rebrowser-playwright';

export class PTTRebrowserDebug {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl = 'https://postakodu.ptt.gov.tr';

  async init() {
    console.log('🚀 PTT Rebrowser Debug başlatılıyor...');
    
    // Rebrowser patches environment variables
    process.env.REBROWSER_PATCHES_SOURCE_URL = 'jquery.min.js';
    process.env.REBROWSER_PATCHES_RUNTIME_FIX_MODE = 'alwaysIsolated';
    process.env.REBROWSER_PATCHES_UTILITY_WORLD_NAME = 'customUtilityWorld';
    
    this.browser = await chromium.launch({
      headless: false, // Görsel olarak takip etmek için
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

  async debugTest(): Promise<void> {
    console.log('📊 Debug test başlatılıyor...');
    
    try {
      // PTT sitesine git
      console.log('🔗 PTT sitesine bağlanılıyor...');
      await this.page!.goto(this.baseUrl, { waitUntil: 'networkidle' });
      console.log('✅ Site yüklendi');
      
      // Sayfa başlığını kontrol et
      const title = await this.page!.title();
      console.log(`📄 Sayfa başlığı: ${title}`);
      
      // Posta Kodu tab'ına tıkla
      console.log('🔍 Posta Kodu tab\'ına tıklanıyor...');
      await this.page!.locator('text=Posta Kodu Sorgulama').first().click();
      await this.page!.waitForTimeout(3000);
      console.log('✅ Tab tıklandı');
      
      // İl listesini çek
      console.log('🔍 İl listesi çekiliyor...');
      const iller = await this.scrapeIller();
      console.log(`✅ ${iller.length} il bulundu`);
      
      if (iller.length > 0) {
        console.log(`📋 İlk 5 il: ${iller.slice(0, 5).map(i => i.text).join(', ')}`);
        
        // İlk ili test et
        const testIl = iller[0];
        console.log(`🏙️ Test için ${testIl.text} (${testIl.value}) işleniyor...`);
        
        // İlçeleri çek
        console.log('🔍 İlçeler çekiliyor...');
        const ilceler = await this.scrapeIlceler(testIl.value);
        console.log(`✅ ${ilceler.length} ilçe bulundu`);
        
        if (ilceler.length > 0) {
          console.log(`📋 İlk 5 ilçe: ${ilceler.slice(0, 5).map(i => i.text).join(', ')}`);
          
          // İlk ilçeyi test et
          const testIlce = ilceler[0];
          console.log(`🏘️ Test için ${testIlce.text} (${testIlce.value}) işleniyor...`);
          
          // Mahalleleri çek
          console.log('🔍 Mahalleler çekiliyor...');
          const mahalleler = await this.scrapeMahalleler(testIlce.value);
          console.log(`✅ ${mahalleler.length} mahalle bulundu`);
          
          if (mahalleler.length > 0) {
            console.log(`📋 İlk 5 mahalle: ${mahalleler.slice(0, 5).map(i => i.text).join(', ')}`);
            
            // İlk mahalleyi test et
            const testMahalle = mahalleler[0];
            console.log(`🏠 Test için ${testMahalle.text} (${testMahalle.value}) işleniyor...`);
            
            // Posta kodunu çek
            console.log('🔍 Posta kodu çekiliyor...');
            const postaKodu = await this.scrapePostaKodu(testMahalle.value);
            
            if (postaKodu) {
              console.log(`✅ Posta kodu bulundu: ${postaKodu}`);
              console.log(`📊 Test verisi: ${testIl.text} > ${testIlce.text} > ${testMahalle.text} = ${postaKodu}`);
            } else {
              console.log('⚠️ Posta kodu bulunamadı');
            }
          } else {
            console.log('❌ Mahalle bulunamadı');
          }
        } else {
          console.log('❌ İlçe bulunamadı');
        }
      } else {
        console.log('❌ İl bulunamadı');
      }
      
      console.log('🎉 Debug test tamamlandı!');
      
    } catch (error) {
      console.error('❌ Debug test hatası:', error);
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
      console.log(`  🔄 İl seçiliyor: ${ilValue}`);
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
      console.log(`  🔄 İlçe seçiliyor: ${ilceValue}`);
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
      console.log(`  🔄 Mahalle seçiliyor: ${mahalleValue}`);
      await this.page!.selectOption('#MainContent_DropDownList3', mahalleValue);
      await this.page!.waitForTimeout(3000);
      
      console.log('  🔄 Posta kodu butonuna tıklanıyor...');
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
      
      return postaKodu;
    } catch (error) {
      console.error(`Posta kodu çekme hatası (${mahalleValue}):`, error);
      return null;
    }
  }

  async close() {
    if (this.browser) {
      // 10 saniye bekle ki kullanıcı görebilsin
      await new Promise(resolve => setTimeout(resolve, 10000));
      await this.browser.close();
      console.log('🔒 Browser kapatıldı');
    }
  }
}

// Manuel çalıştırma
export async function runDebugTest() {
  const debug = new PTTRebrowserDebug();
  
  try {
    await debug.init();
    await debug.debugTest();
    
    console.log('🎉 Debug Test tamamlandı!');
    
  } catch (error) {
    console.error('❌ Debug Test hatası:', error);
    throw error;
  } finally {
    await debug.close();
  }
}

// CLI çalıştırma
if (require.main === module) {
  runDebugTest().catch(console.error);
}
