'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    TextField,
    Button,
    Typography,
    DialogTitle,
    DialogActions,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Save as SaveIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { userService } from '@tts/services/user.services';
import { useSnackbar } from 'notistack';

export interface UserPasswordDialogProps {
    open: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

export const UserPasswordDialog = ({
    open,
    onClose,
    userId,
    userName,
}: UserPasswordDialogProps) => {
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (!open) {
            setNewPassword('');
            setShowPassword(false);
        }
    }, [open]);

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            enqueueSnackbar("Mật khẩu phải có ít nhất 6 ký tự!", { variant: "error" });
            return;
        }
        try {
            await userService.update(userId, { password: newPassword });
            enqueueSnackbar("Đặt lại mật khẩu thành công!", { variant: "success" });
            onClose();
        } catch (error) {
            enqueueSnackbar("Có lỗi xảy ra khi cập nhật mật khẩu.", { variant: "error" });
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            sx={{ '& .MuiDialog-paper': { borderRadius: '10px' } }}
        >
            <DialogTitle sx={{ bgcolor: '#2f65f0', color: 'white', textAlign: 'center', fontWeight: 700, py: 1.5 }}>
                Xác nhận
            </DialogTitle>
            <DialogContent sx={{ pt: '24px !important', pb: 1 }}>
                <Typography sx={{ mb: 2, color: '#333', fontSize: '0.95rem' }}>
                    Khởi tạo mật khẩu cho tài khoản <strong>{userName}</strong>
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Nhập mật khẩu mới mong muốn"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                <Button
                    onClick={onClose}
                    sx={{ color: '#2f65f0', textTransform: 'none', fontWeight: 600 }}
                >
                    Huỷ bỏ
                </Button>
                <Button
                    onClick={handleChangePassword}
                    variant="contained"
                    disableElevation
                    startIcon={<SaveIcon fontSize="small" />}
                    sx={{ textTransform: 'none', bgcolor: '#2f65f0', fontWeight: 600, borderRadius: '6px' }}
                >
                    Lưu
                </Button>
            </DialogActions>
        </Dialog>
    );
};
