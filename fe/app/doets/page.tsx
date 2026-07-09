import { EnterpriseListPage } from '@tts/pages';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Quản lý doanh nghiệp - Hệ thống An toàn Vệ sinh Lao động',
};

export default function Page() {
  return <EnterpriseListPage />;
}
