import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { ProductDetail } from '@/components/products/ProductDetail';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { fetchProductBySlug, fetchRelatedProducts } from '@/lib/actions/products';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  
  if (!product) {
    return {
      title: 'Ürün Bulunamadı',
    };
  }

  return {
    title: `${product.name} | Meri Design House`,
    description: product.description || `${product.name} - Meri Design House'da satışta`,
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} - Meri Design House'da satışta`,
      type: 'product',
      images: product.product_images?.length > 0
        ? [{ url: product.product_images[0].url, width: 1200, height: 630, alt: product.name }]
        : [{ url: '/placeholder-product.jpg', width: 1200, height: 630, alt: 'Ürün görseli' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || `${product.name} - Meri Design House'da satışta`,
      images: [product.product_images?.[0]?.url || '/placeholder-product.jpg'],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  const relatedProducts = product ? await fetchRelatedProducts(product.id, product.categoryId) : [];

  if (!product) {
    notFound();
  }

  const breadcrumbItems = [
    {
      label: product.category.name,
      href: `/categories/${product.category.slug}`,
    },
    {
      label: product.name,
    },
  ];

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Product Detail */}
        <ProductDetail product={product} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <RelatedProducts products={relatedProducts} />
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}