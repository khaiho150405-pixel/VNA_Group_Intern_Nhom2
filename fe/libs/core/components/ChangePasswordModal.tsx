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
import { Visibility, VisibilityOff, Close } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { Theme } from '@mui/material/styles';
import { VNA_COLORS } from '@core/theme';
import { authService } from '@tts/services/auth.services';

const useStyles = makeStyles((theme: Theme) => ({
  dialogTitle: {
    backgroundColor: VNA_COLORS.primary,
    color: '#fff',
    padding: theme.spacing(1, 2),
    '& h2': {
      fontSize: '1rem',
      fontWeight: 600,
      textAlign: 'center',
    }
  },
  content: {
    padding: theme.spacing(3, 3, 2),
  },
  field: {
    marginBottom: theme.spacing(2),
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
    display: 'block',
  },
  actions: {
    justifyContent: 'center',
    paddingBottom: theme.spacing(2),
  },
  cancelBtn: {
    textTransform: 'none',
    color: VNA_COLORS.gray,
    marginRight: theme.spacing(2),
  },
  saveBtn: {
    backgroundColor: VNA_COLORS.primary,
    color: '#fff',
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(0.5, 4),
    '&:hover': { backgroundColor: VNA_COLORS.primaryHover },
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
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (strength.score < 2) {
      alert('Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu từ mức Trung bình trở lên.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới không khớp');
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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        Đổi mật khẩu
      </DialogTitle>
      <DialogContent className={classes.content}>
        <Typography className={classes.label}>Mật khẩu cũ (*)</Typography>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          type={showOld ? 'text' : 'password'}
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className={classes.field}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowOld(!showOld)}>
                  {showOld ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Typography className={classes.label}>Mật khẩu mới (*)</Typography>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          type={showNew ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={newPassword ? '' : classes.field}
          style={{ marginBottom: newPassword ? 4 : undefined }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        {newPassword && (
          <Typography style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 600, marginBottom: 16 }}>
            Độ mạnh: {strength.label}
          </Typography>
        )}

        <Typography className={classes.label}>Nhập lại mật khẩu mới (*)</Typography>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={classes.field}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button onClick={onClose} className={classes.cancelBtn}>Hủy bỏ</Button>
        <Button variant="contained" className={classes.saveBtn} onClick={handleSave} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</Button>
      </DialogActions>
    </Dialog>
  );
};
