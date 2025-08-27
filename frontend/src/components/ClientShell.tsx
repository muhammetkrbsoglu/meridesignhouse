'use client';

import React from 'react';
import Providers from './Providers';
import Header from './Header';
import Footer from './Footer';

export default function ClientShell({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <Providers>
      <Header />
      <main>
        {children}
      </main>
      <Footer />
    </Providers>
  );
}


