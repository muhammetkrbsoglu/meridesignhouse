'use client'

export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Meri DesignHouse',
    url: 'https://meridesignhouse.com',
    logo: '/MeriDesignHouse_Logo.svg',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+905356292467',
      email: 'meridesinghouse@gmail.com',
      contactType: 'customer service',
      availableLanguage: ['Turkish'],
      areaServed: 'TR',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
      addressLocality: 'Atakum, Samsun',
    },
    sameAs: [
      'https://www.instagram.com/meridesignhouse/',
      'https://www.facebook.com/meridesignhouse',
      'https://wa.me/905356292467',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}


