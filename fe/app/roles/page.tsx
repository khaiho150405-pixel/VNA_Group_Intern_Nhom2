import { RoleManagementPage } from '@/libs/tts/pages';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Quản lý vai trò - Hệ thống An toàn Vệ sinh Lao động',
};

export default function RolesRoutePage() {
    return <RoleManagementPage />;
}
