import puppeteer from 'puppeteer';

async function debugPostaKodu() {
  console.log('🔍 Posta kodu debug ediliyor...');
  
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
    
    // Posta Kodu Sorgulama tab'ına tıkla
    await page.click('#__tab_MainContent_tabbb_postakodTab');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // İl seç (ADANA)
    console.log('🏙️ ADANA seçiliyor...');
    await page.select('#MainContent_DropDownList1', '1');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // İlçe seç (ALADAĞ)
    console.log('📍 ALADAĞ seçiliyor...');
    await page.select('#MainContent_DropDownList2', '1');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mahalle seç (ilk mahalle)
    console.log('🏘️ İlk mahalle seçiliyor...');
    await page.select('#MainContent_DropDownList3', '1');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sorgula butonuna tıkla
    console.log('🔍 Sorgula butonuna tıklanıyor...');
    await page.click('#MainContent_Button1');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Sonuçları kontrol et
    console.log('📊 Sonuçlar kontrol ediliyor...');
    const result = await page.evaluate(() => {
      const results: any = {};
      
      // Tüm label'ları kontrol et
      const labels = document.querySelectorAll('label, span, div');
      results.allLabels = Array.from(labels).map((label, index) => ({
        index,
        id: label.id,
        className: label.className,
        text: label.textContent?.trim(),
        tagName: label.tagName
      })).filter(l => l.text && l.text.length > 0);
      
      // Özellikle MainContent_Label1'i kontrol et
      const mainLabel = document.querySelector('#MainContent_Label1');
      if (mainLabel) {
        results.mainLabel = {
          id: mainLabel.id,
          className: mainLabel.className,
          text: mainLabel.textContent?.trim(),
          innerHTML: mainLabel.innerHTML
        };
      }
      
      // Sayfa HTML'ini kontrol et
      results.pageHTML = document.documentElement.outerHTML.substring(0, 5000);
      
      return results;
    });
    
    console.log('📋 Sonuçlar:');
    console.log('Main Label:', result.mainLabel);
    console.log('Tüm Label\'lar (ilk 10):', result.allLabels.slice(0, 10));
    
    // Sayfayı 10 saniye bekle
    console.log('⏳ 10 saniye bekleniyor...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Debug hatası:', error);
  } finally {
    await browser.close();
  }
}

debugPostaKodu().catch(console.error);
