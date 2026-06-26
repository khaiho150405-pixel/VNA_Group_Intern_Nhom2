'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  AdminPanelSettings as RoleIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { MainLayout } from '@core/layouts/MainLayout';
import { useAuth } from '@core/contexts/AuthProvider';
import { roleService } from '@tts/services/role.services';
import { permissionService } from '@tts/services/permission.services';
import { userService } from '@tts/services/user.services';
import { useSnackbar } from 'notistack';
import { ConfirmDialog } from '@core/components/ConfirmDialog';

export const RoleManagementPage = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Form states
  const [formValues, setFormValues] = useState({
    role: '',
    name: '',
    type: 'SO', // 'SO' | 'DN'
    status: true
  });
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Allowed users state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Confirm delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);

  const isTestUser = user?.username === 'testuser';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roleRes, permRes] = await Promise.all([
        roleService.getAll(),
        permissionService.getAll()
      ]);

      let roleList = [];
      if (Array.isArray(roleRes)) {
        roleList = roleRes;
      } else {
        roleList = roleRes?.data?.items || roleRes?.items || [];
      }
      setRoles(roleList);

      let permList = [];
      if (Array.isArray(permRes)) {
        permList = permRes;
      } else {
        permList = permRes?.data?.items || permRes?.items || [];
      }
      setAllPermissions(permList);
    } catch (error) {
      enqueueSnackbar('Lỗi tải dữ liệu vai trò và quyền hạn', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await userService.getUsers({ pageNumber: 0, pageSize: 999 });
      let userList: any[] = [];
      if (Array.isArray(res)) {
        userList = res;
      } else {
        userList = (res as any)?.items || (res as any)?.data?.items || [];
      }
      // Exclude enterprise users and testuser
      userList = userList.filter((u: any) =>
        u.username !== 'testuser' &&
        u.role?.type !== 'DN' &&
        u.role?.role !== 'enterprise' &&
        u.role?.id !== 5 &&
        u.role?.name !== 'Doanh nghiệp'
      );
      setAllUsers(userList);
    } catch (error) {
      enqueueSnackbar('Lỗi tải danh sách người dùng', { variant: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isTestUser) {
      fetchData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestUser]);

  // Hierarchical permission structures
  const permissionGroups = useMemo(() => {
    return allPermissions.filter(p => p.type === 'Group');
  }, [allPermissions]);

  const getComponentsForGroup = (groupCode: string) => {
    return allPermissions.filter(p => p.type === 'Component' && p.parentCode === groupCode);
  };

  // Filtered users for search
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return allUsers;
    const q = userSearchQuery.toLowerCase();
    return allUsers.filter((u: any) =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }, [allUsers, userSearchQuery]);

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
            Chỉ tài khoản quản trị hệ thống mặc định (<strong>testuser</strong>) mới được phép thay đổi, chỉnh sửa hoặc gán vai trò người dùng.
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  // Handle forms
  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setSelectedRoleId(null);
    setFormValues({
      role: '',
      name: '',
      type: 'SO',
      status: true
    });
    setSelectedPermissionCodes([]);
    setSelectedUserIds([]);
    setUserSearchQuery('');
    setFormErrors({});
    fetchAllUsers();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (roleData: any) => {
    setIsEditMode(true);
    setSelectedRoleId(roleData.id);
    setFormValues({
      role: roleData.role,
      name: roleData.name,
      type: roleData.type || 'SO',
      status: roleData.status !== false
    });
    
    // Map current permissions to checked codes
    const currentCodes = (roleData.permissions || []).map((p: any) => p.code);
    setSelectedPermissionCodes(currentCodes);
    setUserSearchQuery('');
    setFormErrors({});

    // Load users and compute which have this role in their allowedRoles
    fetchAllUsers();
    // Pre-select users that have this role in their allowedRoles
    // Will be computed after users load via useEffect
    setSelectedUserIds([]);
    setDialogOpen(true);
  };

  // When allUsers loads and a role is being edited, compute initially selected users
  useEffect(() => {
    if (dialogOpen && isEditMode && selectedRoleId !== null && allUsers.length > 0) {
      const currentRoleData = roles.find(r => r.id === selectedRoleId);
      if (!currentRoleData) return;
      const roleKey = currentRoleData.role; // e.g. 'employee', 'expert'
      const preSelected = allUsers
        .filter((u: any) => {
          const isCurrent = (String(u.role?.role) === String(roleKey)) || 
                            (Number(u.roleId) === Number(selectedRoleId)) || 
                            (Number(u.role?.id) === Number(selectedRoleId));
          if (isCurrent) return true;

          const raw = u.allowedRoles;
          if (!raw) return false;
          if (Array.isArray(raw)) return raw.map(String).includes(roleKey);
          if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).includes(roleKey);
          return false;
        })
        .map((u: any) => String(u.id));
      setSelectedUserIds(preSelected);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers, dialogOpen, isEditMode, selectedRoleId]);

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formValues.role || formValues.role.trim() === '') {
      errors.role = 'Mã vai trò không được bỏ trống';
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(formValues.role)) {
      errors.role = 'Mã vai trò phải từ 3-30 ký tự, không dấu, không khoảng trắng';
    }

    if (!formValues.name || formValues.name.trim() === '') {
      errors.name = 'Tên vai trò không được bỏ trống';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Checkbox Tree Actions
  const handleToggleGroup = (groupCode: string) => {
    const children = getComponentsForGroup(groupCode);
    const childCodes = children.map(c => c.code);

    const isAllChecked = childCodes.length > 0 && childCodes.every(code => selectedPermissionCodes.includes(code));

    if (isAllChecked) {
      // Uncheck group and all children
      setSelectedPermissionCodes(prev => 
        prev.filter(code => code !== groupCode && !childCodes.includes(code))
      );
    } else {
      // Check group and all children
      const codesToAdd = [groupCode, ...childCodes];
      setSelectedPermissionCodes(prev => {
        const set = new Set([...prev, ...codesToAdd]);
        return Array.from(set);
      });
    }
  };

  const handleToggleComponent = (compCode: string, parentGroupCode: string) => {
    const isChecked = selectedPermissionCodes.includes(compCode);
    
    if (isChecked) {
      // Uncheck component and parent group
      setSelectedPermissionCodes(prev => 
        prev.filter(code => code !== compCode && code !== parentGroupCode)
      );
    } else {
      // Check component
      setSelectedPermissionCodes(prev => {
        const nextList = [...prev, compCode];
        
        // If all sibling components of this group are now checked, check the parent group too
        const children = getComponentsForGroup(parentGroupCode);
        const childCodes = children.map(c => c.code);
        const isAllSiblingsChecked = childCodes.every(code => nextList.includes(code));
        
        if (isAllSiblingsChecked && !nextList.includes(parentGroupCode)) {
          nextList.push(parentGroupCode);
        }
        return nextList;
      });
    }
  };

  // Toggle a user's checkbox for allowedRoles
  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleStatusToggle = async (id: number, currentStatus: boolean) => {
    try {
      // Disable toggling status for superAdmin role
      const roleObj = roles.find(r => r.id === id);
      if (roleObj && (roleObj.id === 4 || roleObj.role === 'superAdmin')) {
        enqueueSnackbar('Không thể vô hiệu hóa vai trò superAdmin mặc định.', { variant: 'warning' });
        return;
      }

      const nextStatus = !currentStatus;
      await roleService.update(id, { status: nextStatus });
      enqueueSnackbar('Cập nhật trạng thái vai trò thành công', { variant: 'success' });
      fetchData();
    } catch (error) {
      enqueueSnackbar('Lỗi cập nhật trạng thái', { variant: 'error' });
    }
  };

  const handleConfirmDelete = (roleData: any) => {
    if (roleData.id === 4 || roleData.role === 'superAdmin') {
      enqueueSnackbar('Không thể xóa vai trò superAdmin mặc định.', { variant: 'warning' });
      return;
    }
    setRoleToDelete(roleData);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      setLoading(true);
      await roleService.delete(roleToDelete.id);
      enqueueSnackbar('Xóa vai trò thành công', { variant: 'success' });
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      fetchData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Lỗi khi xóa vai trò';
      enqueueSnackbar(String(msg), { variant: 'error' });
      setLoading(false);
    }
  };

  const handleSaveForm = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload = {
        ...formValues,
        permissionCodes: selectedPermissionCodes
      };

      if (isEditMode && selectedRoleId !== null) {
        await roleService.update(selectedRoleId, payload);
        enqueueSnackbar('Cập nhật vai trò thành công', { variant: 'success' });
      } else {
        await roleService.create(payload);
        enqueueSnackbar('Thêm mới vai trò thành công', { variant: 'success' });
      }

      // Update allowedRoles for all users based on checkbox selection
      const roleKey = formValues.role;
      await Promise.all(
        allUsers.map(async (u: any) => {
          const userId = String(u.id);
          const raw = u.allowedRoles;
          let currentAllowedRoles: string[] = [];
          if (Array.isArray(raw)) {
            currentAllowedRoles = raw.map(String);
          } else if (typeof raw === 'string' && raw.trim()) {
            currentAllowedRoles = raw.split(',').map(s => s.trim()).filter(Boolean);
          }

          const wasSelected = currentAllowedRoles.includes(roleKey);
          const isNowSelected = selectedUserIds.includes(userId);

          if (wasSelected === isNowSelected) return; // No change

          let newAllowedRoles: string[];
          if (isNowSelected) {
            // Add this role
            newAllowedRoles = [...new Set([...currentAllowedRoles, roleKey])];
          } else {
            // Remove this role
            newAllowedRoles = currentAllowedRoles.filter(r => r !== roleKey);
          }

          try {
            await userService.update(userId, { allowedRoles: newAllowedRoles });
          } catch (err) {
            console.error(`Failed to update allowedRoles for user ${u.username}`, err);
          }
        })
      );

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu vai trò';
      enqueueSnackbar(String(msg), { variant: 'error' });
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <RoleIcon sx={{ color: '#2f65f0', fontSize: '2.2rem' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Quản lý vai trò
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Thêm, sửa cấu hình và gán quyền hạn động cho các vai trò thành viên
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{
              bgcolor: '#2f65f0',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '6px',
              '&:hover': { bgcolor: '#1e4fd0' }
            }}
          >
            Thêm mới vai trò
          </Button>
        </Box>

        {/* Roles Table */}
        {loading && roles.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={45} thickness={4} sx={{ color: '#2f65f0' }} />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} width={80}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} width={180}>Mã vai trò (Role)</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Tên vai trò</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} width={150}>Phân loại</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} width={180}>Số lượng quyền</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} width={150} align="center">Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} width={120} align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((item, index) => (
                  <TableRow key={item.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{item.role}</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#334155' }}>{item.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.type === 'DN' ? 'Doanh nghiệp' : 'Cán bộ Sở'}
                        color={item.type === 'DN' ? 'warning' : 'primary'}
                        size="small"
                        sx={{ fontWeight: 600, borderRadius: '4px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${(item.permissions || []).length} quyền`}
                        size="small"
                        sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, borderRadius: '4px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={item.status !== false}
                        onChange={() => handleStatusToggle(item.id, item.status !== false)}
                        color="primary"
                        size="small"
                        disabled={item.id === 4 || item.role === 'superAdmin'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEditDialog(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleConfirmDelete(item)}
                            disabled={item.id === 4 || item.role === 'superAdmin'}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: '12px' } }}>
          <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#1e293b' }}>
              {isEditMode ? 'Chỉnh sửa cấu hình vai trò' : 'Thêm mới vai trò mới'}
            </Typography>
            <IconButton size="small" onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ py: 3 }}>
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Mã vai trò (Role Code) *"
                  variant="outlined"
                  size="small"
                  value={formValues.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={isEditMode}
                  error={!!formErrors.role}
                  helperText={formErrors.role}
                  placeholder="Ví dụ: employee, leader, expert"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Tên vai trò *"
                  variant="outlined"
                  size="small"
                  value={formValues.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  placeholder="Ví dụ: Nhân viên Sở, Lãnh đạo Sở"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569', mb: 0.5 }}>Phân loại vai trò</FormLabel>
                  <RadioGroup
                    row
                    value={formValues.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    <FormControlLabel value="SO" control={<Radio size="small" />} label="Cán bộ Sở" disabled={isEditMode && selectedRoleId === 4} />
                    <FormControlLabel value="DN" control={<Radio size="small" />} label="Doanh nghiệp" disabled={isEditMode && selectedRoleId === 4} />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formValues.status}
                      onChange={(e) => handleInputChange('status', e.target.checked)}
                      color="primary"
                      disabled={isEditMode && selectedRoleId === 4}
                    />
                  }
                  label="Trạng thái hoạt động"
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>

            {/* Checkbox Tree for Permissions */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              🛡️ Bảng phân bổ quyền hệ thống (Checkbox Tree)
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {permissionGroups.length === 0 ? (
                <Typography sx={{ color: '#94a3b8', fontStyle: 'italic', p: 1 }}>Đang tải danh sách quyền...</Typography>
              ) : (
                permissionGroups.map(group => {
                  const children = getComponentsForGroup(group.code);
                  const childCodes = children.map(c => c.code);

                  const isGroupAllChecked = childCodes.length > 0 && childCodes.every(code => selectedPermissionCodes.includes(code));
                  const isGroupIndeterminate = !isGroupAllChecked && childCodes.some(code => selectedPermissionCodes.includes(code));

                  return (
                    <Accordion
                      key={group.code}
                      defaultExpanded
                      sx={{
                        borderRadius: '8px !important',
                        border: '1px solid #e2e8f0',
                        boxShadow: 'none',
                        '&::before': { display: 'none' }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          bgcolor: '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
                          minHeight: '48px !important',
                          '& .MuiAccordionSummary-content': { my: '4px !important', display: 'flex', alignItems: 'center' }
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={isGroupAllChecked}
                              indeterminate={isGroupIndeterminate}
                              onChange={() => handleToggleGroup(group.code)}
                              onClick={(e) => e.stopPropagation()} // Prevent accordion toggle on checkbox click
                            />
                          }
                          label={
                            <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                              {group.name}
                            </Typography>
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Typography variant="caption" sx={{ ml: 1, color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          ({group.code})
                        </Typography>
                      </AccordionSummary>

                      <AccordionDetails sx={{ p: 2 }}>
                        <Grid container spacing={1}>
                          {children.map(comp => {
                            const isCompChecked = selectedPermissionCodes.includes(comp.code);
                            return (
                              <Grid size={{ xs: 12, sm: 6 }} key={comp.code}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={isCompChecked}
                                      onChange={() => handleToggleComponent(comp.code, group.code)}
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography sx={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                                        {comp.name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', fontFamily: 'monospace', display: 'block' }}>
                                        {comp.code}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </Grid>
                            );
                          })}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  );
                })
              )}
            </Box>

            {/* ===================== */}
            {/* Allowed Users Section */}
            {/* ===================== */}
            <Divider sx={{ my: 4 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              👤 Tài khoản được phép hoạt động với vai trò này
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontSize: '0.82rem' }}>
              Những tài khoản được tích vào đây sẽ có thể tự chuyển đổi sang vai trò <strong>{formValues.name || formValues.role}</strong> trong trang thông tin cá nhân.
            </Typography>

            {/* Search bar */}
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm kiếm theo tên, tên đăng nhập hoặc email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: '1.1rem' }} />
                }
              }}
              sx={{ mb: 1.5 }}
            />

            <Box sx={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              maxHeight: 280,
              overflowY: 'auto',
              bgcolor: '#fafafa'
            }}>
              {loadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} thickness={4} sx={{ color: '#2f65f0' }} />
                </Box>
              ) : filteredUsers.length === 0 ? (
                <Typography sx={{ color: '#94a3b8', fontStyle: 'italic', p: 2, textAlign: 'center', fontSize: '0.85rem' }}>
                  {userSearchQuery ? 'Không tìm thấy tài khoản phù hợp' : 'Không có tài khoản nào'}
                </Typography>
              ) : (
                <List dense disablePadding>
                  {filteredUsers.map((u: any, idx: number) => {
                    const uid = String(u.id);
                    const isChecked = selectedUserIds.includes(uid);
                    return (
                      <React.Fragment key={uid}>
                        <ListItem
                          onClick={() => handleToggleUser(uid)}
                          sx={{
                            cursor: 'pointer',
                            px: 2,
                            py: 0.8,
                            '&:hover': { bgcolor: '#f1f5f9' },
                            bgcolor: isChecked ? '#eff6ff' : 'transparent',
                            transition: 'background-color 0.15s'
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar
                              src={u.avatar || undefined}
                              sx={{ width: 30, height: 30, bgcolor: '#2f65f0', fontSize: '0.75rem' }}
                            >
                              {u.fullName ? u.fullName.charAt(0).toUpperCase() : <PersonIcon fontSize="small" />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                                {u.fullName || u.username}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Typography component="span" sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  @{u.username}
                                </Typography>
                                {u.role?.name && (
                                  <Chip
                                    label={u.role.name}
                                    size="small"
                                    sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#e2e8f0', color: '#475569' }}
                                  />
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Checkbox
                              edge="end"
                              size="small"
                              checked={isChecked}
                              onChange={() => handleToggleUser(uid)}
                              onClick={(e) => e.stopPropagation()}
                              sx={{ color: isChecked ? '#2f65f0' : undefined }}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        {idx < filteredUsers.length - 1 && <Divider component="li" sx={{ mx: 2 }} />}
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </Box>
            {selectedUserIds.length > 0 && (
              <Typography variant="caption" sx={{ color: '#2f65f0', mt: 0.5, display: 'block', fontWeight: 600 }}>
                Đã chọn {selectedUserIds.length} tài khoản
              </Typography>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
            <Button onClick={handleCloseDialog} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSaveForm}
              variant="contained"
              disableElevation
              startIcon={<SaveIcon />}
              sx={{ bgcolor: '#2f65f0', textTransform: 'none', fontWeight: 600, borderRadius: '6px' }}
            >
              Lưu vai trò
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirm dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Xác nhận xóa vai trò"
          message={`Bạn có chắc chắn muốn xóa vai trò "${roleToDelete?.name}" không? Hành động này không thể hoàn tác.`}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteRole}
        />
      </Box>
    </MainLayout>
  );
};
