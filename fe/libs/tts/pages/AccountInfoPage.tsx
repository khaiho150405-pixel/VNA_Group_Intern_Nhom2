"use client";
import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  Switch, 
  MenuItem,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { PhotoCamera, Save, Event } from '@material-ui/icons';
import { ChangeEmailModal } from '@core/components/ChangeEmailModal';
import { AppToast } from '@tts/components/AppToast';
import { useAccountInfoStyles } from '../logic/account-info/style';
import { useAccountInfo } from '@tts/hooks/useAccountInfo';

export const AccountInfoPage = () => {
  const classes = useAccountInfoStyles();
  const { 
    state, 
    dispatch, 
    handleInputChange, 
    handleSave 
  } = useAccountInfo();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    active,
    showEmailModal,
    username,
    displayName,
    birthday,
    gender,
    title,
    role,
    email,
    city,
    district,
    address,
    avatarUrl,
    loading,
    toast
  } = state;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        dispatch({ 
          type: 'showToast', 
          message: 'Kích thước ảnh tối đa là 5MB', 
          toastType: 'error' 
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch({ type: 'onChange', name: 'avatarUrl', value: reader.result as string });
        dispatch({ type: 'onChange', name: 'avatarFile', value: file });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box className={classes.root}>
      <AppToast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => dispatch({ type: 'hideToast' })} 
      />

      {/* Top Grey Bar */}
      <Box className={classes.topTitleBar}>
        Thông tin tài khoản
      </Box>

      {/* Page Header */}
      <Box className={classes.pageHeader}>
        <Typography className={classes.headerTitle}>Chi tiết người dùng</Typography>
        <Box className={classes.actions}>
          <Button className={classes.cancelBtn} disableRipple disabled={loading}>Hủy bỏ</Button>
          <Button 
            variant="contained" 
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save fontSize="small" />} 
            className={classes.saveBtn}
            disableElevation
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box className={classes.mainContent}>
        <Grid container spacing={3}>
          {/* Left Column: Avatar & Activation */}
          <Grid item xs={12} md={3}>
            <Box className={classes.leftCard}>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
              />
              <Box className={classes.avatarCircle} onClick={handleAvatarClick} style={{ 
                backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {!avatarUrl && (
                  <>
                    <PhotoCamera className={classes.avatarIcon} />
                    <Typography className={classes.avatarText}>Tải ảnh đại diện</Typography>
                  </>
                )}
                {avatarUrl && (
                  <Box style={{ 
                    position: 'absolute', 
                    top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundColor: 'rgba(0,0,0,0.3)', 
                    display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                    color: '#fff'
                  }} className="avatar-hover">
                    <PhotoCamera />
                  </Box>
                )}
              </Box>
              <Typography className={classes.avatarNote}>
                *.jpeg, *.jpg, *.png.<br/>
                Kích thước tối đa 5 MB
              </Typography>
              
              <Box className={classes.activation}>
                <Typography style={{ fontWeight: 600, fontSize: '0.85rem', color: '#333' }}>Kích hoạt</Typography>
                <Switch 
                  checked={active} 
                  onChange={() => dispatch({ type: 'toggleActive' })} 
                  color="primary" 
                  size="small"
                  disabled={loading}
                />
              </Box>
            </Box>
          </Grid>

          {/* Right Column: Forms */}
          <Grid item xs={12} md={9}>
            <Box className={classes.rightCard}>
              {/* Personal Information Section */}
              <Typography className={classes.sectionTitle}>Thông tin cá nhân</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth label="Tên đăng nhập (*)" variant="outlined" size="small" 
                    className={classes.field} value={username} 
                    disabled InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth label="Họ và tên (*)" variant="outlined" size="small" 
                    className={classes.field} value={displayName} 
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth label="Ngày tháng năm sinh" variant="outlined" size="small" 
                    className={classes.field} value={birthday}
                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Event fontSize="small" style={{ color: '#999' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    select fullWidth label="Giới tính" variant="outlined" size="small" 
                    className={classes.field} value={gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  >
                    <MenuItem value="Nam">Nam</MenuItem>
                    <MenuItem value="Nữ">Nữ</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth label="Chức danh" variant="outlined" size="small" 
                    className={classes.field} placeholder="Nhập chức danh" 
                    value={title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    select fullWidth label="Vai trò (*)" variant="outlined" size="small" 
                    className={classes.field} value={role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  >
                    <MenuItem value="Admin">Quản trị viên</MenuItem>
                    <MenuItem value="User">Người dùng</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth 
                    label="Email" 
                    variant="outlined" 
                    size="small" 
                    className={classes.field}
                    value={email} 
                    disabled 
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6} style={{ display: 'flex', alignItems: 'center' }}>
                  <Button 
                    className={classes.changeLink} 
                    onClick={() => dispatch({ type: 'toggleEmailModal', value: true })}
                    disableRipple
                    disabled={loading}
                    style={{ marginBottom: '20px', marginLeft: 0 }}
                  >
                    Thay đổi
                  </Button>
                </Grid>
              </Grid>

              {/* Contact Information Section */}
              <Typography className={classes.sectionTitle} style={{ marginTop: '24px' }}>Thông tin liên hệ</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField 
                    select fullWidth label="Tỉnh / Thành phố" variant="outlined" size="small" 
                    className={classes.field} value={city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  >
                    <MenuItem value="HCM">Thành phố Hồ Chí Minh</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    select fullWidth label="Quận / Huyện" variant="outlined" size="small" 
                    className={classes.field} value={district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  >
                    <MenuItem value="GV">Phường Gò Vấp</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth label="Địa chỉ" variant="outlined" size="small" 
                    className={classes.field} placeholder="Nhập địa chỉ" 
                    value={address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <ChangeEmailModal open={showEmailModal} onClose={() => dispatch({ type: 'toggleEmailModal', value: false })} />
    </Box>
  );
};
