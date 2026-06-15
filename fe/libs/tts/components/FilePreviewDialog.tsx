'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { FileAttachment } from '@shared/tts/models';

interface FilePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  file?: FileAttachment | null;
}

const getFullUrl = (file?: FileAttachment | null) => {
  if (!file) return '';
  const url = file.fileUrl;
  if (url && (url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:'))) return url;
  
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333/api/v1').replace('/api/v1', '');
  
  if (url) return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  
  // Fallback: If URL is missing but filename exists, assume it's in a standard uploads directory
  if (file.fileName) return `${baseUrl}/uploads/${file.fileName}`;
  
  return '';
};

export const FilePreviewDialog = ({ open, onClose, file }: FilePreviewDialogProps) => {
  if (!file) return null;

  const url = getFullUrl(file);
  const name = file.fileName || 'Tệp đính kèm';
  const isImage = (file.mimeType || '').startsWith('image/') ||
    /\.(png|jpe?g|gif|webp)$/i.test(name);
  const isPdf = (file.mimeType || '') === 'application/pdf' ||
    /\.pdf$/i.test(name);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600 }}>{name}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, height: '70vh', bgcolor: '#f5f5f5' }}>
        {url ? (
          isImage ? (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
            </Box>
          ) : isPdf ? (
            <iframe
              src={url}
              title={name}
              style={{ border: 0, width: '100%', height: '100%' }}
            />
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography>Không thể xem trước định dạng này.</Typography>
            </Box>
          )
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">Chưa có tệp được tải lên.</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
