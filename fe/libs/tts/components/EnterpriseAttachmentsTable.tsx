'use client';

import React, { useRef, useState } from 'react';
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
import { ConfirmDialog } from '@core/components/ConfirmDialog';

const ACCEPTED = '.pdf,application/pdf,image/png,image/jpeg,image/jpg';
const ACCEPTED_REGEX = /\.(pdf|png|jpe?g)$/i;

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
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  const triggerUpload = (index: number) => {
    inputRefs.current[index]?.click();
  };

  const handleFile = (index: number, file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_REGEX.test(file.name)) {
      alert('Chỉ chấp nhận file .pdf, .png, .jpg, .jpeg');
      return;
    }
    onUpload?.(index, file);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteIndex !== null) {
      onRemove?.(confirmDeleteIndex);
      setConfirmDeleteIndex(null);
    }
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
    <>
      <ConfirmDialog
        open={confirmDeleteIndex !== null}
        title="Xác nhận xóa tệp"
        message="Bạn có chắc chắn muốn xóa tệp đính kèm này không?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteIndex(null)}
        confirmText="Xóa"
      />
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
                  {file.fileUrl || file.fileName ? (
                    <Tooltip title="Xem">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => {
                            let url = file.fileUrl;
                            if (!url && file.fileName) {
                              const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333/api/v1').replace('/api/v1', '');
                              url = `${baseUrl}/uploads/${file.fileName}`;
                            }
                            if (url) {
                              if (!url.startsWith('blob:') && !url.startsWith('http') && !url.startsWith('data:')) {
                                const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333/api/v1').replace('/api/v1', '');
                                url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
                              }
                              window.open(url, '_blank');
                            }
                          }}
                          sx={{ color: '#2f65f0' }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
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
                            onClick={() => setConfirmDeleteIndex(index)}
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
    </>
  );
};