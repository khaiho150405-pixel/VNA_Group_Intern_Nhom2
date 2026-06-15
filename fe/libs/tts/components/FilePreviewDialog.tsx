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

export const FilePreviewDialog = ({ open, onClose, file }: FilePreviewDialogProps) => {
  if (!file) return null;

  const url = file.fileUrl;
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
