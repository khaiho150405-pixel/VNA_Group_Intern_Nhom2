"use client";
import React from 'react';
import ThemeRegistry from '@core/contexts/ThemeRegistry';
import { AuthProvider } from '@core/contexts/AuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}

