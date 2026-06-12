import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Typography, 
  Box,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material';
import { Visibility, VisibilityOff, Close, CheckCircleOutlined, ErrorOutlined } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';
import { VNA_COLORS } from '@core/theme';
import { authService } from '@tts/services/auth.services';
import { validate, VALIDATION_MESSAGES } from '@core/utils/validation';
import useLocales from '@core/hooks/useLocales';
import { useAuth } from '@core/contexts/AuthProvider';
import { RequiredLabel } from './RequiredLabel';
import { AppToast } from '@tts/components/AppToast';

const useStyles = makeStyles((theme: Theme) => ({
  dialogPaper: {
    borderRadius: 14,
    boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  dialogTitle: {
    backgroundColor: VNA_COLORS.primary,
    color: '#fff',
    padding: theme.spacing(2, 2),
    textAlign: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    position: 'relative',
    zIndex: 2,
    borderRadius: '14px 14px 0 0',
    '& h2': {
      fontSize: '1.2rem',
      fontWeight: 700,
      margin: 0,
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    }
  },
  content: {
    padding: theme.spacing(0, 4),
    marginTop: theme.spacing(4),
    position: 'relative',
    zIndex: 1,
    overflow: 'visible', // Ensure labels don't get clipped
  },
  field: {
    marginBottom: theme.spacing(3),
    '& .MuiOutlinedInput-root': {
      borderRadius: 8,
      backgroundColor: '#fff',
      '& fieldset': {
        borderColor: '#e0e0e0',
      },
      '&:hover fieldset': {
        borderColor: '#bdbdbd',
      },
      '&.Mui-focused fieldset': {
        borderColor: VNA_COLORS.primary,
      },
    },
    '& .MuiInputLabel-outlined': {
      fontSize: '0.85rem',
      transform: 'translate(14px, 12px) scale(1)',
      '&.MuiInputLabel-shrink': {
        transform: 'translate(14px, -6px) scale(0.75)',
      }
    },
    '& .MuiOutlinedInput-input': {
      paddingTop: '12.5px',
      paddingBottom: '12.5px',
      paddingLeft: '14px',
      fontSize: '0.85rem',
    }
  },
  actions: {
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 4, 4),
    gap: theme.spacing(2),
  },
  cancelBtn: {
    textTransform: 'none',
    color: '#666',
    fontSize: '0.95rem',
    fontWeight: 500,
    padding: theme.spacing(1, 4),
    borderRadius: 8,
    '&:hover': { 
      backgroundColor: '#f5f5f5',
      color: '#333'
    },
  },
  saveBtn: {
    backgroundColor: VNA_COLORS.primary,
    color: '#fff',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: theme.spacing(1, 6),
    borderRadius: 8,
    boxShadow: '0px 4px 10px rgba(47, 101, 240, 0.3)',
    '&:hover': { 
      backgroundColor: VNA_COLORS.primaryHover,
      boxShadow: '0px 6px 12px rgba(47, 101, 240, 0.4)',
    },
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: 'rgba(255, 69, 58, 0.05)',
    border: `1px solid ${VNA_COLORS.error}`,
    borderRadius: 4,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: 'rgba(52, 199, 89, 0.05)',
    border: `1px solid ${VNA_COLORS.success}`,
    borderRadius: 4,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  },
  errorText: {
    color: VNA_COLORS.error,
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  successText: {
    color: VNA_COLORS.success || '#4caf50',
    fontSize: '0.85rem',
    fontWeight: 500,
  }
}));

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose }) => {
  const classes = useStyles();
  const { translate } = useLocales();
  const { logout } = useAuth();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const getPasswordStrength = (password: string) => {
    if (!password) return { label: '', color: 'transparent', score: 0 };
    if (password.length < 6) return { label: 'Yếu (Ít nhất 6 kí tự)', color: '#f44336', score: 1 };
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (password.length >= 8 && hasLetter && hasNumber && hasSpecial) {
      return { label: 'Mạnh', color: '#4caf50', score: 3 };
    }
    if (hasLetter && hasNumber) {
      return { label: 'Trung bình', color: '#ff9800', score: 2 };
    }
    return { label: 'Yếu (Cần có cả chữ và số)', color: '#f44336', score: 1 };
  };

  const strength = getPasswordStrength(newPassword);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const handleSave = async () => {
    if (!validate.required(oldPassword) || !validate.required(newPassword) || !validate.required(confirmPassword)) {
      showNotification(VALIDATION_MESSAGES.FULL_INFO_REQUIRED, 'error');
      return;
    }
    
    if (!validate.minLength(newPassword, 6)) {
      showNotification(VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH(6), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification(VALIDATION_MESSAGES.PASSWORD_CONFIRM_NOT_MATCH, 'error');
      return;
    }

    if (oldPassword === newPassword) {
      showNotification('Mật khẩu mới không được trùng với mật khẩu cũ', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.changePassword(oldPassword, newPassword);
      if (res && (res as any).success) {
        showNotification((res as any).message || translate("notifications.passwordChangeSuccess"), 'success');
        setTimeout(() => {
          handleClose();
          logout();
        }, 1500);
      } else {
        let errorMsg = (res as any).errors || (res as any).message || translate("notifications.error");
        if (typeof errorMsg === 'object' && errorMsg !== null) {
          errorMsg = errorMsg.message || errorMsg.error || JSON.stringify(errorMsg);
        }
        if (Array.isArray(errorMsg)) errorMsg = errorMsg[0];
        showNotification(errorMsg as string, 'error');
      }
    } catch (err: any) {
      let msg = err.response?.data?.errors || err.response?.data?.message || err?.message || translate("notifications.error");
      if (typeof msg === 'object' && msg !== null) {
        msg = Array.isArray(msg.message) ? msg.message[0] : (msg.message || msg.error || JSON.stringify(msg));
      }
      if (Array.isArray(msg)) msg = msg[0];
      showNotification(msg as string, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setToast(prev => ({ ...prev, show: false }));
    onClose();
  };

  const handleInputFocus = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="xs" 
      fullWidth
      slotProps={{ paper: { className: classes.dialogPaper } }}
    >
      <AppToast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />
      <DialogTitle className={classes.dialogTitle}>
        Đổi mật khẩu
      </DialogTitle>
      <DialogContent className={classes.content}>
        <Box className={classes.field}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label={<RequiredLabel label="Mật khẩu cũ" />}
            type={showOld ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            onFocus={handleInputFocus}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowOld(!showOld)}>
                      {showOld ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        </Box>

        <Box className={classes.field}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label={<RequiredLabel label="Mật khẩu mới" />}
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={handleInputFocus}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowNew(!showNew)}>
                      {showNew ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
          {newPassword && (
            <Box sx={{ mt: 1, ml: 1 }}>
              <Typography style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 600 }}>
                Độ mạnh: {strength.label}
              </Typography>
            </Box>
          )}
        </Box>

        <Box className={classes.field}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label={<RequiredLabel label="Nhập lại mật khẩu mới" />}
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={handleInputFocus}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button onClick={handleClose} className={classes.cancelBtn}>Hủy bỏ</Button>
        <Button variant="contained" className={classes.saveBtn} onClick={handleSave} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</Button>
      </DialogActions>
    </Dialog>
  );
};