import * as fs from 'fs';
import * as path from 'path';

// Test verisi
const testData = {
  "timestamp": "2025-09-14T11:09:57.429Z",
  "totalCount": 11,
  "data": [
    {
      "il": "ADANA",
      "ilce": "ALADAĞ",
      "mahalle": "AKÖREN MAH                                                                 / MADENLİ                       / 01722",
      "postaKodu": "01722"
    },
    {
      "il": "ADANA",
      "ilce": "ALADAĞ",
      "mahalle": "AKPINAR MAH                                                                / ALADAĞ                        / 01720",
      "postaKodu": "01722"
    }
  ]
};

console.log('🧪 Test veri temizleme başlatılıyor...');
console.log('📊 Test verisi:', JSON.stringify(testData, null, 2));

// Basit temizleme testi
function cleanMahalleName(mahalle: string): string {
  return mahalle
    .split('/')[0]  // İlk kısmı al (mahalle adı)
    .trim()         // Boşlukları temizle
    .replace(/\s+/g, ' ')  // Çoklu boşlukları tek boşluk yap
    .replace(/MAH\s*$/, 'MAH')  // MAH sonuna düzgün boşluk ekle
    .replace(/\s+MAH$/, ' MAH'); // MAH'dan önceki boşlukları düzenle
}

function extractPostaKoduFromMahalle(mahalle: string): string | null {
  const match = mahalle.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

console.log('\n🔍 Temizleme testi:');
for (const address of testData.data) {
  const temizMahalle = cleanMahalleName(address.mahalle);
  const postaKoduFromMahalle = extractPostaKoduFromMahalle(address.mahalle);
  
  console.log(`\n📍 ${address.il} > ${address.ilce}`);
  console.log(`   Orijinal: ${address.mahalle}`);
  console.log(`   Temiz: ${temizMahalle}`);
  console.log(`   Posta kodu (mahalle): ${postaKoduFromMahalle}`);
  console.log(`   Posta kodu (alan): ${address.postaKodu}`);
  console.log(`   Tutarlı: ${postaKoduFromMahalle === address.postaKodu ? '✅' : '❌'}`);
}

console.log('\n✅ Test tamamlandı!');
