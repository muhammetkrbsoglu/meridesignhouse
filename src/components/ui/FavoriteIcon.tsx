'use client';

import { HeartIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { getFavoriteCount } from '@/lib/api/cartClient';

export function FavoriteIcon() {
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavoriteCount = async () => {
    try {
      const count = await getFavoriteCount();
      setFavoriteCount(count);
    } catch (error) {
      console.error('Error loading favorite count:', error);
      setFavoriteCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavoriteCount();

    // Listen for favorite updates
    const handleFavoriteUpdate = () => {
      loadFavoriteCount();
    };

    // Listen for storage changes (for cross-tab updates)
    window.addEventListener('storage', handleFavoriteUpdate);
    
    // Listen for custom favorite update events
    window.addEventListener('favoriteUpdated', handleFavoriteUpdate);

    return () => {
      window.removeEventListener('storage', handleFavoriteUpdate);
      window.removeEventListener('favoriteUpdated', handleFavoriteUpdate);
    };
  }, []);

  return (
    <div className="p-2 relative">
      <HeartIcon className="h-6 w-6 text-gray-600" />
      {!isLoading && favoriteCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {favoriteCount > 99 ? '99+' : favoriteCount}
        </span>
      )}
    </div>
  );
}
