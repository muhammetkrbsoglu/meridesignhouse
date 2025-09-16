# PTT Scraper

PTT'den Türkiye adres verilerini (il-ilçe-mahalle-posta kodu) çeken scraping kütüphanesi.

## 🚀 Özellikler

- **Tam Veri Seti**: 81 il, tüm ilçeler, mahalleler ve posta kodları
- **Otomatik Güncelleme**: Cron job ile ayda 1 kez otomatik güncelleme
- **Hızlı ve Güvenilir**: Puppeteer ile güvenilir scraping
- **TypeScript Desteği**: Tam TypeScript desteği
- **Kolay Kullanım**: Basit API ile kolay entegrasyon

## 📦 Kurulum

```bash
npm install ptt-scraper
```

## 🔧 Kullanım

### Temel Kullanım

```typescript
import { PTTScraper, runScraping } from 'ptt-scraper';

// Manuel scraping
const scraper = new PTTScraper();
await scraper.init();
const data = await scraper.scrapeAllData();
await scraper.saveData(data);
await scraper.close();

// Veya hazır fonksiyon
const data = await runScraping();
```

### Cron Job

```typescript
import { setupCronJob } from 'ptt-scraper';

// Her ayın 1'inde saat 02:00'da çalıştır
setupCronJob();
```

### CLI Kullanımı

```bash
# Manuel scraping
npx ptt-scraper scrape

# Cron job başlat
npx ptt-scraper cron
```

## 📊 Veri Yapısı

```typescript
interface AddressData {
  il: string;           // İl adı
  ilce: string;         // İlçe adı
  mahalle: string;      // Mahalle adı
  postaKodu: string;    // Posta kodu
  koordinat?: {         // Opsiyonel koordinat
    lat: number;
    lng: number;
  };
}

interface ScrapedData {
  timestamp: string;     // Çekilme tarihi
  totalCount: number;    // Toplam adres sayısı
  data: AddressData[];   // Adres verileri
}
```

## 🗂️ Çıktı Dosyaları

Veriler `data/ptt/` klasörüne JSON formatında kaydedilir:

```
data/ptt/
├── ptt-addresses-2024-01-15.json
├── ptt-addresses-2024-02-01.json
└── ...
```

## ⚙️ Konfigürasyon

### Rate Limiting

```typescript
// Her mahalle arasında 100ms bekleme
await this.delay(100);
```

### Çıktı Klasörü

```typescript
// Varsayılan: data/ptt/
const filepath = await scraper.saveData(data, 'custom-filename.json');
```

## 🚨 Önemli Notlar

- **Rate Limiting**: PTT sitesine aşırı yük bindirmemek için her istek arasında bekleme süresi vardır
- **Güncelleme**: Veriler ayda 1 kez otomatik güncellenir
- **Hata Yönetimi**: Hatalı veriler atlanır, işlem devam eder
- **Bellek Kullanımı**: Büyük veri setleri için yeterli RAM gerekir

## 📈 Performans

- **İşlem Süresi**: ~2-3 saat (tüm veriler)
- **Bellek Kullanımı**: ~500MB
- **Veri Boyutu**: ~50MB (JSON)
- **Adres Sayısı**: ~50,000+ adres

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🆘 Destek

Sorunlar için [GitHub Issues](https://github.com/meridesignhouse/ptt-scraper/issues) kullanın.

## 🔄 Güncellemeler

### v1.0.0
- İlk sürüm
- Temel scraping fonksiyonları
- Cron job desteği
- TypeScript desteği
