"use client";
import React from 'react';
import ThemeRegistry from '@core/contexts/ThemeRegistry';
import { AuthProvider } from '@core/contexts/AuthProvider';
import { usePathname } from 'next/navigation';
import { MainLayout } from '@core/layouts/MainLayout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/forgot-password') || pathname?.startsWith('/register-enterprise');

  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ThemeRegistry>
            {isAuthRoute ? children : <MainLayout>{children}</MainLayout>}
          </ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}

