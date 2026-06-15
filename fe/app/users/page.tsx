import { UserManagementPage } from '@/libs/tts/pages/UserManagementPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Quản lý người dùng - Hệ thống An toàn Vệ sinh Lao động',
};

export default function UsersRoutePage() {
    return <UserManagementPage />;
}