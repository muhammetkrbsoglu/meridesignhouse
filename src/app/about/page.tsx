import { Metadata } from 'next'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Star, Sparkles, Users, Target, Award, Palette, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hakkımızda | Meri Design House',
  description: 'Meri Design House hakkında bilgi edinin. Misyonumuz, vizyonumuz ve ekibimizi tanıyın.',
}

export default function AboutPage() {
  return (
    <CustomerLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 text-rose-200 animate-pulse">
              <Sparkles size={24} />
            </div>
            <div className="absolute top-40 right-20 text-pink-200 animate-bounce">
              <Heart size={32} />
            </div>
            <div className="absolute bottom-32 left-20 text-purple-200 animate-pulse">
              <Star size={28} />
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                Hakkımızda
              </h1>
              <p className="text-lg md:text-xl mb-8 text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Hayalinizdeki etkinlikleri gerçeğe dönüştüren, yaratıcılık ve kaliteyi bir araya getiren tasarım evi.
              </p>
            </div>
          </div>

          {/* Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 fill-white">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,51.06C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
            </svg>
          </div>
        </section>

        {/* Company Story */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                  Hikayemiz
                </h2>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Meri Design House, özel günlerinizi unutulmaz kılma tutkusuyla 2020 yılında kuruldu. 
                  Her etkinliğin kendine özgü bir hikayesi olduğuna inanıyor, bu hikayeleri en güzel 
                  şekilde anlatmanın yollarını arıyoruz.
                </p>
                <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                  Düğünlerden doğum günlerine, kurumsal etkinliklerden özel kutlamalara kadar 
                  geniş bir yelpazede hizmet veriyor, her projeye aynı özen ve yaratıcılıkla yaklaşıyoruz.
                </p>
                <Link href="/contact">
                  <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <Heart className="mr-2 h-5 w-5" />
                    Bizimle İletişime Geçin
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-3xl p-8 shadow-2xl">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Yaratıcılık & Kalite</h3>
                    <p className="text-gray-600">
                      Her projede özgün tasarımlar ve yüksek kalite standartları
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                Misyon & Vizyon
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Misyonumuz</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Her müşterimizin hayallerini gerçeğe dönüştürmek, özel günlerini 
                      unutulmaz kılacak özgün ve kaliteli tasarımlar sunmak. Yaratıcılığımızı 
                      ve deneyimimizi birleştirerek mükemmel etkinlik deneyimleri oluşturmak.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Vizyonumuz</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Türkiye&apos;nin en güvenilir ve yaratıcı etkinlik tasarım markası olmak. 
                      İnovatif yaklaşımlarımız ve müşteri memnuniyeti odaklı hizmetimizle 
                      sektörde öncü konumda yer almak.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                Değerlerimiz
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Çalışma prensiplerimiz ve müşterilerimize sunduğumuz değerler
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Palette className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Yaratıcılık</h3>
                <p className="text-gray-600">
                  Her projede özgün ve yenilikçi tasarım anlayışı
                </p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Kalite</h3>
                <p className="text-gray-600">
                  En yüksek standartlarda malzeme ve işçilik
                </p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Müşteri Odaklılık</h3>
                <p className="text-gray-600">
                  Her müşterinin ihtiyaçlarına özel çözümler
                </p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Zamanında Teslimat</h3>
                <p className="text-gray-600">
                  Belirlenen sürelerde eksiksiz proje teslimi
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Hayalinizdeki Etkinliği Birlikte Tasarlayalım
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Özel gününüzü unutulmaz kılmak için bizimle iletişime geçin. 
              Uzman ekibimiz size en uygun çözümleri sunmaya hazır.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Sparkles className="mr-2 h-5 w-5" />
                  İletişime Geçin
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="border-2 border-rose-300 text-rose-600 hover:bg-rose-50 px-8 py-4 rounded-full transition-all duration-300 hover:border-rose-400">
                  Ürünleri İnceleyin
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </CustomerLayout>
  )
}