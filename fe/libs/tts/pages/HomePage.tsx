'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { MainLayout } from '@core/layouts/MainLayout';
import { useAuth } from '@core/contexts/AuthProvider';

export const HomePage = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <Box p={3}>
        <Typography variant="h5" style={{ fontWeight: 700, marginBottom: 24 }}>
          Trang chủ
        </Typography>
        
        <Paper style={{ padding: 24, borderRadius: 8 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Chào mừng quay trở lại, {user?.fullName || user?.displayName}!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Bạn đang đăng nhập với vai trò: <strong>{user?.role === 'ROLE_SO' ? 'Cán bộ Sở' : 'Doanh nghiệp'}</strong>
          </Typography>
          <Box mt={4}>
            <Typography variant="body2">
              Đây là giao diện Dashboard tổng quan. Các chức năng cụ thể sẽ hiển thị ở menu bên trái dựa trên quyền hạn của bạn.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
};
