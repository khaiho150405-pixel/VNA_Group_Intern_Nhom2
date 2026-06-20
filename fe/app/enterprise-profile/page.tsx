import { EnterpriseFormPage } from '@tts/pages';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thông tin doanh nghiệp | VNA Group',
  description: 'Quản lý thông tin doanh nghiệp',
};

export default function EnterpriseProfilePage() {
  return <EnterpriseFormPage mode="profile" />;
}
