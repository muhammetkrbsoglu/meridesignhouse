#!/usr/bin/env tsx

import { runScraping, setupCronJob } from '../src/lib/ptt-scraper';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'scrape':
      console.log('🚀 PTT scraping başlatılıyor...');
      await runScraping();
      break;
      
    case 'cron':
      console.log('⏰ Cron job kuruluyor...');
      setupCronJob();
      // Keep process alive
      process.on('SIGINT', () => {
        console.log('\n👋 Cron job durduruluyor...');
        process.exit(0);
      });
      break;
      
    case 'help':
    default:
      console.log(`
📋 PTT Scraper CLI

Kullanım:
  npm run scrape-ptt scrape    - Manuel scraping çalıştır
  npm run scrape-ptt cron      - Cron job başlat
  npm run scrape-ptt help      - Bu yardımı göster

Örnekler:
  npm run scrape-ptt scrape
  npm run scrape-ptt cron
      `);
      break;
  }
}

main().catch(console.error);
