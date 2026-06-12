"use client";
import React, { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Sidebar } from '@core/components/Sidebar';
import { useAuth } from '@core/contexts/AuthProvider';
import { useRouter } from 'next/navigation';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#f4f6f8',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#f4f6f8',
      }}
    >
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

