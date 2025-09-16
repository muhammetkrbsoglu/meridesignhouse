#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface AddressData {
  il: string;
  ilce: string;
  mahalle: string;
  postaKodu: string;
}

interface ScrapedData {
  timestamp: string;
  totalCount: number;
  data: AddressData[];
}

async function importPTTData() {
  console.log('🚀 PTT verileri veritabanına aktarılıyor...');
  
  try {
    // En son veri dosyasını bul
    const dataDir = path.join(process.cwd(), 'data', 'ptt');
    if (!fs.existsSync(dataDir)) {
      console.log('❌ Veri klasörü bulunamadı. Önce PTT scraping çalıştırın.');
      return;
    }

    const files = fs.readdirSync(dataDir)
      .filter(file => file.startsWith('ptt-addresses-') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('❌ Veri dosyası bulunamadı. Önce PTT scraping çalıştırın.');
      return;
    }

    const latestFile = files[0];
    const filePath = path.join(dataDir, latestFile);
    console.log(`📁 Veri dosyası: ${latestFile}`);

    // Veri dosyasını oku
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const scrapedData: ScrapedData = JSON.parse(fileContent);
    
    console.log(`📊 Toplam veri: ${scrapedData.totalCount} adres`);
    console.log(`📅 Veri tarihi: ${scrapedData.timestamp}`);

    // Mevcut verileri temizle
    console.log('🧹 Mevcut veriler temizleniyor...');
    await prisma.mahalle.deleteMany();
    await prisma.ilce.deleteMany();
    await prisma.il.deleteMany();

    // Verileri grupla
    const ilMap = new Map<string, { name: string; code: string; ilceler: Map<string, { name: string; code: string; mahalleler: AddressData[] }> }>();

    for (const address of scrapedData.data) {
      if (!ilMap.has(address.il)) {
        ilMap.set(address.il, {
          name: address.il,
          code: address.il,
          ilceler: new Map()
        });
      }

      const il = ilMap.get(address.il)!;
      if (!il.ilceler.has(address.ilce)) {
        il.ilceler.set(address.ilce, {
          name: address.ilce,
          code: address.ilce,
          mahalleler: []
        });
      }

      il.ilceler.get(address.ilce)!.mahalleler.push(address);
    }

    console.log(`🏙️ ${ilMap.size} il bulundu`);

    // Verileri veritabanına aktar
    let processedCount = 0;
    let totalMahalleler = 0;

    for (const [ilName, ilData] of ilMap) {
      console.log(`📍 ${ilName} işleniyor... (${ilData.ilceler.size} ilçe)`);
      
      // İl oluştur
      const il = await prisma.il.create({
        data: {
          name: ilData.name,
          code: ilData.code
        }
      });

      for (const [ilceName, ilceData] of ilData.ilceler) {
        // İlçe oluştur
        const ilce = await prisma.ilce.create({
          data: {
            name: ilceData.name,
            code: ilceData.code,
            il_id: il.id
          }
        });

        // Mahalleleri oluştur
        for (const mahalleData of ilceData.mahalleler) {
          // Mahalle ismini temizle ve kısalt
          const cleanMahalleName = mahalleData.mahalle
            .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluk yap
            .replace(/MAH\s*$/, '') // Sonundaki MAH'ı kaldır
            .replace(/\/.*$/, '') // / işaretinden sonrasını kaldır
            .trim()
            .substring(0, 200); // 200 karakter ile sınırla
          
          await prisma.mahalle.create({
            data: {
              name: cleanMahalleName,
              code: cleanMahalleName.substring(0, 50), // Code için 50 karakter
              posta_kodu: mahalleData.postaKodu,
              ilce_id: ilce.id
            }
          });
          totalMahalleler++;
        }

        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`  ✅ ${processedCount} ilçe işlendi...`);
        }
      }
    }

    console.log(`\n🎉 Veri aktarımı tamamlandı!`);
    console.log(`📊 İstatistikler:`);
    console.log(`  - İl: ${ilMap.size}`);
    console.log(`  - İlçe: ${processedCount}`);
    console.log(`  - Mahalle: ${totalMahalleler}`);

    // Veritabanı istatistiklerini göster
    const dbStats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM iller) as il_count,
        (SELECT COUNT(*) FROM ilceler) as ilce_count,
        (SELECT COUNT(*) FROM mahalleler) as mahalle_count
    `;

    console.log(`\n📈 Veritabanı istatistikleri:`);
    console.log(`  - İl: ${(dbStats as any)[0].il_count}`);
    console.log(`  - İlçe: ${(dbStats as any)[0].ilce_count}`);
    console.log(`  - Mahalle: ${(dbStats as any)[0].mahalle_count}`);

  } catch (error) {
    console.error('❌ Veri aktarım hatası:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script çalıştır
if (require.main === module) {
  importPTTData().catch(console.error);
}

export { importPTTData };
