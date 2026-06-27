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
        <Button
          onClick={onCancel}
          disableRipple
          sx={{
            textTransform: 'none',
            color: '#666',
            fontSize: '0.875rem',
            borderRadius: '6px',
            padding: '4.8px 18px',
            boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: '#f5f5f7',
              color: '#333',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)',
            },
          }}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          autoFocus 
          sx={{ 
            textTransform: 'none', 
            borderRadius: '6px',
            bgcolor: isDestructive ? '#ff453a' : '#2f65f0',
            fontWeight: 600,
            px: 3,
            boxShadow: isDestructive ? '0px 4px 12px rgba(255, 69, 58, 0.2)' : '0px 4px 12px rgba(47, 101, 240, 0.2)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': { 
              bgcolor: isDestructive ? '#e63930' : '#1e4fd1',
              boxShadow: isDestructive ? '0px 8px 20px rgba(255, 69, 58, 0.35)' : '0px 8px 20px rgba(47, 101, 240, 0.35)',
            }
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
