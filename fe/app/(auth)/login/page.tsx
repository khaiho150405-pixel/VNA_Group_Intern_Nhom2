import { LoginPage } from '@tts/pages/LoginPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập - Hệ thống An toàn Vệ sinh Lao động',
  description: 'Hệ thống quản trị VNA Group',
};

export default function LoginRoute() {
  return <LoginPage />;
}
