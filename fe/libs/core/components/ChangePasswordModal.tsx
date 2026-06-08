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
          className={classes.field}
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

        <Typography className={classes.label}>Nhập lại mật khẩu mới (*)</Typography>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          type={showConfirm ? 'text' : 'password'}
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
        <Button variant="contained" className={classes.saveBtn} onClick={onClose}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
};
