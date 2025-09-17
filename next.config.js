/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  serverExternalPackages: ['framer-motion'],
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production'
    const connectSrc = [
      "'self'",
      'https://*.supabase.co',
      'https://ik.imagekit.io',
      'https://www.google-analytics.com',
      'https://stats.g.doubleclick.net',
      'ws:',
      'wss:'
    ].join(' ')

    const imgSrc = [
      "'self'",
      'data:',
      'blob:',
      'https://ik.imagekit.io',
      'https://images.unsplash.com',
      'https://lh3.googleusercontent.com',
      'https://via.placeholder.com',
      'https://picsum.photos'
    ].join(' ')

    const scriptSrc = [
      "'self'",
      isDev ? "'unsafe-inline'" : '',
      isDev ? "'unsafe-eval'" : '',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com'
    ].filter(Boolean).join(' ')

    const styleSrc = [
      "'self'",
      "'unsafe-inline'"
    ].join(' ')

    const csp = [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      `style-src ${styleSrc}`,
      `img-src ${imgSrc}`,
      `font-src 'self' data:`,
      `connect-src ${connectSrc}`,
      `frame-ancestors 'self'`,
      `frame-src 'self'`,
      `object-src 'none'`
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          // Security headers
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // Note: COOP/COEP disabled to avoid third-party asset blocking (ImageKit, Supabase)
          // HSTS (enable only on HTTPS + apex redirect configured)
          // { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Basic CSP (adjust domains as needed)
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ]
  },
  env: {
    IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
    NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = withBundleAnalyzer(nextConfig)