import { PTTScraper } from './index';

async function testLimitedScraping() {
  console.log('🧪 Sınırlı PTT Test başlatılıyor...');
  
  const scraper = new PTTScraper();
  
  try {
    await scraper.init();
    
    // Sadece il listesini çek
    console.log('🏙️ İl listesi çekiliyor...');
    const iller = await scraper.scrapeIller();
    console.log(`✅ ${iller.length} il bulundu`);
    
    // Sadece ilk 2 ili test et
    const testIller = iller.slice(0, 2);
    const allData = [];
    
    for (const il of testIller) {
      console.log(`🏙️ ${il.text} işleniyor...`);
      
      try {
        // İlçeleri çek
        const ilceler = await scraper.scrapeIlceler(il.value);
        console.log(`  📍 ${ilceler.length} ilçe bulundu`);

        // Sadece ilk 2 ilçeyi test et
        const testIlceler = ilceler.slice(0, 2);
        
        for (const ilce of testIlceler) {
          try {
            // Mahalleleri çek
            const mahalleler = await scraper.scrapeMahalleler(ilce.value);
            console.log(`    🏘️ ${ilce.text}: ${mahalleler.length} mahalle`);

            // Sadece ilk 3 mahalleyi test et
            const testMahalleler = mahalleler.slice(0, 3);
            
            for (const mahalle of testMahalleler) {
              try {
                // Posta kodunu çek
                const postaKodu = await scraper.scrapePostaKodu(mahalle.value);
                
                if (postaKodu) {
                  allData.push({
                    il: il.text,
                    ilce: ilce.text,
                    mahalle: mahalle.text,
                    postaKodu
                  });
                  console.log(`      ✅ ${mahalle.text}: ${postaKodu}`);
                } else {
                  console.log(`      ❌ ${mahalle.text}: Posta kodu bulunamadı`);
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                console.error(`      ❌ Mahalle hatası (${mahalle.text}):`, error);
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
    
    console.log(`\n🎉 Test tamamlandı! Toplam ${allData.length} adres verisi çekildi:`);
    allData.forEach((item, index) => {
      console.log(`${index + 1}. ${item.il} - ${item.ilce} - ${item.mahalle} - ${item.postaKodu}`);
    });
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await scraper.close();
  }
}

// Test çalıştır
if (require.main === module) {
  testLimitedScraping().catch(console.error);
}
