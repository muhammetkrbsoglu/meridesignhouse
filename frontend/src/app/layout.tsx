import type { Metadata } from 'next';
import './globals.css';
import ClientShell from '../components/ClientShell';

export const metadata: Metadata = {
  title: 'MeriDesignHouse - Özel Gün Tasarım Hediyeleri',
  description: 'Düğün, kına ve özel günleriniz için tasarım hediyeleri. Etkinlik konsept tasarımcısı ve tasarım atölyesi ile kişiselleştirilmiş ürünler.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-primary-background text-primary-text">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
