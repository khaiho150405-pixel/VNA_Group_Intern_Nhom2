'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { Save as SaveIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { VNA_COLORS } from '@core/theme';
import { DoetService } from '@tts/services';
import { useSnackbar } from 'notistack';
import { IconButton, InputAdornment } from '@mui/material';
import { validate, VALIDATION_MESSAGES } from '@core/utils/validation';

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  enterpriseId: number | null;
  enterpriseName: string;
  username?: string;
}

export const ResetPasswordModal = ({
  open,
  onClose,
  enterpriseId,
  enterpriseName,
  username,
}: ResetPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!open) {
      setNewPassword('');
      setShowPassword(false);
    }
  }, [open]);

  const handleSave = async () => {
    if (!newPassword || !validate.password(newPassword)) {
      enqueueSnackbar(VALIDATION_MESSAGES.PASSWORD_INVALID, { variant: 'error' });
      return;
    }
    if (!enterpriseId) return;

    setSubmitting(true);
    try {
      await DoetService.adminResetPassword(enterpriseId, newPassword);
      enqueueSnackbar('Cấp lại mật khẩu thành công', { variant: 'success' });
      onClose();
    } catch (error) {
      enqueueSnackbar('Lỗi khi cấp lại mật khẩu', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const accountLabel = username || enterpriseName || '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden' } } }}
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
        Xác nhận
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <Typography sx={{ mb: 2, fontSize: '0.95rem' }}>
          Khởi tạo mật khẩu cho tài khoản <strong>{accountLabel}</strong>
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Nhập mật khẩu mới mong muốn"
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          slotProps={{
            htmlInput: { autoComplete: 'new-password' },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, mt: 3 }}>
          <Button
            onClick={onClose}
            disabled={submitting}
            sx={{ color: '#666', textTransform: 'none', fontWeight: 500 }}
          >
            Huỷ bỏ
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={submitting}
            sx={{
              bgcolor: VNA_COLORS.primary,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: VNA_COLORS.primaryHover },
              fontWeight: 500,
              px: 2,
            }}
          >
            Lưu
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
