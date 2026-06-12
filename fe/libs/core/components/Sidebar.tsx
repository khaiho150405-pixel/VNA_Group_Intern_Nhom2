"use client";
import React, { useState } from 'react';
import { 
  Box, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Collapse, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem,
  Divider,
  IconButton
} from '@mui/material';
import { 
  ExpandLess, 
  ExpandMore,
  Menu as MenuIcon,
  AccountCircle as AccountIcon,
  Lock as LockIcon,
  ExitToApp as LogoutIcon,
  ChevronRight
} from '@mui/icons-material';
import { VNA_COLORS } from '@core/theme';
import { useAuth } from '@core/contexts/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { NAVIGATION_ITEMS, NavItem } from '../constants/navigation';
import { ChangePasswordModal } from './ChangePasswordModal';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const rawRole = user
    ? ((user as any).realRole || (typeof user.role === 'object' && user.role !== null ? (user.role as any).role : user.role))
    : undefined;

  let userRole = rawRole;
  if (rawRole === 'Admin' || rawRole === 'ROLE_ADMIN') {
    userRole = 'ROLE_SO';
  } else if (rawRole === 'User' || rawRole === 'ROLE_USER') {
    userRole = 'ROLE_DN';
  }

  // Filter items based on user role
  const filteredItems = NAVIGATION_ITEMS.filter(item => 
    item.roles.includes(userRole as any)
  );

  const handleToggle = (id: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenItems([id]);
      return;
    }
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNavigate = (path?: string) => {
    if (path) router.push(path);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setOpenItems([]); // Close all menus when collapsing
    }
  };

  const renderItem = (item: NavItem, isNested = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems.includes(item.id);
    const isActive = pathname === item.path;

    return (
      <React.Fragment key={item.id}>
        <ListItemButton 
          sx={{
            padding: (theme) => theme.spacing(1, 2),
            margin: (theme) => theme.spacing(0.2, 0),
            whiteSpace: 'nowrap',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.08)',
            },
            ...(isActive && {
              backgroundColor: 'rgba(255,255,255,0.12)',
            }),
            ...(isNested && {
              paddingLeft: (theme) => theme.spacing(4),
            }),
            justifyContent: isCollapsed ? 'center' : 'flex-start', 
            paddingLeft: isCollapsed ? 0 : (isNested ? 4 : 2), 
            paddingRight: isCollapsed ? 0 : 2
          }}
          onClick={() => hasChildren ? handleToggle(item.id) : handleNavigate(item.path)}
          title={isCollapsed ? item.label : ''}
        >
          <ListItemIcon 
            sx={{
              color: 'rgba(255,255,255,0.9)',
              minWidth: isCollapsed ? 0 : 36,
              justifyContent: 'center',
              '& svg': {
                fontSize: '1.2rem',
              }
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.label} 
            sx={{ 
              transition: (theme) => theme.transitions.create('opacity'),
              '& span': {
                fontSize: '0.82rem',
                fontWeight: 400,
              },
              opacity: isCollapsed ? 0 : 1, 
              width: isCollapsed ? 0 : 'auto',
              display: isCollapsed ? 'none' : 'block'
            }} 
          />
          {!isCollapsed && hasChildren ? (isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />) : null}
        </ListItemButton>
        
        {!isCollapsed && hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderItem(child, true))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box 
      sx={{
        height: '100vh',
        backgroundColor: '#1a337e',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        transition: (theme) => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.standard,
        }),
        width: isCollapsed ? 70 : 280
      }}
    >
      <Box 
        sx={{
          padding: (theme) => theme.spacing(2, 2),
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          minHeight: 64,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          justifyContent: isCollapsed ? 'center' : 'flex-start', 
          padding: isCollapsed ? 0 : '16px'
        }}
      >
        {!isCollapsed && (
          <>
            <Box
              component="img"
              src="/static/mock-images/logo.png" 
              alt="Logo" 
              sx={{
                height: 32,
                marginRight: (theme) => theme.spacing(1.5),
                transition: (theme) => theme.transitions.create('opacity'),
              }}
            />
            <Typography 
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                lineHeight: 1.3,
                flex: 1,
                transition: (theme) => theme.transitions.create('opacity'),
              }}
            >
              Hệ thống quản lý
            </Typography>
          </>
        )}
        <IconButton 
          size="small" 
          sx={{ 
            color: '#fff',
            padding: isCollapsed ? '16px 0' : '8px'
          }} 
          onClick={toggleSidebar}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      </Box>

      <List 
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: (theme) => theme.spacing(1),
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
          },
        }}
      >
        {filteredItems.map(item => renderItem(item))}
      </List>

      <Box 
        sx={{
          padding: (theme) => theme.spacing(1.5, 2),
          borderTop: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.05)',
          },
          justifyContent: isCollapsed ? 'center' : 'flex-start', 
          paddingLeft: isCollapsed ? 0 : 2, 
          paddingRight: isCollapsed ? 0 : 2
        }}
        onClick={(e) => setAnchorEl(e.currentTarget)} 
      >
        <Avatar src={user?.avatar || '/static/mock-images/logo.png'} sx={{ width: 32, height: 32, border: '1px solid rgba(255,255,255,0.2)' }} />
        <Box 
          sx={{ 
            flex: 1,
            marginLeft: (theme) => theme.spacing(1.2),
            transition: (theme) => theme.transitions.create('opacity'),
            '& p': {
              fontSize: '0.85rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
            opacity: isCollapsed ? 0 : 1, 
            width: isCollapsed ? 0 : 'auto', 
            display: isCollapsed ? 'none' : 'block' 
          }}
        >
          <Typography>{user?.fullName || user?.displayName || 'Người dùng'}</Typography>
        </Box>
        {!isCollapsed && <ChevronRight fontSize="small" sx={{ opacity: 0.7 }} />}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        sx={{
          '& .MuiPaper-root': {
            width: 200,
            borderRadius: 2,
            boxShadow: '0px 4px 20px rgba(0,0,0,0.15)',
            marginTop: (theme) => theme.spacing(-1),
          },
          '& .MuiList-root': {
            padding: (theme) => theme.spacing(1, 0),
          }
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MenuItem 
          onClick={() => { setAnchorEl(null); router.push('/account'); }} 
          sx={{
            fontSize: '0.8rem',
            fontWeight: 500,
            padding: (theme) => theme.spacing(1, 2),
            '&:hover': {
              backgroundColor: '#f5f7ff',
            }
          }}
        >
          <ListItemIcon 
            sx={{
              minWidth: 32,
              color: '#666',
              '& svg': {
                fontSize: '1.1rem',
              }
            }}
          >
            <AccountIcon />
          </ListItemIcon>
          Thông tin tài khoản
        </MenuItem>
        <MenuItem 
          onClick={() => { setAnchorEl(null); setShowPassModal(true); }} 
          sx={{
            fontSize: '0.8rem',
            fontWeight: 500,
            padding: (theme) => theme.spacing(1, 2),
            '&:hover': {
              backgroundColor: '#f5f7ff',
            }
          }}
        >
          <ListItemIcon 
            sx={{
              minWidth: 32,
              color: '#666',
              '& svg': {
                fontSize: '1.1rem',
              }
            }}
          >
            <LockIcon />
          </ListItemIcon>
          Đổi mật khẩu
        </MenuItem>
        <Divider sx={{ margin: '4px 0' }} />
        <MenuItem 
          onClick={() => logout()} 
          sx={{ 
            color: VNA_COLORS.error,
            fontSize: '0.8rem',
            fontWeight: 500,
            padding: (theme) => theme.spacing(1, 2),
            '&:hover': {
              backgroundColor: '#f5f7ff',
            }
          }}
        >
          <ListItemIcon 
            sx={{ 
              minWidth: 32,
              color: VNA_COLORS.error,
              '& svg': {
                fontSize: '1.1rem',
              }
            }}
          >
            <LogoutIcon style={{ color: VNA_COLORS.error }} />
          </ListItemIcon>
          Đăng xuất
        </MenuItem>
      </Menu>

      <ChangePasswordModal open={showPassModal} onClose={() => setShowPassModal(false)} />
    </Box>
  );
};
