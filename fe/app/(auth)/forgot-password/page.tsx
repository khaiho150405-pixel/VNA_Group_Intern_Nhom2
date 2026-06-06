import { ForgotPasswordPage } from '@tts/pages/reset-password';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Khôi phục mật khẩu | VNA Group',
};

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}