'use client';

import React from 'react';
import { MainLayout } from '@core/layouts/MainLayout';
import { AccountInfoPage } from '@tts/pages/AccountInfoPage';

export default function AccountPage() {
  return (
    <MainLayout>
      <AccountInfoPage />
    </MainLayout>
  );
}
