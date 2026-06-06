import { LoginPage } from '@/libs/tts/pages/login';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập | VNA Group',
  description: 'Hệ thống quản trị VNA Group',
};

export default function LoginRoute() {
  return <LoginPage />;
}