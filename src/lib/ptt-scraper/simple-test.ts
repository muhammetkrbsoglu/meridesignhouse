import { PTTScraper } from './index';

async function testSimpleScraping() {
  console.log('🧪 Basit PTT Test başlatılıyor...');
  
  const scraper = new PTTScraper();
  
  try {
    await scraper.init();
    
    // Sadece il listesini çek
    console.log('🏙️ İl listesi çekiliyor...');
    const iller = await scraper.scrapeIller();
    console.log(`✅ ${iller.length} il bulundu:`, iller.slice(0, 5));
    
    // İlk ilin ilçelerini çek
    if (iller.length > 0) {
      const firstIl = iller[0];
      console.log(`📍 ${firstIl.text} ilçeleri çekiliyor...`);
      const ilceler = await scraper.scrapeIlceler(firstIl.value);
      console.log(`✅ ${ilceler.length} ilçe bulundu:`, ilceler.slice(0, 5));
      
      // İlk ilçenin mahallelerini çek
      if (ilceler.length > 0) {
        const firstIlce = ilceler[0];
        console.log(`🏘️ ${firstIlce.text} mahalleleri çekiliyor...`);
        const mahalleler = await scraper.scrapeMahalleler(firstIlce.value);
        console.log(`✅ ${mahalleler.length} mahalle bulundu:`, mahalleler.slice(0, 5));
        
        // İlk mahallenin posta kodunu çek
        if (mahalleler.length > 0) {
          const firstMahalle = mahalleler[0];
          console.log(`📮 ${firstMahalle.text} posta kodu çekiliyor...`);
          const postaKodu = await scraper.scrapePostaKodu(firstMahalle.value);
          console.log(`✅ Posta kodu: ${postaKodu}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await scraper.close();
  }
}

// Test çalıştır
if (require.main === module) {
  testSimpleScraping().catch(console.error);
}
