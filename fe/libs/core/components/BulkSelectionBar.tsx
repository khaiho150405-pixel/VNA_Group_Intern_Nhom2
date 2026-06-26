'use client';

import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';

interface BulkSelectionBarProps {
  count: number;
  label?: string;
  onDelete?: () => void;
  onClose: () => void;
}

export const BulkSelectionBar = ({
  count,
  label = 'dữ liệu được chọn',
  onDelete,
  onClose,
}: BulkSelectionBarProps) => {
  if (count === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: '#fff',
        boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.12), 0px 4px 16px rgba(0, 0, 0, 0.04)',
        borderRadius: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        p: '6px 12px',
        gap: 1.5,
        zIndex: 1300,
        border: '1px solid #e0e0e0',
      }}
    >
      <Box
        sx={{
          bgcolor: '#2f65f0',
          color: '#fff',
          minWidth: 32,
          height: 32,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: '0.95rem',
          px: 1,
        }}
      >
        {count}
      </Box>
      <Typography sx={{ fontSize: '0.9rem', color: '#333', whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
      <Button
        variant="contained"
        color="error"
        size="small"
        startIcon={<DeleteIcon fontSize="small" />}
        onClick={onDelete}
        sx={{
          textTransform: 'none',
          borderRadius: '6px',
          bgcolor: '#ff453a',
          '&:hover': { bgcolor: '#e63930', boxShadow: '0px 8px 20px rgba(255, 69, 58, 0.35)' },
          fontWeight: 500,
          px: 2,
          boxShadow: '0px 4px 12px rgba(255, 69, 58, 0.2)',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        Xoá
      </Button>
      <IconButton size="small" onClick={onClose} sx={{ color: '#999' }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};