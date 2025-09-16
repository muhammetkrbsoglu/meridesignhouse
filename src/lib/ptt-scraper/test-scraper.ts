import puppeteer from 'puppeteer';

// Basit test scraper - sadece birkaç il test et
export async function testPTTScraping() {
  console.log('🧪 PTT Test Scraping başlatılıyor...');
  
  const browser = await puppeteer.launch({
    headless: false, // Test için görünür mod
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  try {
    // PTT ana sayfasına git
    console.log('🌐 PTT ana sayfasına gidiliyor...');
    await page.goto('https://postakodu.ptt.gov.tr', { waitUntil: 'networkidle2' });
    
    // Sayfa başlığını kontrol et
    const title = await page.title();
    console.log('📄 Sayfa başlığı:', title);
    
    // Sayfa içeriğini incele
    console.log('🔍 Sayfa içeriği inceleniyor...');
    
    // Tüm linkleri bul
    const allLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      return Array.from(links).map(el => ({
        text: el.textContent?.trim(),
        href: el.getAttribute('href'),
        class: el.className
      })).filter(link => link.href && link.text);
    });
    
    console.log('🔗 Bulunan linkler:', allLinks.slice(0, 10));
    
    // İl seçimi için dropdown ara
    const ilSelect = await page.$('select[name*="il"], select[id*="il"]');
    if (ilSelect) {
      console.log('✅ İl dropdown bulundu');
      
      // Dropdown seçeneklerini çek
      const ilOptions = await page.evaluate(() => {
        const select = document.querySelector('select[name*="il"], select[id*="il"]') as HTMLSelectElement;
        if (select) {
          return Array.from(select.options).map(option => ({
            value: option.value,
            text: option.textContent?.trim()
          })).filter(opt => opt.value && opt.text);
        }
        return [];
      });
      
      console.log('🏙️ İl seçenekleri:', ilOptions.slice(0, 10));
    } else {
      console.log('❌ İl dropdown bulunamadı');
    }
    
    // Form elementlerini ara
    const forms = await page.evaluate(() => {
      const formElements = document.querySelectorAll('form');
      return Array.from(formElements).map(form => ({
        action: form.action,
        method: form.method,
        id: form.id,
        class: form.className
      }));
    });
    
    console.log('📝 Formlar:', forms);
    
    // Tab'ları kontrol et
    const tabs = await page.evaluate(() => {
      const tabElements = document.querySelectorAll('.ajax__tab_tab');
      return Array.from(tabElements).map(tab => ({
        text: tab.textContent?.trim(),
        class: tab.className,
        id: tab.id
      }));
    });
    
    console.log('📑 Tablar:', tabs);
    
    // Posta Kodu Sorgulama tab'ına tıkla
    const postaKoduTab = await page.$('#__tab_MainContent_tabbb_postakodTab');
    if (postaKoduTab) {
      console.log('✅ Posta Kodu Sorgulama tab\'ı bulundu');
      await postaKoduTab.click();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Tab yüklenmesini bekle
      
      // Tab içeriğini incele
      const tabContent = await page.evaluate(() => {
        const content = document.querySelector('.ajax__tab_panel');
        if (content) {
          const selects = content.querySelectorAll('select');
          const inputs = content.querySelectorAll('input');
          const divs = content.querySelectorAll('div');
          
          return {
            selects: Array.from(selects).map(select => ({
              name: select.name,
              id: select.id,
              options: Array.from(select.options).map(opt => ({
                value: opt.value,
                text: opt.textContent?.trim()
              })).slice(0, 5)
            })),
            inputs: Array.from(inputs).map(input => ({
              name: input.name,
              id: input.id,
              type: input.type,
              placeholder: input.placeholder
            })),
            divs: Array.from(divs).map(div => ({
              id: div.id,
              class: div.className,
              text: div.textContent?.trim().substring(0, 100)
            })).filter(div => div.text && div.text.length > 0).slice(0, 10)
          };
        }
        return null;
      });
      
      console.log('📋 Tab içeriği:', tabContent);
      
      // Tüm sayfa içeriğini incele
      const allElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const elementTypes = {};
        
        Array.from(elements).forEach(el => {
          const tagName = el.tagName.toLowerCase();
          if (!elementTypes[tagName]) {
            elementTypes[tagName] = 0;
          }
          elementTypes[tagName]++;
        });
        
        return elementTypes;
      });
      
      console.log('🏗️ Sayfa elementleri:', allElements);
      
      // Select elementlerini bul
      const selectElements = await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        return Array.from(selects).map(select => ({
          name: select.name,
          id: select.id,
          class: select.className,
          options: Array.from(select.options).map(opt => ({
            value: opt.value,
            text: opt.textContent?.trim()
          }))
        }));
      });
      
      console.log('📋 Select elementleri:', selectElements);
      
      // İlk select'in ilk 10 seçeneğini göster
      if (selectElements[0] && selectElements[0].options.length > 0) {
        console.log('🏙️ İlk 10 il:', selectElements[0].options.slice(0, 10));
      }
      
      // İlk ile tıkla ve ilçeleri çek
      if (selectElements[0] && selectElements[0].options.length > 1) {
        const firstIl = selectElements[0].options[1]; // İlk seçenek genelde "Seçiniz" olur
        console.log(`📍 ${firstIl.text} seçiliyor...`);
        
        // İl seç
        await page.select('#MainContent_DropDownList1', firstIl.value);
        await new Promise(resolve => setTimeout(resolve, 1000)); // AJAX yüklenmesini bekle
        
        // İlçeleri çek
        const ilceler = await page.evaluate(() => {
          const select = document.querySelector('#MainContent_DropDownList2') as HTMLSelectElement;
          if (select) {
            return Array.from(select.options).map(opt => ({
              value: opt.value,
              text: opt.textContent?.trim()
            })).filter(opt => opt.value && opt.text);
          }
          return [];
        });
        
        console.log('🏘️ İlçeler:', ilceler.slice(0, 10));
        
        // İlk ilçeyi seç
        if (ilceler.length > 0) {
          const firstIlce = ilceler[0];
          console.log(`📍 ${firstIlce.text} seçiliyor...`);
          
          await page.select('#MainContent_DropDownList2', firstIlce.value);
          await new Promise(resolve => setTimeout(resolve, 1000)); // AJAX yüklenmesini bekle
          
          // Mahalleleri çek
          const mahalleler = await page.evaluate(() => {
            const select = document.querySelector('#MainContent_DropDownList3') as HTMLSelectElement;
            if (select) {
              return Array.from(select.options).map(opt => ({
                value: opt.value,
                text: opt.textContent?.trim()
              })).filter(opt => opt.value && opt.text);
            }
            return [];
          });
          
          console.log('🏘️ Mahalleler:', mahalleler.slice(0, 10));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await browser.close();
    console.log('🔒 Test tamamlandı');
  }
}

// Test çalıştır
if (require.main === module) {
  testPTTScraping().catch(console.error);
}
