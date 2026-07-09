'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { VNA_COLORS } from '@core/theme';

interface EnterpriseAccountDialogProps {
  open: boolean;
  onClose: () => void;
  username: string;
  password: string;
}

export const EnterpriseAccountDialog = ({
  open,
  onClose,
  username,
  password,
}: EnterpriseAccountDialogProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden', minWidth: 320 } } }}
    >
      <Box
        sx={{
          bgcolor: VNA_COLORS.primary,
          color: '#fff',
          textAlign: 'center',
          py: 1.25,
          fontWeight: 600,
          fontSize: '1rem',
        }}
      >
        Thông tin tài khoản
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <Typography sx={{ mb: 1.5, fontSize: '0.95rem' }}>
          • Tài khoản: <strong>{username}</strong>
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.95rem' }}>
            • Mật khẩu: <strong>{showPassword ? password : '••••••••'}</strong>
          </Typography>
          <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            onClick={onClose}
            sx={{
              textTransform: 'none',
              color: '#666',
              fontSize: '0.85rem',
              borderRadius: '6px',
              padding: '4px 16px',
              minWidth: 'auto',
              backgroundColor: 'transparent',
              boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#f5f5f7',
                color: '#333',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)'
              }
            }}
          >
            Huỷ bỏ
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};