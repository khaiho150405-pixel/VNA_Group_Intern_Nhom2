import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Typography, 
  Box,
  CircularProgress
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';
import { VNA_COLORS } from '@core/theme';
import { useAuth } from '@core/contexts/AuthProvider';
import { authService } from '@tts/services/auth.services';
import { getCookie } from '@core/services/cookies';
import { validate, VALIDATION_MESSAGES } from '@core/utils/validation';
import { RequiredLabel } from './RequiredLabel';

const useStyles = makeStyles((theme: Theme) => ({
  content: {
    padding: theme.spacing(4, 4, 2),
    textAlign: 'center',
  },
  title: {
    color: VNA_COLORS.primary,
    fontWeight: 700,
    fontSize: '1rem',
    marginBottom: theme.spacing(3),
    textTransform: 'uppercase',
  },
  message: {
    fontSize: '0.85rem',
    color: VNA_COLORS.gray,
    marginBottom: theme.spacing(3),
    lineHeight: 1.6,
  },
  field: {
    marginBottom: theme.spacing(2),
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
      textAlign: 'left',
    }
  },
  countdown: {
    color: VNA_COLORS.primary,
    fontWeight: 700,
    fontSize: '0.9rem',
    marginBottom: theme.spacing(1),
  },
  resendBtn: {
    color: VNA_COLORS.primary,
    textTransform: 'none',
    fontSize: '0.85rem',
    padding: 0,
    marginBottom: theme.spacing(3),
    '&:disabled': { color: '#ccc' },
    '&:hover': { backgroundColor: 'transparent', color: VNA_COLORS.primaryHover }
  },
  actions: {
    flexDirection: 'column',
    padding: theme.spacing(0, 4, 4),
  },
  confirmBtn: {
    backgroundColor: VNA_COLORS.primary,
    color: '#fff',
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(1, 0),
    width: '100%',
    marginBottom: theme.spacing(2),
    borderRadius: 8,
    '&:hover': { backgroundColor: VNA_COLORS.primaryHover },
  },
  cancelBtn: {
    textTransform: 'none',
    color: VNA_COLORS.gray,
    padding: 0,
    borderRadius: 8,
    '&:hover': { backgroundColor: '#f5f5f7', color: '#333' }
  },
  errorText: {
    color: VNA_COLORS.error,
    fontSize: '0.8rem',
    marginBottom: theme.spacing(2),
    textAlign: 'left',
  },
  successText: {
    color: VNA_COLORS.success || '#4caf50',
    fontSize: '0.8rem',
    marginBottom: theme.spacing(2),
    textAlign: 'left',
  }
}));

interface ChangeEmailModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({ open, onClose }) => {
  const classes = useStyles();
  const { user, login } = useAuth();
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(60);
  const [otp, setOtp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Send OTP automatically when modal is opened in step 1
  useEffect(() => {
    if (open && step === 1 && user?.email) {
      setErrorMsg(null);
      setSuccessMsg('Đang gửi mã OTP...');
      authService.sendOtp(user.email)
        .then(() => {
          setSuccessMsg('Mã OTP đã được gửi đến email của bạn.');
        })
        .catch((err: any) => {
          setSuccessMsg(null);
          const msg = err.response?.data?.errors || err.response?.data?.message || err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.';
          setErrorMsg(msg);
        });
    }
  }, [open, step, user?.email]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (open && step === 1 && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [open, step, countdown]);

  const handleResendOtp = async () => {
    if (!user?.email) return;
    try {
      setErrorMsg(null);
      setSuccessMsg('Đang gửi lại mã OTP...');
      setCountdown(60);
      await authService.sendOtp(user.email);
      setSuccessMsg('Mã OTP đã được gửi lại thành công.');
    } catch (err: any) {
      setSuccessMsg(null);
      const msg = err.response?.data?.errors || err.response?.data?.message || err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.';
      setErrorMsg(msg);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validate.required(otp)) {
      setErrorMsg(VALIDATION_MESSAGES.REQUIRED);
      return;
    }
    if (!validate.otp(otp)) {
      setErrorMsg(VALIDATION_MESSAGES.OTP_INVALID);
      return;
    }
    if (!user?.email) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await authService.verifyOtp(user.email, otp);
      if (response && response.success) {
        setStep(2);
      } else {
        const errorMsg = 'Mã OTP không chính xác';
        setErrorMsg(errorMsg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.errors || err.response?.data?.message || err.message || 'Mã OTP không chính xác';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!validate.required(newEmail)) {
      setErrorMsg('Vui lòng nhập email mới');
      return;
    }
    if (!validate.email(newEmail)) {
      setErrorMsg(VALIDATION_MESSAGES.EMAIL_INVALID);
      return;
    }
    if (!user?.id) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Check if email already exists
      const checkRes = await authService.checkEmail(newEmail, user.id);
      if (checkRes && checkRes.existed) {
        setErrorMsg('Email này đã được sử dụng bởi một tài khoản khác');
        setLoading(false);
        return;
      }

      // 2. call put users/:id to update email
      await authService.updateProfile(user.id, { email: newEmail });
      
      // Update local storage and authentication context user info
      const token = getCookie('accessToken') || '';
      login({ ...user, email: newEmail }, token);
      
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.errors || err.response?.data?.message || err.message || 'Không thể cập nhật email. Vui lòng thử lại.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setStep(1);
    setCountdown(60);
    setOtp('');
    setNewEmail('');
    setErrorMsg(null);
    setSuccessMsg(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogContent className={classes.content}>
        <Typography className={classes.title}>Thay đổi email</Typography>
        
        {step === 1 ? (
          <>
            <Typography className={classes.message}>
              Chúng tôi đã gửi mã xác minh qua email cá nhân<br/>
              <strong>{user?.email || ''}</strong><br/>
              Bạn vui lòng kiểm tra và điền mã xác thực
            </Typography>
            
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label={<RequiredLabel label="Mã OTP" />}
              className={classes.field}
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
            />

            {errorMsg && <Typography className={classes.errorText}>{errorMsg}</Typography>}
            {successMsg && <Typography className={classes.successText}>{successMsg}</Typography>}
            
            <Box>
              <Typography className={classes.countdown}>
                00:{countdown < 10 ? `0${countdown}` : countdown}
              </Typography>
              <Button 
                disabled={countdown > 0 || loading} 
                className={classes.resendBtn}
                onClick={handleResendOtp}
                disableRipple
              >
                Chưa nhận được mã? Gửi lại
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Typography className={classes.message}>
              Vui lòng nhập email mới
            </Typography>
            
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label={<RequiredLabel label="Email mới" />}
              className={classes.field}
              placeholder="Nhập email mới"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={loading}
            />

            {errorMsg && <Typography className={classes.errorText}>{errorMsg}</Typography>}
          </>
        )}
      </DialogContent>
      
      <DialogActions className={classes.actions}>
        <Button 
          variant="contained" 
          className={classes.confirmBtn}
          onClick={step === 1 ? handleVerifyOtp : handleUpdateEmail}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} style={{ color: '#fff' }} /> : (step === 1 ? 'Xác nhận' : 'Lưu')}
        </Button>
        <Button onClick={handleClose} className={classes.cancelBtn} disabled={loading} disableRipple>Hủy bỏ</Button>
      </DialogActions>
    </Dialog>
  );
};