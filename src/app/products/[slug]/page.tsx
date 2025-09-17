import { Metadata } from 'next';
export const revalidate = 60

import { notFound } from 'next/navigation';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { ProductDetail } from '@/components/products/ProductDetail';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { fetchProductBySlug, fetchRelatedProducts } from '@/lib/actions/products';
import { PageTransition } from '@/components/motion/PageTransition';
import { ProductCTABar } from '@/components/motion/StickyCTA';
import { useState } from 'react';

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
      type: 'website',
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
    <CustomerLayout showMobileNav={true}>
      <PageTransition direction="left">
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

        {/* Mobile Sticky CTA */}
        <ProductCTABar
          onAddToCart={() => {
            // This will be handled by ProductDetail component
            const addToCartBtn = document.querySelector('[data-add-to-cart]') as HTMLButtonElement;
            if (addToCartBtn) addToCartBtn.click();
          }}
          onAddToFavorites={() => {
            // This will be handled by ProductDetail component
            const favoriteBtn = document.querySelector('[data-favorite-btn]') as HTMLButtonElement;
            if (favoriteBtn) favoriteBtn.click();
          }}
          price={`${product.price.toLocaleString('tr-TR')} ₺`}
          isInCart={false} // This should be checked from cart state
          isFavorite={false} // This should be checked from favorites state
        />
      </PageTransition>
    </CustomerLayout>
  );
}