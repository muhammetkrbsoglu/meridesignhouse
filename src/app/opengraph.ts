import type { Metadata } from 'next'

const defaultTitle = 'Meri Design House - Özgün Etkinlik Tasarımları'
const defaultDescription = 'Özel günlerinizi unutulmaz kılmak için kişiye özel tasarım ürünler, setler ve konsept çözümleri.'
const defaultImage = {
  url: 'https://meridesignhouse.com/og-cover.jpg',
  width: 1200,
  height: 630,
}

export default function openGraph(): Metadata['openGraph'] {
  return {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://meridesignhouse.com',
    siteName: 'Meri Design House',
    title: defaultTitle,
    description: defaultDescription,
    images: [defaultImage],
  }
}
