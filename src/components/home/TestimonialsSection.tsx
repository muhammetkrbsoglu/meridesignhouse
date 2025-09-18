import { StarIcon } from '@heroicons/react/24/solid'

interface Testimonial {
  id: string
  name: string
  rating: number
  comment: string
  avatar?: string
  location?: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Ayşe Yılmaz',
    rating: 5,
    comment: 'Ürün kalitesi gerçekten çok iyi. Kargo hızlı geldi ve paketleme özenli yapılmış. Kesinlikle tekrar alışveriş yapacağım.',
    location: 'İstanbul'
  },
  {
    id: '2',
    name: 'Mehmet Kaya',
    rating: 5,
    comment: 'Müşteri hizmetleri çok ilgili ve yardımcı. Ürün tam beklediğim gibi çıktı. Fiyat performans açısından çok memnunum.',
    location: 'Ankara'
  },
  {
    id: '3',
    name: 'Zeynep Demir',
    rating: 4,
    comment: 'Sitede gezinmek çok kolay, ürün çeşitliliği geniş. Sadece kargo biraz geç geldi ama ürün kalitesi beklentilerimi karşıladı.',
    location: 'İzmir'
  }
]

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Müşteri Yorumları
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Binlerce memnun müşterimizin deneyimlerini okuyun ve güvenle alışveriş yapın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Rating Stars */}
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-5 w-5 ${
                      i < testimonial.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Comment */}
              <blockquote className="text-gray-700 mb-6 italic">
                &ldquo;{testimonial.comment}&rdquo;
              </blockquote>

              {/* Customer Info */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center" aria-hidden="true">
                    <span className="text-white font-semibold text-sm">
                      {(testimonial.name?.charAt(0) ?? '?')}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  {testimonial.name && (
                    <p className="text-sm font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                  )}
                  {testimonial.location && (
                    <p className="text-sm text-gray-500">
                      {testimonial.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Güvenli Alışveriş</h3>
            <p className="text-gray-600 text-sm">SSL sertifikası ile korumalı ödeme sistemi</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 rounded-full p-3 mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hızlı Kargo</h3>
            <p className="text-gray-600 text-sm">Aynı gün kargo, 1-2 iş günü teslimat</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-purple-100 rounded-full p-3 mb-4">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Müşteri Memnuniyeti</h3>
            <p className="text-gray-600 text-sm">%98 müşteri memnuniyet oranı</p>
          </div>
        </div>
      </div>
    </section>
  )
}
