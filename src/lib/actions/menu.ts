'use server';

import { getSupabaseAdmin } from '@/lib/supabase';

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  children: MenuCategory[];
  productCount: number;
}

export interface MenuProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  categories: {
    name: string;
    slug: string;
  }[];
}

export async function fetchMenuCategories(): Promise<MenuCategory[]> {
  try {
    const supabase = getSupabaseAdmin();

    // Ana kategorileri getir
    const { data: parentCategories, error: parentError } = await supabase
      .from('categories')
      .select('*')
      .is('parentId', null)
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (parentError) {
      console.error('Ana kategoriler getirilirken hata:', parentError);
      return [];
    }

    if (!parentCategories) return [];

    // Her ana kategori için alt kategorileri ve ürün sayılarını getir
    const categoriesWithChildren = await Promise.all(
      parentCategories.map(async (parent: any) => {
        // Alt kategorileri getir
        const { data: children, error: childrenError } = await supabase
          .from('categories')
          .select('*')
          .eq('parentId', parent.id)
          .eq('isActive', true)
          .order('name', { ascending: true });

        if (childrenError) {
          console.error('Alt kategoriler getirilirken hata:', childrenError);
        }

        // Ana kategori için ürün sayısını getir
        const { count: parentProductCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('categoryId', parent.id)
          .eq('isActive', true);

        // Alt kategoriler için ürün sayılarını ve torun kategorilerini getir
        const childrenWithGrandChildren = await Promise.all(
          (children || []).map(async (child: any) => {
            // Torun kategorileri getir
            const { data: grandChildren, error: grandChildrenError } = await supabase
              .from('categories')
              .select('*')
              .eq('parentId', child.id)
              .eq('isActive', true)
              .order('name', { ascending: true });

            if (grandChildrenError) {
              console.error('Torun kategoriler getirilirken hata:', grandChildrenError);
            }

            // Alt kategori için ürün sayısını getir
            const { count: childProductCount } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('categoryId', child.id)
              .eq('isActive', true);

            // Torun kategoriler için ürün sayılarını getir
            const grandChildrenWithCounts = await Promise.all(
              (grandChildren || []).map(async (grandChild: any) => {
                const { count: grandChildProductCount } = await supabase
                  .from('products')
                  .select('*', { count: 'exact', head: true })
                  .eq('categoryId', grandChild.id)
                  .eq('isActive', true);

                return {
                  id: grandChild.id,
                  name: grandChild.name,
                  slug: grandChild.slug,
                  productCount: grandChildProductCount || 0,
                  children: [],
                };
              })
            );

            return {
              id: child.id,
              name: child.name,
              slug: child.slug,
              productCount: childProductCount || 0,
              children: grandChildrenWithCounts,
            };
          })
        );

        return {
          id: parent.id,
          name: parent.name,
          slug: parent.slug,
          productCount: parentProductCount || 0,
          children: childrenWithGrandChildren,
        };
      })
    );

    return categoriesWithChildren;
  } catch (error) {
    console.error('Menu kategorileri getirilirken hata:', error);
    return [];
  }
}

export async function fetchFeaturedProductsForCategory(categoryId: string, limit: number = 4): Promise<MenuProduct[]> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        product_images(url, alt, sortOrder),
        category:categories!inner(
          id,
          name,
          slug
        )
      `)
      .eq('categoryId', categoryId)
      .eq('isActive', true)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Kategori ürünleri getirilirken hata:', error);
      return [];
    }

    if (!products) {
      return [];
    }

    return products.map((product: any) => {
      // Sort images by sortOrder
      const sortedImages = (product.product_images || [])
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((img: any) => img.url);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        images: sortedImages,
        categories: [product.category]
      };
    });
  } catch (error) {
    console.error('Kategori ürünleri getirilirken hata:', error);
    return [];
  }
}

/**
 * Fetch weekly featured product for a specific category
 */
export async function fetchWeeklyFeaturedProduct(categoryId: string): Promise<MenuProduct | null> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        product_images(url, alt, sortOrder),
        category:categories!inner(
          id,
          name,
          slug
        )
      `)
      .eq('categoryId', categoryId)
      .eq('isActive', true)
      .eq('isProductOfWeek', true)
      .order('createdAt', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Haftanın öne çıkan ürünü getirilirken hata:', error);
      return null;
    }

    if (!product || product.length === 0) {
      return null;
    }

    const productData = product[0] as any;

    // Sort images by sortOrder
    const sortedImages = (productData.product_images || [])
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((img: any) => img.url);

    const menuProduct: MenuProduct = {
      id: productData.id,
      name: productData.name,
      slug: productData.slug,
      price: productData.price,
      images: sortedImages,
      categories: [productData.category]
    };

    return menuProduct;
  } catch (error) {
    console.error('Haftanın öne çıkan ürünü getirilirken hata:', error);
    return null;
  }
}