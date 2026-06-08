"use client";
import React, { useState } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
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
import { makeStyles } from '@material-ui/styles';
import { Theme } from '@mui/material/styles';
import { 
  ExpandLess, 
  ExpandMore,
  Menu as MenuIcon,
  AccountCircle as AccountIcon,
  Lock as LockIcon,
  ExitToApp as LogoutIcon,
  ChevronRight
} from '@material-ui/icons';
import { VNA_COLORS } from '@core/theme';
import { useAuth } from '@core/contexts/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { NAVIGATION_ITEMS, NavItem } from '../constants/navigation';
import { ChangePasswordModal } from './ChangePasswordModal';

const useStyles = makeStyles((theme: Theme) => ({
  drawer: {
    height: '100vh',
    backgroundColor: '#1a337e',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.standard,
    }),
  },
  header: {
    padding: theme.spacing(2, 2),
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    minHeight: 64,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  logo: {
    height: 32,
    marginRight: theme.spacing(1.5),
    transition: theme.transitions.create('opacity'),
  },
  headerText: {
    fontSize: '0.85rem',
    fontWeight: 600,
    lineHeight: 1.3,
    flex: 1,
    transition: theme.transitions.create('opacity'),
  },
  menuList: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingTop: theme.spacing(1),
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '4px',
    },
  },
  listItem: {
    padding: theme.spacing(1, 2),
    margin: theme.spacing(0.2, 0),
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
  },
  activeItem: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  listIcon: {
    color: 'rgba(255,255,255,0.9)',
    minWidth: 36,
    '& svg': {
      fontSize: '1.2rem',
    }
  },
  listText: {
    transition: theme.transitions.create('opacity'),
    '& span': {
      fontSize: '0.82rem',
      fontWeight: 400,
    },
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
  userSection: {
    padding: theme.spacing(1.5, 2),
    borderTop: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
  },
  userName: {
    flex: 1,
    marginLeft: theme.spacing(1.2),
    transition: theme.transitions.create('opacity'),
    '& p': {
      fontSize: '0.85rem',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
  popupMenu: {
    '& .MuiPaper-root': {
      width: 200,
      borderRadius: 8,
      boxShadow: '0px 4px 20px rgba(0,0,0,0.15)',
      marginTop: theme.spacing(-1),
    },
    '& .MuiList-root': {
      padding: theme.spacing(1, 0),
    }
  },
  popupItem: {
    fontSize: '0.8rem',
    fontWeight: 500,
    padding: theme.spacing(1, 2),
    '&:hover': {
      backgroundColor: '#f5f7ff',
    }
  },
  popupIcon: {
    minWidth: 32,
    color: '#666',
    '& svg': {
      fontSize: '1.1rem',
    }
  }
}));

export const Sidebar = () => {
  const classes = useStyles();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter items based on user role
  const filteredItems = NAVIGATION_ITEMS.filter(item => 
    !user || item.roles.includes(user.role)
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
        <ListItem 
          button 
          className={`${classes.listItem} ${isNested ? classes.nested : ''} ${isActive ? classes.activeItem : ''}`}
          onClick={() => hasChildren ? handleToggle(item.id) : handleNavigate(item.path)}
          title={isCollapsed ? item.label : ''}
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', paddingLeft: isCollapsed ? 0 : 16, paddingRight: isCollapsed ? 0 : 16 }}
        >
          <ListItemIcon className={classes.listIcon} style={{ minWidth: isCollapsed ? 0 : 36, justifyContent: 'center' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.label} 
            className={classes.listText} 
            style={{ 
              opacity: isCollapsed ? 0 : 1, 
              width: isCollapsed ? 0 : 'auto',
              display: isCollapsed ? 'none' : 'block'
            }} 
          />
          {!isCollapsed && hasChildren ? (isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />) : null}
        </ListItem>
        
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
    <Box className={classes.drawer} style={{ width: isCollapsed ? 70 : 280 }}>
      <Box className={classes.header} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? 0 : '16px' }}>
        {!isCollapsed && (
          <>
            <img 
              src="/static/mock-images/logo.png" 
              alt="Logo" 
              className={classes.logo} 
            />
            <Typography className={classes.headerText}>
              Uỷ ban nhân dân tỉnh ABC
            </Typography>
          </>
        )}
        <IconButton 
          size="small" 
          style={{ 
            color: '#fff',
            padding: isCollapsed ? '16px 0' : '8px'
          }} 
          onClick={toggleSidebar}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      </Box>

      <List className={classes.menuList}>
        {filteredItems.map(item => renderItem(item))}
      </List>

      <Box className={classes.userSection} onClick={(e) => setAnchorEl(e.currentTarget)} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', paddingLeft: isCollapsed ? 0 : 16, paddingRight: isCollapsed ? 0 : 16 }}>
        <Avatar src={user?.avatar || '/static/mock-images/logo.png'} style={{ width: 32, height: 32, border: '1px solid rgba(255,255,255,0.2)' }} />
        <Box className={classes.userName} style={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto', display: isCollapsed ? 'none' : 'block' }}>
          <Typography>{user?.fullName || user?.displayName || 'Phan Thanh Tùng'}</Typography>
        </Box>
        {!isCollapsed && <ChevronRight fontSize="small" style={{ opacity: 0.7 }} />}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        className={classes.popupMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MenuItem onClick={() => { setAnchorEl(null); router.push('/account'); }} className={classes.popupItem}>
          <ListItemIcon className={classes.popupIcon}><AccountIcon /></ListItemIcon>
          Thông tin tài khoản
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); setShowPassModal(true); }} className={classes.popupItem}>
          <ListItemIcon className={classes.popupIcon}><LockIcon /></ListItemIcon>
          Đổi mật khẩu
        </MenuItem>
        <Divider style={{ margin: '4px 0' }} />
        <MenuItem onClick={() => logout()} className={classes.popupItem} style={{ color: VNA_COLORS.error }}>
          <ListItemIcon className={classes.popupIcon}><LogoutIcon style={{ color: VNA_COLORS.error }} /></ListItemIcon>
          Đăng xuất
        </MenuItem>
      </Menu>

      <ChangePasswordModal open={showPassModal} onClose={() => setShowPassModal(false)} />
    </Box>
  );
};
