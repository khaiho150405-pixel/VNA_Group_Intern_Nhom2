import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Typography, 
  Box,
  CircularProgress,
  Collapse
} from '@mui/material';
import { CheckCircleOutlined, ErrorOutlined } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';
import { VNA_COLORS } from '@core/theme';
import { useAuth } from '@core/contexts/AuthProvider';
import { authService } from '@tts/services/auth.services';
import { getCookie } from '@core/services/cookies';
import { validate, VALIDATION_MESSAGES } from '@core/utils/validation';
import useLocales from '@core/hooks/useLocales';
import { RequiredLabel } from './RequiredLabel';

const getChangeEmailErrorMessage = (error: any, defaultMsg: string): string => {
  const backendMsg = error?.response?.data?.errors || error?.response?.data?.message || error?.message || '';
  if (!backendMsg) return defaultMsg;
  if (typeof backendMsg === 'string') {
    if (backendMsg === 'BAD REQUEST' || backendMsg.toUpperCase() === 'BAD REQUEST') return defaultMsg;
    return backendMsg;
  }
  if (Array.isArray(backendMsg)) {
    return backendMsg[0];
  }
  if (typeof backendMsg === 'object') {
    const nested = backendMsg.message || backendMsg.error;
    if (nested) {
      return Array.isArray(nested) ? nested[0] : String(nested);
    }
  }
  return defaultMsg;
};

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
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: 'rgba(255, 69, 58, 0.05)',
    border: `1px solid ${VNA_COLORS.error}`,
    borderRadius: 4,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
    textAlign: 'left',
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
    textAlign: 'left',
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

interface ChangeEmailModalProps {
  open: boolean;
  onClose: () => void;
  onEmailChanged?: (email: string) => void;
}

export const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({ open, onClose, onEmailChanged }) => {
  const classes = useStyles();
  const { user, login } = useAuth();
  const { translate } = useLocales();
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(60);
  const [otp, setOtp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-dismiss messages after 3 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (errorMsg || successMsg) {
      if (successMsg !== 'Đang gửi mã OTP...' && successMsg !== 'Đang gửi lại mã OTP...') {
        timer = setTimeout(() => {
          setErrorMsg(null);
          setSuccessMsg(null);
        }, 3000);
      }
    }
    return () => clearTimeout(timer);
  }, [errorMsg, successMsg]);

  // Send OTP automatically when modal is opened in step 1
  useEffect(() => {
    if (open && step === 1 && user?.email) {
      setErrorMsg(null);
      setSuccessMsg('Đang gửi mã OTP...');
      authService.sendOtp(user.email)
        .then(() => {
          setSuccessMsg(translate("notifications.otpSentSuccess"));
        })
        .catch((err: any) => {
          setSuccessMsg(null);
          const msg = getChangeEmailErrorMessage(err, translate("notifications.error"));
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
      setSuccessMsg(translate("notifications.otpSentSuccess"));
    } catch (err: any) {
      setSuccessMsg(null);
      const msg = getChangeEmailErrorMessage(err, translate("notifications.error"));
      setErrorMsg(msg);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validate.required(otp)) {
      setErrorMsg(VALIDATION_MESSAGES.REQUIRED);
      return;
    }
    if (!validate.otp(otp)) {
      setErrorMsg('Mã OTP không chính xác, vui lòng kiểm tra lại');
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
        setErrorMsg('Mã OTP không chính xác, vui lòng kiểm tra lại');
      }
    } catch (err: any) {
      const backendMsg = err.response?.data?.errors || err.response?.data?.message || err.message || '';
      let displayMsg = 'Mã OTP không chính xác, vui lòng kiểm tra lại';
      if (typeof backendMsg === 'string' && backendMsg.toLowerCase().includes('hết hạn')) {
        displayMsg = 'Mã OTP đã hết hạn, vui lòng kiểm tra lại';
      }
      setErrorMsg(displayMsg);
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
      setErrorMsg('Email không hợp lệ , vui lòng kiểm tra lại dữ liệu');
      return;
    }
    if (user?.email && newEmail.toLowerCase() === user.email.toLowerCase()) {
      setErrorMsg('Email mới không được trùng email hiện tại , vui lòng kiểm tra lại dữ liệu');
      return;
    }
    if (!user?.id) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Check if email already exists
      const checkRes = await authService.checkEmail(newEmail, user.id);
      if (checkRes && checkRes.existed) {
        setErrorMsg('Email mới đã tồn tại trên hệ thống, vui lòng kiểm tra lại dữ liệu');
        setLoading(false);
        return;
      }

      // 2. call put users/:id to update email
      await authService.updateProfile(user.id, { email: newEmail });
      
      // Update local storage and authentication context user info
      const token = getCookie('accessToken') || '';
      login({ ...user, email: newEmail }, token, false);
      
      setSuccessMsg(translate("notifications.emailChangeSuccess"));
      if (onEmailChanged) {
        onEmailChanged(newEmail);
      }
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      const msg = getChangeEmailErrorMessage(err, translate("notifications.error"));
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

  const handleInputFocus = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
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
            
            <Collapse in={!!errorMsg}>
              <Box className={classes.errorBox}>
                <ErrorOutlined className={classes.errorText} fontSize="small" />
                <Typography className={classes.errorText}>{errorMsg}</Typography>
              </Box>
            </Collapse>
            <Collapse in={!!successMsg}>
              <Box className={classes.successBox}>
                <CheckCircleOutlined className={classes.successText} fontSize="small" />
                <Typography className={classes.successText}>{successMsg}</Typography>
              </Box>
            </Collapse>

            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label={<RequiredLabel label="Mã OTP" />}
              className={classes.field}
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onFocus={handleInputFocus}
              disabled={loading}
            />
            
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
            
            <Collapse in={!!errorMsg}>
              <Box className={classes.errorBox}>
                <ErrorOutlined className={classes.errorText} fontSize="small" />
                <Typography className={classes.errorText}>{errorMsg}</Typography>
              </Box>
            </Collapse>
            <Collapse in={!!successMsg}>
              <Box className={classes.successBox}>
                <CheckCircleOutlined className={classes.successText} fontSize="small" />
                <Typography className={classes.successText}>{successMsg}</Typography>
              </Box>
            </Collapse>

            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label={<RequiredLabel label="Email mới" />}
              className={classes.field}
              placeholder="Nhập email mới"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onFocus={handleInputFocus}
              disabled={loading}
            />
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