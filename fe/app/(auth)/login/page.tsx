import { LoginPage } from '@tts/pages/LoginPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập | VNA Group',
  description: 'Hệ thống quản trị VNA Group',
};

export default function LoginRoute() {
  return <LoginPage />;
}