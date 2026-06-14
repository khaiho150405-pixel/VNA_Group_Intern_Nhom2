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

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showPassModal, setShowPassModal] = useState(false);

  const roleObj = user && typeof (user as any).role === 'object' && (user as any).role !== null ? (user as any).role : null;
  const userRoleId = user ? ((user as any).roleId || roleObj?.id) : undefined;
  const rawRole = user
    ? ((user as any).realRole || roleObj?.role || (typeof user.role === 'string' ? user.role : ''))
    : undefined;

  let userRole = rawRole;
  if (
    userRoleId === 4 || 
    userRoleId === 3 || 
    userRoleId === 2 || 
    rawRole === 'Admin' || 
    rawRole === 'ROLE_ADMIN' || 
    rawRole === 'superAdmin' || 
    rawRole === 'leader' || 
    rawRole === 'expert' || 
    rawRole === 'ROLE_SO'
  ) {
    userRole = 'ROLE_SO';
  } else if (
    userRoleId === 1 || 
    rawRole === 'User' || 
    rawRole === 'ROLE_USER' || 
    rawRole === 'employee' || 
    rawRole === 'ROLE_DN'
  ) {
    userRole = 'ROLE_DN';
  }

  // Filter items based on user role
  const filteredItems = NAVIGATION_ITEMS.filter(item => 
    item.roles.includes(userRole as any)
  );

  const handleToggle = (id: string) => {
    if (isCollapsed) {
      onToggle();
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

  const renderItem = (item: NavItem, isNested = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems.includes(item.id);
    const isActive = pathname === item.path;

    return (
      <React.Fragment key={item.id}>
        <ListItemButton 
          sx={{
            padding: (theme) => theme.spacing(1.2, 2.5),
            margin: (theme) => theme.spacing(0.2, 0),
            whiteSpace: 'nowrap',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.08)',
            },
            ...(isActive && {
              backgroundColor: 'rgba(255,255,255,0.12)',
            }),
            justifyContent: isCollapsed ? 'center' : 'flex-start', 
            paddingLeft: isCollapsed ? 0 : (isNested ? 5 : 2.5),
            paddingRight: isCollapsed ? 0 : 2.5
          }}
          onClick={() => hasChildren ? handleToggle(item.id) : handleNavigate(item.path)}
          title={isCollapsed ? item.label : ''}
        >
          <ListItemIcon 
            sx={{
              color: 'rgba(255,255,255,0.9)',
              minWidth: isCollapsed ? 40 : 36,
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
              '& span': {
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.9)',
              },
              opacity: isCollapsed ? 0 : 1, 
              width: isCollapsed ? 0 : 'auto',
              display: isCollapsed ? 'none' : 'block'
            }} 
          />
          {!isCollapsed && hasChildren ? (isOpen ? <ExpandMore fontSize="small" sx={{ opacity: 0.8 }} /> : <ExpandMore fontSize="small" sx={{ opacity: 0.8, transform: 'rotate(-90deg)' }} />) : null}
        </ListItemButton>
        
        {!isCollapsed && hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => (
                <ListItemButton
                  key={child.id}
                  sx={{
                    paddingLeft: (theme) => theme.spacing(5),
                    paddingTop: (theme) => theme.spacing(1),
                    paddingBottom: (theme) => theme.spacing(1),
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    },
                    ...(pathname === child.path && {
                      backgroundColor: 'rgba(255,255,255,0.12)',
                    }),
                  }}
                  onClick={() => handleNavigate(child.path)}
                >
                  <ListItemIcon sx={{ minWidth: 28, color: 'rgba(255,255,255,0.7)' }}>
                    {child.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={child.label}
                    sx={{
                      '& span': {
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.8)',
                      }
                    }}
                  />
                </ListItemButton>
              ))}
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
        backgroundColor: '#1b378b',
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
          display: 'flex',
          alignItems: 'center',
          padding: isCollapsed ? '16px 0' : '16px 6px',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          minHeight: 80,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
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
                width: 32,
                marginRight: 0.5,
                flexShrink: 0
              }}
            />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mr: 0.5, overflow: 'hidden' }}>
              <Typography 
                sx={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: '#fff',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                Ủy ban nhân dân thành phố
              </Typography>
              <Typography 
                sx={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: '#fff',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                Hồ Chí Minh
              </Typography>
            </Box>
          </>
        )}
        <IconButton size="small" sx={{ color: '#fff', flexShrink: 0 }} onClick={() => onToggle()}>
          <MenuIcon />
        </IconButton>
      </Box>

      <List 
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: (theme) => theme.spacing(2),
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
          padding: (theme) => theme.spacing(1.5, 2.5),
          borderTop: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.05)',
          },
          margin: isCollapsed ? '0 5px 10px' : '0 10px 10px',
          borderRadius: 1,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          paddingLeft: isCollapsed ? 0 : 2.5,
          paddingRight: isCollapsed ? 0 : 2.5
        }}
        onClick={(e) => setAnchorEl(e.currentTarget)} 
      >
        <Avatar 
          src={user?.avatar} 
          sx={{ 
            width: 36, 
            height: 36, 
            border: '1px solid rgba(255,255,255,0.3)' 
          }} 
        />
        {!isCollapsed && (
          <Box 
            sx={{ 
              flex: 1,
              marginLeft: (theme) => theme.spacing(1.5),
            }}
          >
            <Typography 
              sx={{ 
                fontSize: '0.9rem', 
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.fullName || user?.displayName || 'Người dùng'}
            </Typography>
          </Box>
        )}
        {!isCollapsed && <ExpandMore fontSize="small" sx={{ opacity: 0.7, transform: 'rotate(-90deg)' }} />}
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
