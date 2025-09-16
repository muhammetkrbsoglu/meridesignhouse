import puppeteer from 'puppeteer';

async function debugPTTSite() {
  console.log('🔍 PTT sitesi debug ediliyor...');
  
  const browser = await puppeteer.launch({
    headless: false, // Görsel olarak kontrol etmek için
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  try {
    // PTT sitesine git
    console.log('🌐 PTT sitesine gidiliyor...');
    await page.goto('https://postakodu.ptt.gov.tr', { waitUntil: 'networkidle2' });
    
    // Sayfa başlığını kontrol et
    const title = await page.title();
    console.log('📄 Sayfa başlığı:', title);
    
    // Mevcut elementleri kontrol et
    console.log('🔍 Elementler kontrol ediliyor...');
    
    const elements = await page.evaluate(() => {
      const results: any = {};
      
      // Dropdown'ları kontrol et
      const dropdowns = document.querySelectorAll('select');
      results.dropdowns = Array.from(dropdowns).map((select, index) => ({
        index,
        id: select.id,
        name: select.name,
        className: select.className,
        optionsCount: select.options.length
      }));
      
      // Butonları kontrol et
      const buttons = document.querySelectorAll('input[type="button"], input[type="submit"], button');
      results.buttons = Array.from(buttons).map((btn, index) => ({
        index,
        id: btn.id,
        name: btn.name,
        className: btn.className,
        value: (btn as HTMLInputElement).value,
        text: btn.textContent?.trim()
      }));
      
      // Label'ları kontrol et
      const labels = document.querySelectorAll('label, span');
      results.labels = Array.from(labels).slice(0, 10).map((label, index) => ({
        index,
        id: label.id,
        className: label.className,
        text: label.textContent?.trim()
      }));
      
      return results;
    });
    
    console.log('📊 Bulunan elementler:');
    console.log('Dropdowns:', elements.dropdowns);
    console.log('Buttons:', elements.buttons);
    console.log('Labels (ilk 10):', elements.labels);
    
    // Sayfayı 5 saniye bekle
    console.log('⏳ 5 saniye bekleniyor...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Debug hatası:', error);
  } finally {
    await browser.close();
  }
}

debugPTTSite().catch(console.error);
