'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Lock as AccessDeniedIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { MainLayout } from '@core/layouts/MainLayout';
import { useAuth } from '@core/contexts/AuthProvider';
import { permissionService } from '@tts/services/permission.services';
import { useSnackbar } from 'notistack';

export const PermissionListPage = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any[]>([]);

  const isTestUser = user?.username === 'testuser';

  useEffect(() => {
    if (!isTestUser) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const res = await permissionService.getAll();
        let list = [];
        if (Array.isArray(res)) {
          list = res;
        } else {
          list = res?.data?.items || res?.items || [];
        }
        setPermissions(list);
      } catch (error) {
        enqueueSnackbar('Lỗi tải danh sách quyền hệ thống', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [isTestUser, enqueueSnackbar]);

  // Deny access for users other than testuser
  if (!isTestUser) {
    return (
      <MainLayout>
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Box sx={{ bgcolor: '#fee2e2', p: 3, borderRadius: '50%', mb: 3 }}>
            <Typography color="error" variant="h3" component="div" sx={{ display: 'flex' }}>
              🔒
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
            Quyền truy cập bị từ chối
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 3, textAlign: 'center', maxWidth: 450 }}>
            Chỉ tài khoản quản trị hệ thống mặc định (<strong>testuser</strong>) mới được phép truy cập và xem chi tiết cấu hình quyền hạn này.
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  // Group permissions
  const groups = permissions.filter((p) => p.type === 'Group');
  const getComponentsForGroup = (groupCode: string) => {
    return permissions
      .filter((p) => p.type === 'Component' && p.parentCode === groupCode)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon sx={{ color: '#2f65f0', fontSize: '2rem' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Quản lý quyền hạn
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Danh sách chi tiết tất cả các quyền phân nhóm hệ thống trong cơ sở dữ liệu
              </Typography>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={45} thickness={4} sx={{ color: '#2f65f0' }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {groups.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '10px' }}>
                <Typography sx={{ color: '#64748b' }}>Không tìm thấy quyền nào trong cơ sở dữ liệu.</Typography>
              </Paper>
            ) : (
              groups
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((group) => {
                  const components = getComponentsForGroup(group.code);
                  return (
                    <Accordion
                      key={group.code}
                      defaultExpanded
                      sx={{
                        borderRadius: '10px !important',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        '&::before': { display: 'none' },
                        mb: 1
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          bgcolor: '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
                          px: 3,
                          py: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            label="GROUP"
                            color="primary"
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              bgcolor: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '4px'
                            }}
                          />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            {group.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace', bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: '4px' }}>
                            {group.code}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        {components.length === 0 ? (
                          <Box sx={{ p: 3, textStyle: 'italic', color: '#94a3b8', textAlign: 'center' }}>
                            Không có quyền thành phần nào thuộc nhóm này.
                          </Box>
                        ) : (
                          <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                              <TableHead sx={{ bgcolor: '#fafafa' }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600, color: '#475569', pl: 4 }} width={80}>STT</TableCell>
                                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} width={250}>Mã quyền (Code)</TableCell>
                                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Tên quyền</TableCell>
                                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} width={120}>Thứ tự</TableCell>
                                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} width={150}>Phân loại</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {components.map((comp, idx) => (
                                  <TableRow
                                    key={comp.code}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fafc' } }}
                                  >
                                    <TableCell sx={{ pl: 4, color: '#64748b' }}>{idx + 1}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500, color: '#0f172a' }}>
                                      {comp.code}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: '#334155' }}>
                                      {comp.name}
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{comp.order}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label="Component"
                                        size="small"
                                        sx={{
                                          fontWeight: 600,
                                          fontSize: '0.75rem',
                                          bgcolor: '#f0fdf4',
                                          color: '#166534',
                                          border: '1px solid #bbf7d0',
                                          borderRadius: '4px'
                                        }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })
            )}
          </Box>
        )}
      </Box>
    </MainLayout>
  );
};
