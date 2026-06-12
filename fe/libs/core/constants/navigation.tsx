import React from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  roles: ('ROLE_SO' | 'ROLE_DN')[];
  children?: NavItem[];
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { 
    id: 'system', 
    label: 'Hệ thống', 
    icon: <SettingsIcon fontSize="small" />,
    roles: ['ROLE_SO', 'ROLE_DN'],
    children: [
      { id: 'account', label: 'Tài khoản', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO', 'ROLE_DN'], path: '/account' },
      { id: 'company-mgmt', label: 'Quản lý doanh nghiệp', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO', 'ROLE_DN'] },
      { id: 'report-period', label: 'Kỳ báo cáo', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO', 'ROLE_DN'] },
    ]
  },
  { 
    id: 'accident', 
    label: 'Tai nạn lao động', 
    icon: <SettingsIcon fontSize="small" />,
    roles: ['ROLE_SO', 'ROLE_DN'],
    children: [
      { id: 'common-list', label: 'Danh mục chung', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO', 'ROLE_DN'] },
      { id: 'tnld-hdlh', label: 'TNLD theo HĐLĐ', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO', 'ROLE_DN'] },
    ]
  },
];
