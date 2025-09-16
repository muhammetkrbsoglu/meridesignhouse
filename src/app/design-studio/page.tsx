import { CustomerLayout } from '@/components/layout/CustomerLayout'
import Image from 'next/image'
import { getPresetImageUrl } from '@/lib/imagekit'

export default function DesignStudioComingSoon() {
  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Ana Başlık */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-playfair font-bold text-gray-800 mb-4">
              Tasarım Atölyesi
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 font-light">
              Yakında hizmetinizde!
            </p>
          </div>

          {/* Görsel */}
          <div className="mb-12 relative">
            <div className="relative w-full max-w-2xl mx-auto">
              <Image
                src="/tasarim-atolyesi-coming-soon.png"
                alt="Tasarım Atölyesi Yakında"
                width={800}
                height={600}
                className="rounded-2xl shadow-2xl border-8 border-white"
                priority
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>

          {/* Açıklama */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-playfair font-semibold text-gray-800 mb-6">
              Hayalinizdeki Kartı Tasarlayın
            </h2>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Özel günleriniz için kişiselleştirilmiş hatıra kartlarınızı kolayca tasarlayabileceğiniz 
              interaktif atölyemiz yakında sizlerle buluşacak. Canva benzeri sezgisel arayüzümüzle 
              düğün davetiyelerinizden doğum günü kartlarınıza kadar her türlü tasarımı oluşturabileceksiniz.
            </p>
          </div>

          {/* Özellikler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-rose-100">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Kolay Tasarım</h3>
              <p className="text-gray-600">Sürükle-bırak arayüzü ile kolayca tasarım yapın</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-rose-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Hazır Şablonlar</h3>
              <p className="text-gray-600">Profesyonel hazır şablonlardan seçim yapın</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-rose-100">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Hızlı Teslimat</h3>
              <p className="text-gray-600">Tasarımınızı hemen sepete ekleyin ve sipariş verin</p>
            </div>
          </div>

          {/* Bildirim Formu */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-rose-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-playfair font-semibold text-gray-800 mb-4">
              Haberdar Olun
            </h3>
            <p className="text-gray-600 mb-6">
              Tasarım Atölyesi açıldığında ilk siz haberdar olun!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              />
              <button className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                Bildirim Al
              </button>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div className="mt-12 text-gray-500">
            <p className="text-sm">
              Bu özellik yakında aktif olacaktır. Sabırla beklediğiniz için teşekkür ederiz! 💕
            </p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
