'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCartCount } from '@/lib/actions/cart';

export function CartIcon() {
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const count = await getCartCount();
        setCartCount(count);
      } catch (error) {
        console.error('Error fetching cart count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    // Listen for storage events (cart updates from other tabs)
    window.addEventListener('storage', handleCartUpdate);
    
    // Custom event for cart updates within the same tab
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  return (
    <Link
      href="/cart"
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      title="Sepetim"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2-2v4m16 0H4"
        />
      </svg>
      
      {/* Cart Count Badge */}
      {!isLoading && cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </Link>
  );
}