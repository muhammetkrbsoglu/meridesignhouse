import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export class PTTDebug {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl = 'https://postakodu.ptt.gov.tr';

  async init() {
    console.log('🚀 PTT Debug başlatılıyor...');
    
    this.browser = await chromium.launch({
      headless: false, // Görsel olarak takip etmek için
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async debugPage() {
    try {
      console.log('🔗 PTT sitesine bağlanılıyor...');
      await this.page!.goto(this.baseUrl, { waitUntil: 'networkidle' });
      
      console.log('✅ Site yüklendi');
      
      // Sayfa başlığını kontrol et
      const title = await this.page!.title();
      console.log(`📄 Sayfa başlığı: ${title}`);
      
      // Tüm tab'ları bul
      console.log('🔍 Tüm tab\'lar aranıyor...');
      
      const allTabs = await this.page!.evaluate(() => {
        const tabs = document.querySelectorAll('a, div, span');
        const tabInfo = [];
        
        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i];
          const text = tab.textContent?.trim();
          const id = tab.id;
          const className = tab.className;
          
          if (text && (text.includes('Posta') || text.includes('posta') || text.includes('Kodu') || text.includes('kodu'))) {
            tabInfo.push({
              tag: tab.tagName,
              id: id,
              className: className,
              text: text,
              visible: tab.offsetParent !== null
            });
          }
        }
        
        return tabInfo;
      });
      
      console.log('📋 Bulunan tab\'lar:');
      allTabs.forEach((tab, index) => {
        console.log(`${index + 1}. ${tab.tag} - ID: ${tab.id} - Class: ${tab.className} - Text: ${tab.text} - Visible: ${tab.visible}`);
      });
      
      // Posta kodu tab'ını bul ve tıkla
      const postaKoduTab = await this.page!.locator('text=Posta Kodu').first();
      
      if (await postaKoduTab.count() > 0) {
        console.log('✅ Posta Kodu tab\'ı bulundu');
        
        // Element'in görünür olup olmadığını kontrol et
        const isVisible = await postaKoduTab.isVisible();
        console.log(`👁️ Tab görünür mü: ${isVisible}`);
        
        if (isVisible) {
          console.log('🖱️ Tab\'a tıklanıyor...');
          await postaKoduTab.click();
          await this.page!.waitForTimeout(3000);
          
          // İl dropdown'ını kontrol et
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
        } else {
          console.log('❌ Tab görünür değil');
          return false;
        }
      } else {
        console.log('❌ Posta Kodu tab\'ı bulunamadı');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Debug hatası:', error);
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
export async function runDebug() {
  const debug = new PTTDebug();
  
  try {
    await debug.init();
    const success = await debug.debugPage();
    
    if (success) {
      console.log('🎉 Debug başarılı!');
    } else {
      console.log('❌ Debug başarısız!');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Debug hatası:', error);
    return false;
  } finally {
    // 10 saniye bekle ki kullanıcı görebilsin
    await new Promise(resolve => setTimeout(resolve, 10000));
    await debug.close();
  }
}

// CLI çalıştırma
if (require.main === module) {
  runDebug().catch(console.error);
}
