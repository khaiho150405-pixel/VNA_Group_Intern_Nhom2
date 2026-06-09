import React from 'react';
import { 
  Home as HomeIcon, 
  Settings as SettingsIcon, 
  HelpOutline as HelpIcon,
  MailOutline as MailIcon,
  Apps as AppsIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  SupervisorAccount as SupervisorAccountIcon,
  BarChart as ChartIcon,
  RadioButtonUnchecked as CircleIcon
} from '@material-ui/icons';

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
    id: 'help', 
    label: 'Hướng dẫn sử dụng', 
    icon: <HelpIcon fontSize="small" />,
    roles: ['superAdmin', 'ROLE_DN'] 
  },
  { 
    id: 'home', 
    label: 'Trang chủ', 
    icon: <HomeIcon fontSize="small" />, 
    path: '/',
    roles: ['ROLE_SO', 'ROLE_DN'] 
  },
  { 
    id: 'system', 
    label: 'Chức năng hệ thống', 
    icon: <SettingsIcon fontSize="small" />,
    roles: ['ROLE_SO', 'ROLE_DN'],
    children: [
      { id: 'user-mgmt', label: 'Quản lý người dùng', icon: <CircleIcon style={{ fontSize: 12 }} />, roles: ['ROLE_SO'] },
      { id: 'role-mgmt', label: 'Vai trò người dùng', icon: <CircleIcon style={{ fontSize: 12 }} />, roles: ['ROLE_SO'] },
      { 
        id: 'inbox', 
        label: 'Tiếp nhận', 
        icon: <CircleIcon style={{ fontSize: 12 }} />,
        roles: ['ROLE_SO', 'ROLE_DN'] 
      },
    ]
  },
  { 
    id: 'software', 
    label: 'Quản lý phần mềm', 
    icon: <AppsIcon fontSize="small" />,
    roles: ['ROLE_SO'],
    children: []
  },
  { 
    id: 'teacher', 
    label: 'Chuẩn nghề nghiệp giáo viên', 
    icon: <PeopleIcon fontSize="small" />, 
    roles: ['ROLE_SO'],
    children: [] 
  },
  { 
    id: 'manager', 
    label: 'Chuẩn nghề nghiệp HT - HP', 
    icon: <SupervisorAccountIcon fontSize="small" />, 
    roles: ['ROLE_SO'],
    children: [] 
  },
  { 
    id: 'report', 
    label: 'Báo cáo thống kê', 
    icon: <ChartIcon fontSize="small" />,
    roles: ['ROLE_SO', 'ROLE_DN'] 
  },
];
