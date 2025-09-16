#!/usr/bin/env tsx

import puppeteer from 'puppeteer';

async function debugPTTSite() {
  console.log('🔍 PTT sitesi yapısı inceleniyor...');
  
  const browser = await puppeteer.launch({
    headless: false, // Görsel olarak takip etmek için
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  try {
    // PTT sitesine git
    console.log('📡 PTT sitesine gidiliyor...');
    await page.goto('https://postakodu.ptt.gov.tr', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Site yüklendi');
    
    // Sayfa başlığını kontrol et
    const title = await page.title();
    console.log('📄 Sayfa başlığı:', title);
    
    // Tüm select elementlerini bul
    console.log('\n🔍 Select elementleri aranıyor...');
    const selectElements = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      return Array.from(selects).map((select, index) => ({
        index,
        id: select.id,
        name: select.name,
        className: select.className,
        optionsCount: select.options.length,
        firstOptionText: select.options[0]?.textContent?.trim(),
        secondOptionText: select.options[1]?.textContent?.trim()
      }));
    });
    
    console.log('📋 Bulunan select elementleri:');
    selectElements.forEach(select => {
      console.log(`  ${select.index + 1}. ID: "${select.id}", Name: "${select.name}"`);
      console.log(`     Class: "${select.className}"`);
      console.log(`     Options: ${select.optionsCount}`);
      console.log(`     İlk seçenek: "${select.firstOptionText}"`);
      console.log(`     İkinci seçenek: "${select.secondOptionText}"`);
      console.log('');
    });
    
    // Tab yapısını kontrol et
    console.log('🔍 Tab yapısı kontrol ediliyor...');
    const tabs = await page.evaluate(() => {
      const tabElements = document.querySelectorAll('[id*="tab"], [class*="tab"]');
      return Array.from(tabElements).map((tab, index) => ({
        index,
        id: tab.id,
        className: tab.className,
        textContent: tab.textContent?.trim(),
        tagName: tab.tagName
      }));
    });
    
    console.log('📑 Bulunan tab elementleri:');
    tabs.forEach(tab => {
      console.log(`  ${tab.index + 1}. ${tab.tagName} - ID: "${tab.id}", Class: "${tab.className}"`);
      console.log(`     Metin: "${tab.textContent}"`);
    });
    
    // Posta Kodu Sorgulama tab'ına tıklamayı dene
    console.log('\n🖱️ Posta Kodu Sorgulama tab\'ına tıklanıyor...');
    try {
      await page.click('#__tab_MainContent_tabbb_postakodTab');
      await page.waitForTimeout(2000);
      console.log('✅ Tab tıklandı');
      
      // Tab tıklandıktan sonra select elementlerini tekrar kontrol et
      console.log('\n🔍 Tab tıklandıktan sonra select elementleri:');
      const selectElementsAfterTab = await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        return Array.from(selects).map((select, index) => ({
          index,
          id: select.id,
          name: select.name,
          className: select.className,
          optionsCount: select.options.length,
          firstOptionText: select.options[0]?.textContent?.trim(),
          secondOptionText: select.options[1]?.textContent?.trim()
        }));
      });
      
      selectElementsAfterTab.forEach(select => {
        console.log(`  ${select.index + 1}. ID: "${select.id}", Name: "${select.name}"`);
        console.log(`     Options: ${select.optionsCount}`);
        console.log(`     İlk seçenek: "${select.firstOptionText}"`);
        console.log(`     İkinci seçenek: "${select.secondOptionText}"`);
        console.log('');
      });
      
    } catch (error) {
      console.log('❌ Tab tıklama hatası:', error);
    }
    
    // Sayfa HTML'ini kaydet (debug için)
    console.log('\n💾 Sayfa HTML\'i kaydediliyor...');
    const html = await page.content();
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = path.join(process.cwd(), 'debug');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const htmlPath = path.join(outputDir, 'ptt-site-debug.html');
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✅ HTML kaydedildi: ${htmlPath}`);
    
    // Network isteklerini izle
    console.log('\n🌐 Network istekleri izleniyor...');
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('postakodu.ptt.gov.tr') && (url.includes('ajax') || url.includes('postback'))) {
        console.log(`📡 AJAX İsteği: ${url} - Status: ${response.status()}`);
      }
    });
    
    // İl seçmeyi dene
    console.log('\n🏙️ İl seçimi deneniyor...');
    try {
      // İlk select'i bul ve ilk seçeneği seç
      const firstSelect = await page.$('select');
      if (firstSelect) {
        const options = await firstSelect.$$eval('option', options => 
          options.map(opt => ({ value: opt.value, text: opt.textContent?.trim() }))
        );
        
        console.log('📋 İlk select seçenekleri:');
        options.slice(0, 5).forEach((option, index) => {
          console.log(`  ${index + 1}. Value: "${option.value}", Text: "${option.value}"`);
        });
        
        if (options.length > 1) {
          const firstValidOption = options.find(opt => opt.value && opt.value !== '-1' && opt.value !== '');
          if (firstValidOption) {
            console.log(`🎯 İlk geçerli seçenek seçiliyor: "${firstValidOption.text}" (${firstValidOption.value})`);
            await firstSelect.select(firstValidOption.value);
            await page.waitForTimeout(3000);
            
            // Seçim sonrası select elementlerini kontrol et
            console.log('\n🔍 İl seçildikten sonra select elementleri:');
            const selectElementsAfterSelection = await page.evaluate(() => {
              const selects = document.querySelectorAll('select');
              return Array.from(selects).map((select, index) => ({
                index,
                id: select.id,
                name: select.name,
                className: select.className,
                optionsCount: select.options.length,
                firstOptionText: select.options[0]?.textContent?.trim(),
                secondOptionText: select.options[1]?.textContent?.trim()
              }));
            });
            
            selectElementsAfterSelection.forEach(select => {
              console.log(`  ${select.index + 1}. ID: "${select.id}", Name: "${select.name}"`);
              console.log(`     Options: ${select.optionsCount}`);
              console.log(`     İlk seçenek: "${select.firstOptionText}"`);
              console.log(`     İkinci seçenek: "${select.secondOptionText}"`);
              console.log('');
            });
          }
        }
      }
    } catch (error) {
      console.log('❌ İl seçim hatası:', error);
    }
    
    // 10 saniye bekle (manuel inceleme için)
    console.log('\n⏰ 10 saniye bekleniyor (manuel inceleme için)...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Debug hatası:', error);
  } finally {
    await browser.close();
    console.log('🔒 Browser kapatıldı');
  }
}

// Script çalıştır
if (require.main === module) {
  debugPTTSite().catch(console.error);
}

export { debugPTTSite };
