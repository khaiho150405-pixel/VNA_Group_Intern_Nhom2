import { UserEditPage } from '@/libs/tts/pages/UserEditPage'; // Thay đổi đường dẫn import nếu cần
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cập nhật người dùng - Hệ thống An toàn Vệ sinh Lao động',
};

export default function EditUserRoutePage() {
    return <UserEditPage />;
}