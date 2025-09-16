import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin*', '/api*', '/checkout/success*', '/order-tracking*'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin*', '/api/webhook*'],
      },
    ],
    sitemap: 'https://meridesignhouse.com/sitemap.xml',
  }
}


