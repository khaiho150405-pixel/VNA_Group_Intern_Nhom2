import { PermissionListPage } from '@/libs/tts/pages';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Quản lý quyền hạn - Hệ thống An toàn Vệ sinh Lao động',
};

export default function PermissionsRoutePage() {
    return <PermissionListPage />;
}
