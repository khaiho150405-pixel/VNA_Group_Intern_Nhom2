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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  Checkbox,
  Pagination,
  Grid,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  AdminPanelSettings as RoleIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { MainLayout } from '@core/layouts/MainLayout';
import { useAuth } from '@core/contexts/AuthProvider';
import { roleService } from '@tts/services/role.services';
import { permissionService } from '@tts/services/permission.services';
import { userService } from '@tts/services/user.services';
import { useSnackbar } from 'notistack';
import { ConfirmDialog } from '@core/components/ConfirmDialog';
import { BulkSelectionBar } from '@core/components/BulkSelectionBar';
import { useUserListStyles } from '../logic/user/style';

export const RoleManagementPage = () => {
  const classes = useUserListStyles();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Main role list filters & pagination
  const [roleFilters, setRoleFilters] = useState({
    page: 1,
    limit: 10,
    role: '',
    name: ''
  });

  // Dialog permissions table filters & pagination
  const [dialogFilters, setDialogFilters] = useState({
    page: 1,
    limit: 10,
    code: '',
    name: ''
  });

  // Selected role ids for batch deletion
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  // Form states
  const [formValues, setFormValues] = useState({
    role: '',
    name: '',
    type: 'SO', // default value
    status: true // default value
  });
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Single delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'ADMIN_G_DEPARTMENT': true, // Default expanded as in screenshots
  });

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [initialSelectedUserIds, setInitialSelectedUserIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const userLimit = 5;

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

      // Lọc bỏ vai trò doanh nghiệp
      roleList = roleList.filter((r: any) =>
        r.role !== 'enterprise' &&
        r.type !== 'DN' &&
        r.id !== 5 &&
        r.name !== 'Doanh nghiệp'
      );

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
      const res = await userService.getUsers({ pageNumber: 0, pageSize: 999 });
      let userList: any[] = [];
      if (Array.isArray(res)) {
        userList = res;
      } else {
        userList = (res as any)?.items || (res as any)?.data?.items || [];
      }
      setAllUsers(userList);
    } catch (error) {
      console.error('Lỗi tải danh sách người dùng để kiểm tra vai trò', error);
    }
  };

  useEffect(() => {
    if (isTestUser) {
      fetchData();
      fetchAllUsers();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestUser]);

  const toggleGroup = (code: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const handleRoleFilterChange = (field: string, value: any) => {
    setRoleFilters(prev => ({
      ...prev,
      [field]: value,
      page: field === 'page' ? value : 1
    }));
    if (field !== 'page' && field !== 'limit') setSelectedIds([]);
  };

  const handleDialogFilterChange = (field: string, value: any) => {
    setDialogFilters(prev => ({
      ...prev,
      [field]: value,
      page: field === 'page' ? value : 1
    }));
  };

  // Main page roles search & pagination
  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      const matchRole = !roleFilters.role || r.role.toLowerCase().includes(roleFilters.role.toLowerCase());
      const matchName = !roleFilters.name || r.name.toLowerCase().includes(roleFilters.name.toLowerCase());
      return matchRole && matchName;
    });
  }, [roles, roleFilters.role, roleFilters.name]);

  const totalRoles = filteredRoles.length;
  const paginatedRoles = useMemo(() => {
    const start = (roleFilters.page - 1) * roleFilters.limit;
    return filteredRoles.slice(start, start + roleFilters.limit);
  }, [filteredRoles, roleFilters.page, roleFilters.limit]);

  const roleStartIndex = totalRoles > 0 ? (roleFilters.page - 1) * roleFilters.limit + 1 : 0;
  const roleEndIndex = Math.min(totalRoles, roleFilters.page * roleFilters.limit);

  // Group permissions definitions
  const permissionGroups = useMemo(() => {
    return allPermissions.filter(p => p.type === 'Group');
  }, [allPermissions]);

  const getComponentsForGroup = (groupCode: string) => {
    return allPermissions
      .filter(p => p.type === 'Component' && p.parentCode === groupCode)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // Dialog permissions search & pagination
  const dialogFilteredGroups = useMemo(() => {
    const list: any[] = [];
    permissionGroups
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(group => {
        const children = getComponentsForGroup(group.code);

        const matchingChildren = children.filter(comp => {
          const matchCode = !dialogFilters.code || comp.code.toLowerCase().includes(dialogFilters.code.toLowerCase());
          const matchName = !dialogFilters.name || comp.name.toLowerCase().includes(dialogFilters.name.toLowerCase());
          return matchCode && matchName;
        });

        const matchGroupCode = !dialogFilters.code || group.code.toLowerCase().includes(dialogFilters.code.toLowerCase());
        const matchGroupName = !dialogFilters.name || group.name.toLowerCase().includes(dialogFilters.name.toLowerCase());
        const groupMatches = matchGroupCode && matchGroupName;

        if (groupMatches || matchingChildren.length > 0) {
          list.push({
            ...group,
            matchingComponents: groupMatches && !dialogFilters.code && !dialogFilters.name ? children : matchingChildren,
            groupMatches
          });
        }
      });
    return list;
  }, [allPermissions, permissionGroups, dialogFilters.code, dialogFilters.name]);

  const dialogTotalCount = dialogFilteredGroups.length;
  const dialogPaginatedGroups = useMemo(() => {
    const start = (dialogFilters.page - 1) * dialogFilters.limit;
    return dialogFilteredGroups.slice(start, start + dialogFilters.limit);
  }, [dialogFilteredGroups, dialogFilters.page, dialogFilters.limit]);

  const dialogStartIndex = dialogTotalCount > 0 ? (dialogFilters.page - 1) * dialogFilters.limit + 1 : 0;
  const dialogEndIndex = Math.min(dialogTotalCount, dialogFilters.page * dialogFilters.limit);

  const dialogFilteredUsers = useMemo(() => {
    return allUsers.filter((u: any) => {
      // Chỉ hiển thị các user không phải doanh nghiệp
      const isEnterprise = u.role?.role === 'enterprise' || u.role?.type === 'DN' || Number(u.roleId) === 5 || Number(u.role?.id) === 5;
      if (isEnterprise) return false;

      const query = userSearchQuery.toLowerCase().trim();
      if (!query) return true;

      const matchUsername = u.username?.toLowerCase().includes(query);
      const matchFullName = u.fullName?.toLowerCase().includes(query);
      return matchUsername || matchFullName;
    });
  }, [allUsers, userSearchQuery]);

  const totalDialogUsers = dialogFilteredUsers.length;
  const paginatedDialogUsers = useMemo(() => {
    const start = (userPage - 1) * userLimit;
    return dialogFilteredUsers.slice(start, start + userLimit);
  }, [dialogFilteredUsers, userPage]);

  // Selection handlers
  const handleSelectAll = () => {
    const selectableRoles = filteredRoles.filter(r => r.id !== 4 && r.role !== 'superAdmin');
    const allSelectableChecked = selectableRoles.length > 0 && selectableRoles.every(r => selectedIds.includes(String(r.id)));

    if (allSelectableChecked || selectedIds.length > 0) {
      setSelectedIds([]);
    } else {
      const selectableIds = selectableRoles.map(r => String(r.id));
      setSelectedIds(selectableIds);
    }
  };

  // Dialog permissions select all states
  const allDialogPermissionCodes = useMemo(() => {
    const codes: string[] = [];
    dialogFilteredGroups.forEach(g => {
      codes.push(g.code);
      g.matchingComponents.forEach((c: any) => {
        codes.push(c.code);
      });
    });
    return codes;
  }, [dialogFilteredGroups]);

  const isDialogAllChecked = useMemo(() => {
    return allDialogPermissionCodes.length > 0 &&
      allDialogPermissionCodes.every(code => selectedPermissionCodes.includes(code));
  }, [allDialogPermissionCodes, selectedPermissionCodes]);

  const isDialogIndeterminate = useMemo(() => {
    return !isDialogAllChecked &&
      allDialogPermissionCodes.some(code => selectedPermissionCodes.includes(code));
  }, [allDialogPermissionCodes, selectedPermissionCodes, isDialogAllChecked]);

  const handleDialogSelectAll = () => {
    if (isDialogAllChecked || selectedPermissionCodes.some(code => allDialogPermissionCodes.includes(code))) {
      setSelectedPermissionCodes(prev =>
        prev.filter(code => !allDialogPermissionCodes.includes(code))
      );
    } else {
      setSelectedPermissionCodes(prev => {
        const set = new Set([...prev, ...allDialogPermissionCodes]);
        return Array.from(set);
      });
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Form controls
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
    setFormErrors({});
    setDialogFilters({ page: 1, limit: 10, code: '', name: '' });

    // Khởi tạo các state user
    setSelectedUserIds([]);
    setInitialSelectedUserIds([]);
    setActiveTab(0);
    setUserSearchQuery('');
    setUserPage(1);

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

    const currentCodes = (roleData.permissions || []).map((p: any) => p.code);
    setSelectedPermissionCodes(currentCodes);
    setFormErrors({});
    setDialogFilters({ page: 1, limit: 10, code: '', name: '' });

    // Tìm những user đang có vai trò này
    const roleKey = roleData.role;
    const roleKeyLower = String(roleKey || '').toLowerCase().trim();

    const currentRoleObj = roles.find(r => String(r.id) === String(roleData.id) || String(r.role) === roleKey);
    const roleNameLower = currentRoleObj ? String(currentRoleObj.name || '').toLowerCase().trim() : '';
    const roleIdStr = String(roleData.id).trim();

    const initialUsers = allUsers.filter((u: any) => {
      const isMainRole =
        Number(u.roleId) === roleData.id ||
        Number(u.role?.id) === roleData.id ||
        String(u.role?.role || '').toLowerCase().trim() === roleKeyLower ||
        String(u.role?.name || '').toLowerCase().trim() === roleNameLower;

      if (isMainRole) return true;

      const raw = u.allowedRoles;
      if (!raw) return false;

      let allowed: string[] = [];
      if (Array.isArray(raw)) {
        allowed = raw.map(String);
      } else if (typeof raw === 'string') {
        allowed = raw.split(',').map(s => s.trim()).filter(Boolean);
      }

      return allowed.some(r => {
        const rLower = String(r || '').toLowerCase().trim();
        return rLower === roleKeyLower || rLower === roleIdStr || rLower === roleNameLower;
      });
    }).map(u => String(u.id));

    setSelectedUserIds(initialUsers);
    setInitialSelectedUserIds(initialUsers);
    setActiveTab(0);
    setUserSearchQuery('');
    setUserPage(1);

    setDialogOpen(true);
  };

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

  // Checkbox Tree Actions inside Dialog Table
  const handleToggleGroup = (groupCode: string) => {
    const children = getComponentsForGroup(groupCode);
    const childCodes = children.map(c => c.code);

    const isAllChecked = childCodes.length > 0 && childCodes.every(code => selectedPermissionCodes.includes(code));

    if (isAllChecked) {
      setSelectedPermissionCodes(prev =>
        prev.filter(code => code !== groupCode && !childCodes.includes(code))
      );
    } else {
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
      setSelectedPermissionCodes(prev =>
        prev.filter(code => code !== compCode && code !== parentGroupCode)
      );
    } else {
      setSelectedPermissionCodes(prev => {
        const nextList = [...prev, compCode];
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

  // Delete validations
  const checkRoleHasUsers = (roleIdNum: number, roleKey: string): boolean => {
    return allUsers.some((u: any) => {
      const matchesRole = Number(u.roleId) === roleIdNum || Number(u.role?.id) === roleIdNum;
      if (matchesRole) return true;

      const raw = u.allowedRoles;
      if (!raw) return false;
      if (Array.isArray(raw)) return raw.map(String).includes(roleKey);
      if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).includes(roleKey);
      return false;
    });
  };

  const handleConfirmDelete = (roleData: any) => {
    if (roleData.id === 4 || roleData.role === 'superAdmin') {
      enqueueSnackbar('Không thể xóa vai trò superAdmin mặc định.', { variant: 'warning' });
      return;
    }

    if (checkRoleHasUsers(Number(roleData.id), roleData.role)) {
      enqueueSnackbar(`Không thể xóa vai trò "${roleData.name}" vì vai trò này đã có người dùng sở hữu.`, { variant: 'error' });
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
      fetchAllUsers();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Lỗi khi xóa vai trò';
      enqueueSnackbar(String(msg), { variant: 'error' });
      setLoading(false);
    }
  };

  // Bulk deletion
  const performBulkDelete = async () => {
    setConfirmBulkDeleteOpen(false);

    const rolesWithUsers: string[] = [];
    selectedIds.forEach(idStr => {
      const roleIdNum = Number(idStr);
      const roleObj = roles.find(r => r.id === roleIdNum);
      if (roleObj && checkRoleHasUsers(roleIdNum, roleObj.role)) {
        rolesWithUsers.push(roleObj.name);
      }
    });

    if (rolesWithUsers.length > 0) {
      enqueueSnackbar(
        `Không thể xóa vai trò: ${rolesWithUsers.join(', ')} vì các vai trò này đã có người dùng sở hữu.`,
        { variant: 'error' }
      );
      return;
    }

    try {
      setLoading(true);
      const idsToDelete = selectedIds.map(Number);
      await roleService.deleteMany(idsToDelete);
      enqueueSnackbar('Xóa các vai trò thành công', { variant: 'success' });
      setSelectedIds([]);
      fetchData();
      fetchAllUsers();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi xóa các vai trò';
      enqueueSnackbar(String(msg), { variant: 'error' });
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async () => {
    if (!validateForm()) return;

    // Ràng buộc: Mỗi tài khoản phải có ít nhất 1 vai trò hoạt động khi nhấn lưu
    if (isEditMode && selectedRoleId !== null) {
      const roleKey = formValues.role;
      const removedUserIds = initialSelectedUserIds.filter(id => !selectedUserIds.includes(id));

      const currentRoleObj = roles.find(r => String(r.id) === String(selectedRoleId) || String(r.role) === roleKey);
      const roleNameLower = currentRoleObj ? String(currentRoleObj.name || '').toLowerCase().trim() : '';
      const roleIdStr = String(selectedRoleId).trim();
      const roleKeyLower = String(roleKey || '').toLowerCase().trim();

      for (const userId of removedUserIds) {
        const u = allUsers.find(user => String(user.id) === userId);
        if (u) {
          const isMainRole =
            Number(u.roleId) === selectedRoleId ||
            Number(u.role?.id) === selectedRoleId ||
            String(u.role?.role || '').toLowerCase().trim() === roleKeyLower ||
            String(u.role?.name || '').toLowerCase().trim() === roleNameLower;

          if (isMainRole) {
            let allowed: string[] = [];
            if (Array.isArray(u.allowedRoles)) {
              allowed = [...u.allowedRoles.map(String)];
            } else if (typeof u.allowedRoles === 'string') {
              allowed = u.allowedRoles.split(',').map((s: string) => s.trim()).filter(Boolean);
            }

            const otherAllowedRoles = allowed.filter(r => {
              const rLower = String(r || '').toLowerCase().trim();
              return rLower !== roleKeyLower && rLower !== roleIdStr && rLower !== roleNameLower;
            });

            if (otherAllowedRoles.length === 0) {
              enqueueSnackbar(`Không thể lưu. Người dùng "${u.fullName || u.username}" phải sở hữu ít nhất 1 vai trò hoạt động.`, { variant: 'error' });
              return;
            }
          }
        }
      }
    }

    try {
      setLoading(true);
      const payload = {
        ...formValues,
        permissionCodes: selectedPermissionCodes
      };

      let currentRoleId = selectedRoleId;

      if (isEditMode && selectedRoleId !== null) {
        await roleService.update(selectedRoleId, payload);
        enqueueSnackbar('Cập nhật vai trò thành công', { variant: 'success' });
      } else {
        const createRes = await roleService.create(payload);
        enqueueSnackbar('Thêm mới vai trò thành công', { variant: 'success' });
        const createdRole = createRes?.data || createRes;
        currentRoleId = createdRole?.id || null;
      }

      // Cập nhật allowedRoles cho các user thay đổi
      const roleKey = formValues.role;
      const addedUserIds = selectedUserIds.filter(id => !initialSelectedUserIds.includes(id));
      const removedUserIds = initialSelectedUserIds.filter(id => !selectedUserIds.includes(id));

      const updatePromises = [];

      // Thêm vai trò cho user được tích chọn
      for (const userId of addedUserIds) {
        const userObj = allUsers.find(u => String(u.id) === userId);
        if (userObj) {
          let allowed: string[] = [];
          if (Array.isArray(userObj.allowedRoles)) {
            allowed = [...userObj.allowedRoles.map(String)];
          } else if (typeof userObj.allowedRoles === 'string') {
            allowed = userObj.allowedRoles.split(',').map((s: string) => s.trim()).filter(Boolean);
          }

          if (!allowed.includes(roleKey)) {
            allowed.push(roleKey);
            updatePromises.push(userService.update(userId, { allowedRoles: allowed }));
          }
        }
      }

      const currentRoleObj = roles.find(r => String(r.id) === String(currentRoleId) || String(r.role) === roleKey);
      const roleNameLower = currentRoleObj ? String(currentRoleObj.name || '').toLowerCase().trim() : '';
      const roleIdStr = String(currentRoleId).trim();
      const roleKeyLower = String(roleKey || '').toLowerCase().trim();

      // Gỡ vai trò cho user bị bỏ tích chọn
      for (const userId of removedUserIds) {
        const userObj = allUsers.find(u => String(u.id) === userId);
        if (userObj) {
          const isMainRole =
            Number(userObj.roleId) === currentRoleId ||
            Number(userObj.role?.id) === currentRoleId ||
            String(userObj.role?.role || '').toLowerCase().trim() === roleKeyLower ||
            String(userObj.role?.name || '').toLowerCase().trim() === roleNameLower;

          let allowed: string[] = [];
          if (Array.isArray(userObj.allowedRoles)) {
            allowed = [...userObj.allowedRoles.map(String)];
          } else if (typeof userObj.allowedRoles === 'string') {
            allowed = userObj.allowedRoles.split(',').map((s: string) => s.trim()).filter(Boolean);
          }

          const otherAllowedRoles = allowed.filter(r => {
            const rLower = String(r || '').toLowerCase().trim();
            return rLower !== roleKeyLower && rLower !== roleIdStr && rLower !== roleNameLower;
          });

          if (isMainRole) {
            // Ánh xạ các vai trò phụ còn lại sang các đối tượng vai trò trong roles
            const allowedRoleObjects = otherAllowedRoles.map(key => {
              return roles.find(r => {
                const rKey = String(r.role || '').toLowerCase().trim();
                const rName = String(r.name || '').toLowerCase().trim();
                const rId = String(r.id || '').trim();
                const targetKey = String(key || '').toLowerCase().trim();
                return rKey === targetKey || rName === targetKey || rId === targetKey;
              });
            }).filter(Boolean);

            // Tìm vai trò có số lượng thao tác (quyền hạn) nhiều nhất
            let bestRoleObj = null;
            let maxOps = -1;
            for (const rObj of allowedRoleObjects) {
              const opsCount = Array.isArray(rObj.permissions) ? rObj.permissions.length : 0;
              if (opsCount > maxOps) {
                maxOps = opsCount;
                bestRoleObj = rObj;
              }
            }

            if (bestRoleObj) {
              // Gỡ vai trò chính mới ra khỏi allowedRoles còn lại
              const bestRoleKeyLower = String(bestRoleObj.role || '').toLowerCase().trim();
              const bestRoleIdStr = String(bestRoleObj.id).trim();
              const bestRoleNameLower = String(bestRoleObj.name || '').toLowerCase().trim();

              const updatedAllowed = otherAllowedRoles.filter(r => {
                const rLower = String(r || '').toLowerCase().trim();
                return rLower !== bestRoleKeyLower && rLower !== bestRoleIdStr && rLower !== bestRoleNameLower;
              });

              updatePromises.push(userService.update(userId, {
                roleId: Number(bestRoleObj.id),
                realRole: bestRoleObj.name,
                allowedRoles: updatedAllowed
              }));
            } else {
              updatePromises.push(userService.update(userId, { allowedRoles: otherAllowedRoles }));
            }
          } else {
            // Chỉ xóa khỏi allowedRoles
            updatePromises.push(userService.update(userId, { allowedRoles: otherAllowedRoles }));
          }
        }
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      setDialogOpen(false);
      fetchData();
      fetchAllUsers();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu vai trò';
      enqueueSnackbar(String(msg), { variant: 'error' });
      setLoading(false);
    }
  };

  // Deny access for users other than testuser (placed below all hooks)
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

  const paginatedSelectableRoles = useMemo(() => {
    return paginatedRoles.filter(r => r.id !== 4 && r.role !== 'superAdmin');
  }, [paginatedRoles]);

  const isAllSelected = paginatedSelectableRoles.length > 0 && paginatedSelectableRoles.every(r => selectedIds.includes(String(r.id)));
  const isIndeterminate = !isAllSelected && paginatedSelectableRoles.some(r => selectedIds.includes(String(r.id)));

  return (
    <MainLayout>
      <Box className={classes.root}>
        <Box className={classes.pageHeader}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box>
              <Typography className={classes.headerTitle}>
                Danh sách vai trò
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            disableElevation
            onClick={handleOpenCreateDialog}
            className={classes.addBtn}
            startIcon={<AddIcon />}
          >
            Thêm mới
          </Button>
        </Box>

        <Box className={classes.mainContent}>
          <Box className={classes.card}>
            <Box className={classes.tableScroll}>
              {loading && roles.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress size={45} thickness={4} sx={{ color: '#2f65f0' }} />
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" className={classes.headerCell} width={50}>
                          <Checkbox
                            size="small"
                            checked={isAllSelected}
                            indeterminate={isIndeterminate}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell className={classes.headerCell} width={80}>Thao tác</TableCell>
                        <TableCell className={classes.headerCell} width={300}>Mã vai trò</TableCell>
                        <TableCell className={classes.headerCell}>Tên vai trò</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className={classes.filterCell} />
                        <TableCell className={classes.filterCell} />
                        <TableCell className={classes.filterCell}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Mã vai trò"
                            value={roleFilters.role}
                            onChange={(e) => handleRoleFilterChange("role", e.target.value)}
                            className={classes.filterField}
                          />
                        </TableCell>
                        <TableCell className={classes.filterCell}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Tên vai trò"
                            value={roleFilters.name}
                            onChange={(e) => handleRoleFilterChange("name", e.target.value)}
                            className={classes.filterField}
                          />
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRoles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                            Không có dữ liệu
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRoles.map((item) => {
                          const checked = selectedIds.includes(String(item.id));
                          const isSuperAdmin = item.id === 4 || item.role === 'superAdmin';
                          return (
                            <TableRow key={item.id} hover className={checked ? classes.rowSelected : ""}>
                              <TableCell padding="checkbox" className={classes.bodyCell}>
                                <Checkbox
                                  size="small"
                                  checked={checked}
                                  disabled={isSuperAdmin}
                                  onChange={() => handleSelectOne(String(item.id))}
                                />
                              </TableCell>
                              <TableCell className={classes.bodyCell} align="center">
                                <IconButton
                                  size="small"
                                  className={classes.actionIcon}
                                  onClick={() => handleOpenEditDialog(item)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                              <TableCell className={classes.bodyCell} sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {item.role}
                              </TableCell>
                              <TableCell className={classes.bodyCell} sx={{ fontWeight: 500, color: '#334155' }}>
                                {item.name}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {!loading && totalRoles > 0 && (
              <Box className={classes.footer}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Select
                    value={roleFilters.limit}
                    onChange={(e) => handleRoleFilterChange("limit", Number(e.target.value))}
                    className={classes.pageSizeSelect}
                    size="small"
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                  <Typography className={classes.pageInfo}>
                    {roleStartIndex} - {roleEndIndex} of {totalRoles}
                  </Typography>
                  <Pagination
                    count={Math.max(1, Math.ceil(totalRoles / roleFilters.limit))}
                    page={roleFilters.page}
                    onChange={(_, page) => handleRoleFilterChange("page", page)}
                    shape="rounded"
                    size="small"
                    siblingCount={0}
                    boundaryCount={1}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Floating Batch Selection Bar */}
      {selectedIds.length > 0 && (
        <BulkSelectionBar
          count={selectedIds.length}
          onDelete={() => setConfirmBulkDeleteOpen(true)}
          onClose={() => setSelectedIds([])}
        />
      )}

      {/* Bulk Delete Confirm dialog */}
      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} vai trò đã chọn? Thao tác này không thể hoàn tác.`}
        onCancel={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={performBulkDelete}
        confirmText="Xóa"
      />

      {/* Single Delete Confirm dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa vai trò "${roleToDelete?.name}" không? Hành động này không thể hoàn tác.`}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setRoleToDelete(null);
        }}
        onConfirm={handleDeleteRole}
        confirmText="Xóa"
      />

      {/* Create / Edit Dialog matching Ảnh 4 & Ảnh 5 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#1e293b' }}>
            {isEditMode ? 'Chỉnh sửa vai trò' : 'Thêm mới vai trò'}
          </Typography>
          <IconButton size="small" onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ pt: 5 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Mã vai trò *"
                  variant="outlined"
                  size="small"
                  value={formValues.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={isEditMode}
                  error={!!formErrors.role}
                  helperText={formErrors.role}
                  placeholder="Role1"
                  slotProps={{
                    inputLabel: { shrink: true }
                  }}
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
                  placeholder="Manager"
                  slotProps={{
                    inputLabel: { shrink: true }
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Tabs switch */}
          <Box sx={{ mt: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
              <Tab label="Quyền hạn" id="role-dialog-tab-0" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Người dùng sở hữu" id="role-dialog-tab-1" sx={{ textTransform: 'none', fontWeight: 600 }} />
            </Tabs>
          </Box>

          {/* Tab 1: Quyền hạn */}
          {activeTab === 0 && (
            <Box className={classes.card} sx={{ mt: 3, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <Box className={classes.tableScroll} sx={{ maxHeight: 350 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.headerCell} width={60} />
                      <TableCell padding="checkbox" className={classes.headerCell} width={60}>
                        <Checkbox
                          size="small"
                          checked={isDialogAllChecked}
                          indeterminate={isDialogIndeterminate}
                          onChange={handleDialogSelectAll}
                        />
                      </TableCell>
                      <TableCell className={classes.headerCell} width={300}>Mã quyền</TableCell>
                      <TableCell className={classes.headerCell}>Tên quyền</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className={classes.filterCell} />
                      <TableCell className={classes.filterCell} />
                      <TableCell className={classes.filterCell}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Tìm kiếm..."
                          value={dialogFilters.code}
                          onChange={(e) => handleDialogFilterChange("code", e.target.value)}
                          className={classes.filterField}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Tìm kiếm..."
                          value={dialogFilters.name}
                          onChange={(e) => handleDialogFilterChange("name", e.target.value)}
                          className={classes.filterField}
                        />
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dialogPaginatedGroups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      dialogPaginatedGroups.map((group) => {
                        const isExpanded = !!expandedGroups[group.code];
                        const children = getComponentsForGroup(group.code);
                        const childCodes = children.map(c => c.code);

                        const isGroupAllChecked = childCodes.length > 0 && childCodes.every(code => selectedPermissionCodes.includes(code));
                        const isGroupIndeterminate = !isGroupAllChecked && childCodes.some(code => selectedPermissionCodes.includes(code));

                        return (
                          <React.Fragment key={group.code}>
                            {/* Group Permission Row */}
                            <TableRow hover onClick={() => toggleGroup(group.code)} sx={{ cursor: 'pointer', bgcolor: '#fafafa' }}>
                              <TableCell className={classes.bodyCell} align="center" onClick={(e) => { e.stopPropagation(); toggleGroup(group.code); }}>
                                <IconButton size="small">
                                  {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                                </IconButton>
                              </TableCell>
                              <TableCell className={classes.bodyCell} padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  size="small"
                                  checked={isGroupAllChecked}
                                  indeterminate={isGroupIndeterminate}
                                  onChange={() => handleToggleGroup(group.code)}
                                />
                              </TableCell>
                              <TableCell className={classes.bodyCell} sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                                {group.code}
                              </TableCell>
                              <TableCell className={classes.bodyCell} sx={{ fontWeight: 600 }}>
                                {group.name}
                              </TableCell>
                            </TableRow>

                            {/* Component Permission Rows */}
                            {isExpanded && group.matchingComponents.map((comp: any) => {
                              const isCompChecked = selectedPermissionCodes.includes(comp.code);
                              return (
                                <TableRow key={comp.code} hover>
                                  <TableCell className={classes.bodyCell} />
                                  <TableCell className={classes.bodyCell} padding="checkbox">
                                    <Checkbox
                                      size="small"
                                      checked={isCompChecked}
                                      onChange={() => handleToggleComponent(comp.code, group.code)}
                                    />
                                  </TableCell>
                                  <TableCell className={classes.bodyCell} sx={{ pl: 4, fontFamily: 'monospace', color: '#334155' }}>
                                    {comp.code}
                                  </TableCell>
                                  <TableCell className={classes.bodyCell} sx={{ color: '#475569' }}>
                                    {comp.name}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Box>

              {dialogTotalCount > 0 && (
                <Box className={classes.footer}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Select
                      value={dialogFilters.limit}
                      onChange={(e) => handleDialogFilterChange("limit", Number(e.target.value))}
                      className={classes.pageSizeSelect}
                      size="small"
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                    <Typography className={classes.pageInfo}>
                      {dialogStartIndex} - {dialogEndIndex} of {dialogTotalCount}
                    </Typography>
                    <Pagination
                      count={Math.max(1, Math.ceil(dialogTotalCount / dialogFilters.limit))}
                      page={dialogFilters.page}
                      onChange={(_, page) => handleDialogFilterChange("page", page)}
                      shape="rounded"
                      size="small"
                      siblingCount={0}
                      boundaryCount={1}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Tab 2: Người dùng sở hữu */}
          {activeTab === 1 && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="Tìm kiếm người dùng theo họ tên hoặc tên đăng nhập..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setUserPage(1);
                  }}
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    }
                  }}
                  fullWidth
                />
              </Box>

              <Box className={classes.card} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <Box className={classes.tableScroll} sx={{ maxHeight: 350 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" className={classes.headerCell} width={60} />


                        <TableCell className={classes.headerCell}>Tên đăng nhập</TableCell>
                        <TableCell className={classes.headerCell}>Họ và tên</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedDialogUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                            Không tìm thấy người dùng phù hợp
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedDialogUsers.map((u: any) => {
                          const isChecked = selectedUserIds.includes(String(u.id));
                          return (
                            <TableRow key={u.id} hover>
                              <TableCell padding="checkbox" className={classes.bodyCell}>
                                <Checkbox
                                  size="small"
                                  checked={isChecked}
                                  onChange={() => {
                                    const idStr = String(u.id);
                                    setSelectedUserIds(prev =>
                                      prev.includes(idStr) ? prev.filter(id => id !== idStr) : [...prev, idStr]
                                    );
                                  }}
                                />
                              </TableCell>
                              <TableCell className={classes.bodyCell} sx={{ fontWeight: 600 }}>{u.username}</TableCell>
                              <TableCell className={classes.bodyCell}>{u.fullName}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </Box>

                {totalDialogUsers > 0 && (
                  <Box className={classes.footer}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 'auto' }}>
                      <Typography className={classes.pageInfo}>
                        {Math.min(totalDialogUsers, (userPage - 1) * userLimit + 1)} - {Math.min(totalDialogUsers, userPage * userLimit)} of {totalDialogUsers}
                      </Typography>
                      <Pagination
                        count={Math.max(1, Math.ceil(totalDialogUsers / userLimit))}
                        page={userPage}
                        onChange={(_, page) => setUserPage(page)}
                        shape="rounded"
                        size="small"
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderColor: '#cbd5e1',
              color: '#475569'
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveForm}
            variant="contained"
            disableElevation
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              bgcolor: '#2f65f0'
            }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};
