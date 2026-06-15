'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
} from '@mui/material';
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
        <Typography sx={{ fontSize: '0.95rem' }}>
          • Mật khẩu: <strong>{password}</strong>
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            onClick={onClose}
            sx={{ color: VNA_COLORS.primary, textTransform: 'none', fontWeight: 500 }}
          >
            Huỷ bỏ
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};