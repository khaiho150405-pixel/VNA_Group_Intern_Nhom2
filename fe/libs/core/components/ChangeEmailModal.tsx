import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Typography, 
  Box
} from '@mui/material';
import { makeStyles } from '@material-ui/styles';
import { Theme } from '@mui/material/styles';
import { VNA_COLORS } from '@core/theme';
import { useAuth } from '@core/contexts/AuthProvider';

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
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
    display: 'block',
    textAlign: 'left',
  },
  field: {
    marginBottom: theme.spacing(1),
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
    '&:disabled': { color: '#ccc' }
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
    '&:hover': { backgroundColor: VNA_COLORS.primaryHover },
  },
  cancelBtn: {
    textTransform: 'none',
    color: VNA_COLORS.gray,
    padding: 0,
  }
}));

interface ChangeEmailModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({ open, onClose }) => {
  const classes = useStyles();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (open && step === 1 && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [open, step, countdown]);

  const handleNext = () => setStep(2);
  
  const handleClose = () => {
    setStep(1);
    setCountdown(60);
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
              <strong>{user?.email || 'phanthanh-tung99@gmail.com'}</strong><br/>
              Bạn vui lòng kiểm tra và điền mã xác thực
            </Typography>
            
            <Typography className={classes.label}>OTP (*)</Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              className={classes.field}
              placeholder="Nhập mã OTP"
            />
            
            <Box>
              <Typography className={classes.countdown}>
                00:{countdown < 10 ? `0${countdown}` : countdown}
              </Typography>
              <Button 
                disabled={countdown > 0} 
                className={classes.resendBtn}
                onClick={() => setCountdown(60)}
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
            
            <Typography className={classes.label}>Email (*)</Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              className={classes.field}
              placeholder="Nhập email mới"
            />
          </>
        )}
      </DialogContent>
      
      <DialogActions className={classes.actions}>
        <Button 
          variant="contained" 
          className={classes.confirmBtn}
          onClick={step === 1 ? handleNext : handleClose}
        >
          {step === 1 ? 'Xác nhận' : 'Lưu'}
        </Button>
        <Button onClick={handleClose} className={classes.cancelBtn}>Hủy bỏ</Button>
      </DialogActions>
    </Dialog>
  );
};
