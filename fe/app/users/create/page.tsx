import { UserCreatePage } from '@/libs/tts/pages/UserCreatePage'; // Thay đổi đường dẫn import nếu cần
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Thêm mới người dùng - Hệ thống An toàn Vệ sinh Lao động',
};

export default function CreateUserRoutePage() {
    return <UserCreatePage />;
}