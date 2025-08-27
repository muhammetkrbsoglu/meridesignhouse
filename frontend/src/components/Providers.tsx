'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ToastProvider } from './ToastProvider';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <ClerkProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ClerkProvider>
  );
}


