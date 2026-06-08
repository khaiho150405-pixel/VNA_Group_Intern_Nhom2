"use client";
import React, { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { makeStyles } from '@material-ui/styles';
import { Sidebar } from '@core/components/Sidebar';
import { useAuth } from '@core/contexts/AuthProvider';
import { useRouter } from 'next/navigation';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#f4f6f8',
  },
  content: {
    flex: 1,
    height: '100%',
    overflowY: 'auto',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f4f6f8',
  }
}));

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <Box className={classes.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      <Sidebar />
      <Box component="main" className={classes.content}>
        {children}
      </Box>
    </Box>
  );
};
