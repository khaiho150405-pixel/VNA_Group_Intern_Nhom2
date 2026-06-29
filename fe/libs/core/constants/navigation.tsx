import React from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import HomeIcon from '@mui/icons-material/Home';
import HelpIcon from '@mui/icons-material/HelpOutlined';
import MailIcon from '@mui/icons-material/MailOutlined';
import AppsIcon from '@mui/icons-material/Apps';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import ChartIcon from '@mui/icons-material/BarChart';
import CircleIcon from '@mui/icons-material/RadioButtonUnchecked';

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
    label: 'Quản trị phần mềm',
    icon: <SettingsIcon fontSize="small" />,
    roles: ['ROLE_SO', 'ROLE_DN'],
    children: [
      { id: 'permissions', label: 'Quản lý quyền hạn', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO'], path: '/permissions' },
      { id: 'roles', label: 'Quản lý vai trò', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO'], path: '/roles' },
      { id: 'account', label: 'Quản lý người dùng', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO'], path: '/users' },
      { id: 'company-mgmt', label: 'Quản lý doanh nghiệp', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO'], path: '/doets' },
      { id: 'my-company', label: 'Thông tin doanh nghiệp', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_DN'], path: '/enterprise-profile' },
      { id: 'report-period', label: 'Kỳ báo cáo', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO'], path: '/report-periods' },
      { id: 'loai-hinh-kinh-doanh', label: 'Loại hình kinh doanh', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO'], path: '/loai-hinh-kinh-doanh' },
      { id: 'nganh-nghe-kinh-doanh', label: 'Ngành nghề kinh doanh', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO'], path: '/nganh-nghe-kinh-doanh' },
    ]
  },
  {
    id: 'accident',
    label: 'Tai nạn lao động',
    icon: <SettingsIcon fontSize="small" />,
    roles: ['ROLE_SO', 'ROLE_DN'],
    children: [
      { id: 'common-list', label: 'Danh mục chung', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO'], path: '/common-categories' },
      { id: 'tnld-hdlh', label: 'TNLĐ theo HĐLĐ', icon: <FiberManualRecordIcon style={{ fontSize: 6 }} />, roles: ['ROLE_SO', 'ROLE_DN'], path: '/accident-reports' },
    ]

  },
];
