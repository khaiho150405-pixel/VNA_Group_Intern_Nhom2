import React, { useState } from 'react';
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
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Close } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';
import { VNA_COLORS } from '@core/theme';
import { authService } from '@tts/services/auth.services';
import { validate, VALIDATION_MESSAGES } from '@core/utils/validation';
import { RequiredLabel } from './RequiredLabel';

const useStyles = makeStyles((theme: Theme) => ({
  dialogPaper: {
    borderRadius: 14,
    boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  dialogTitle: {
    backgroundColor: VNA_COLORS.primary,
    color: '#fff',
    padding: theme.spacing(2),
    textAlign: 'center',
    '& h2': {
      fontSize: '1.1rem',
      fontWeight: 600,
      margin: 0,
      color: '#fff',
    }
  },
  content: {
    padding: theme.spacing(4, 4, 1),
  },
  field: {
    marginBottom: theme.spacing(3),
    '& .MuiOutlinedInput-root': {
      borderRadius: 4,
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
      paddingTop: '10.5px',
      paddingBottom: '10.5px',
      paddingLeft: '14px',
      fontSize: '0.85rem',
    }
  },
  actions: {
    justifyContent: 'center',
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
  }
}));

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose }) => {
  const classes = useStyles();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSave = async () => {
    if (!validate.required(oldPassword) || !validate.required(newPassword) || !validate.required(confirmPassword)) {
      alert(VALIDATION_MESSAGES.FULL_INFO_REQUIRED);
      return;
    }
    
    if (!validate.minLength(newPassword, 6)) {
      alert(VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH(6));
      return;
    }

    if (newPassword !== confirmPassword) {
      alert(VALIDATION_MESSAGES.PASSWORD_CONFIRM_NOT_MATCH);
      return;
    }

    try {
      setLoading(true);
      const res = await authService.changePassword(oldPassword, newPassword);
      if (res && (res as any).success) {
        alert((res as any).message || 'Đổi mật khẩu thành công');
        onClose();
      } else {
        alert((res as any).message || 'Đổi mật khẩu thất bại');
      }
    } catch (err: any) {
      alert(err?.message || 'Đổi mật khẩu lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      slotProps={{ paper: { className: classes.dialogPaper } }}
    >
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
        <Button onClick={onClose} className={classes.cancelBtn}>Hủy bỏ</Button>
        <Button variant="contained" className={classes.saveBtn} onClick={handleSave} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</Button>
      </DialogActions>
    </Dialog>
  );
};