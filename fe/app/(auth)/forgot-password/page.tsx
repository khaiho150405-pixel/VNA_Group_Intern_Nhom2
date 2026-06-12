import { ForgotPasswordPage } from '@tts/pages/ForgotPasswordPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Khôi phục mật khẩu | VNA Group',
};

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
