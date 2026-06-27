import { ForgotPasswordPage } from '@tts/pages/ForgotPasswordPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quên mật khẩu - Hệ thống An toàn Vệ sinh Lao động',
};



export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
