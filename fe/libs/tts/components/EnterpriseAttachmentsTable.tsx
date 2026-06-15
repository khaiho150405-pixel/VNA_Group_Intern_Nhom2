'use client';

import React, { useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  FileUpload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { FileAttachment } from '@shared/tts/models';

const ACCEPTED = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';
const ACCEPTED_REGEX = /\.(jpe?g|png|pdf)$/i;

interface EnterpriseAttachmentsTableProps {
  attachments: FileAttachment[];
  readOnly?: boolean;
  onPreview: (file: FileAttachment) => void;
  onUpload?: (index: number, file: File) => void;
  onRemove?: (index: number) => void;
}

const LABELS: Record<string, string> = {
  GPKD: 'Giấy phép kinh doanh',
  OTHER: 'Giấy tờ khác',
};

export const EnterpriseAttachmentsTable = ({
  attachments,
  readOnly = false,
  onPreview,
  onUpload,
  onRemove,
}: EnterpriseAttachmentsTableProps) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const triggerUpload = (index: number) => {
    inputRefs.current[index]?.click();
  };

  const handleFile = (index: number, file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_REGEX.test(file.name)) {
      alert('Chỉ chấp nhận file .jpg, .jpeg, .png hoặc .pdf');
      return;
    }
    onUpload?.(index, file);
  };

  const headerSx = {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#5a6478',
    bgcolor: '#f7f9fc',
    borderBottom: '1px solid #eef0f4',
    py: 1.25,
  };

  const cellSx = {
    fontSize: '0.875rem',
    color: '#1f2937',
    borderBottom: '1px solid #f3f4f6',
    py: 1.5,
  };

  return (
    <TableContainer sx={{ border: '1px solid #eef0f4', borderRadius: 2, bgcolor: '#fff' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headerSx}>Tên file</TableCell>
            <TableCell sx={headerSx}>Thông tin file</TableCell>
            <TableCell sx={{ ...headerSx, textAlign: 'right' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {attachments.map((file, index) => (
            <TableRow key={index} hover>
              <TableCell sx={cellSx}>{LABELS[file.type] || 'Tệp đính kèm'}</TableCell>
              <TableCell sx={cellSx}>
                {file.fileName ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2f65f0' }} />
                    <Typography sx={{ fontSize: '0.875rem' }}>{file.fileName}</Typography>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: '0.85rem', color: '#9ca3af' }}>Chưa tải lên</Typography>
                )}
              </TableCell>
              <TableCell sx={{ ...cellSx, textAlign: 'right' }}>
                <Tooltip title="Xem">
                  <span>
                    <IconButton
                      size="small"
                      disabled={!file.fileUrl && !file.localFile}
                      onClick={() => onPreview(file)}
                      sx={{ color: '#6b7280' }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                {!readOnly && (
                  <>
                    <Tooltip title="Tải lên">
                      <IconButton
                        size="small"
                        onClick={() => triggerUpload(index)}
                        sx={{ color: '#6b7280' }}
                      >
                        <UploadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xoá">
                      <span>
                        <IconButton
                          size="small"
                          disabled={!file.fileName}
                          onClick={() => onRemove?.(index)}
                          sx={{ color: '#6b7280' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <input
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="file"
                      accept={ACCEPTED}
                      hidden
                      onChange={(e) => {
                        handleFile(index, e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};