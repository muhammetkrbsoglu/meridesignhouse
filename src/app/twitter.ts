import type { Metadata } from 'next'

const defaultTitle = 'Meri Design House - Özgün Etkinlik Tasarımları'
const defaultDescription = 'Özel günlerinizi unutulmaz kılmak için kişiye özel tasarım ürünler, setler ve konsept çözümleri.'
const defaultImageUrl = 'https://meridesignhouse.com/og-cover.jpg'

export default function twitter(): Metadata['twitter'] {
  return {
    card: 'summary_large_image',
    site: '@meridesignhouse',
    creator: '@meridesignhouse',
    title: defaultTitle,
    description: defaultDescription,
    images: [defaultImageUrl],
  }
}
