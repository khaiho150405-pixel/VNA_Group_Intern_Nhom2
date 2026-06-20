import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog = ({
  open,
  title = 'Xác nhận',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDestructive = true
}: ConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isDestructive ? '#ff453a' : 'inherit' }}>
        {isDestructive && <WarningIcon sx={{ color: '#ff453a' }} />}
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: '#333' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" color="inherit" sx={{ textTransform: 'none', borderRadius: '6px' }}>
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          autoFocus 
          disableElevation
          sx={{ 
            textTransform: 'none', 
            borderRadius: '6px',
            bgcolor: isDestructive ? '#ff453a' : '#2f65f0',
            '&:hover': { bgcolor: isDestructive ? '#e63930' : '#2551c0' },
            fontWeight: 600,
            px: 3
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
