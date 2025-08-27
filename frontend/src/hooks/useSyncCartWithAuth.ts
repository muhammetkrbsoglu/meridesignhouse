'use client';

import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useCartStore } from '../stores/cart.store';

export function useSyncCartWithAuth() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const { loadCart, resetCart, mergeGuestCartToUser, initializeGuestCart } = useCartStore();
  const mergedRef = useRef(false);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize guest cart on mount
    initializeGuestCart();
    
    let cancelled = false;
    const sync = async () => {
      if (!isLoaded) return; // wait for Clerk to be ready

      const userId = user?.id;
      const storage = typeof window !== 'undefined' ? window.localStorage : undefined;

      if (isSignedIn && userId) {

        // User-based idempotency flag and lock
        const mergedFor = storage?.getItem('merged_for_user_id');
        if (mergedFor === userId) {
          // Already merged for this user; just load from server
          const token = await getToken();
          if (token && !cancelled) await loadCart(token);
          return;
        }

        // Acquire simple lock to avoid multi-tab duplicate merges
        const lock = storage?.getItem('guest_merge_lock');
        if (!lock) storage?.setItem('guest_merge_lock', JSON.stringify({ userId, ts: Date.now() }));

        // Retry getToken with backoff
        let token: string | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          token = await getToken();
          if (token) break;
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
        }
        if (cancelled) return;
        if (!token) return; // No token, skip syncing gracefully

        try {
          if (!mergedRef.current) {

            await mergeGuestCartToUser(token);
            mergedRef.current = true;
            storage?.setItem('merged_for_user_id', userId);

          }

          await loadCart(token);
        } finally {

          storage?.removeItem('guest_merge_lock');
        }
      } else {
        // Signed out: keep guest cart silently (no server calls)
        mergedRef.current = false;
        resetCart();
      }
    };
    sync();
    return () => {
      cancelled = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [isSignedIn, isLoaded, user, getToken, loadCart, resetCart, mergeGuestCartToUser, initializeGuestCart]);
}


