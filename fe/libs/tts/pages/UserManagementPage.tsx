"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Checkbox,
    Switch, IconButton, TextField, Select, MenuItem, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Pagination,
    Autocomplete
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Key as KeyIcon,
    Add as AddIcon,
    FileUpload as UploadIcon,
    FileDownload as DownloadIcon,
    Visibility,
    VisibilityOff,
    VisibilityOutlined as ViewIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';


import { BulkSelectionBar } from '@core/components/BulkSelectionBar';
import { ConfirmDialog } from '@core/components/ConfirmDialog';
import { useAuth } from '@core/contexts/AuthProvider';
import { userService } from '@tts/services/user.services';
import { roleService } from '@tts/services/role.services';
import { getCookie } from '@core/services/cookies';
import { UserPasswordDialog } from '@tts/components';
import { useUserListStyles } from '../logic/user/style';
import * as XLSX from 'xlsx';
import { InputAdornment } from '@mui/material';
import { validate, VALIDATION_MESSAGES } from '@core/utils/validation';

interface CustomPaginationProps {
  page: number;
  count: number;
  onChange: (newPage: number) => void;
  isZeroBased?: boolean;
}

const CustomPagination = ({ page, count, onChange, isZeroBased = false }: CustomPaginationProps) => {
  const currentPage = isZeroBased ? page + 1 : page;
  const [val, setVal] = React.useState(String(currentPage));

  React.useEffect(() => {
    setVal(String(currentPage));
  }, [currentPage]);

  const handlePageSubmit = () => {
    const p = parseInt(val, 10);
    if (!isNaN(p) && p >= 1 && p <= count) {
      onChange(isZeroBased ? p - 1 : p);
    } else {
      setVal(String(currentPage));
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <IconButton
        size="small"
        onClick={() => onChange(isZeroBased ? page - 1 : page - 1)}
        disabled={currentPage <= 1}
        sx={{ color: '#94a3b8', '&.Mui-disabled': { color: '#cbd5e1' }, p: '2px' }}
      >
        <ChevronLeftIcon sx={{ fontSize: '1.1rem' }} />
      </IconButton>
      <Box sx={{ width: '24px', height: '24px', backgroundColor: '#f1f3f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handlePageSubmit(); }}
          onBlur={handlePageSubmit}
          style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', padding: 0 }}
        />
      </Box>
      <IconButton
        size="small"
        onClick={() => onChange(isZeroBased ? page + 1 : page + 1)}
        disabled={currentPage >= count}
        sx={{ color: '#94a3b8', '&.Mui-disabled': { color: '#cbd5e1' }, p: '2px' }}
      >
        <ChevronRightIcon sx={{ fontSize: '1.1rem' }} />
      </IconButton>
    </Box>
  );
};

export const UserManagementPage = () => {
    const classes = useUserListStyles();
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        fullName: '',
        username: '',
        email: '',
        role: '',
        jobTitle: '',
        status: ''
    });

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmImportDeleteIndex, setConfirmImportDeleteIndex] = useState<number | null>(null);

    const [passwordModal, setPasswordModal] = useState({ open: false, userId: '', userName: '' });


    // State for Excel import preview
    const [importUsers, setImportUsers] = useState<any[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingImportIndex, setEditingImportIndex] = useState<number | null>(null);
    const [editImportForm, setEditImportForm] = useState<any>({
        fullName: '',
        username: '',
        email: '',
        password: '',
        realRole: '',
        roleId: undefined
    });
    const [editImportErrors, setEditImportErrors] = useState<Record<string, string>>({});
    const [showImportPassword, setShowImportPassword] = useState(false);

    const { user, login, logout } = useAuth();
    // Phân quyền: 0=VIEW (Nhân viên), 1=WRITE (Chuyên viên), 2=FULL (Admin/Lãnh đạo)
    // Chuyên viên được phép thêm/sửa mọi user trừ admin/testuser
    const getPermissionLevel = () => {
        if (!user) return 0;

        const roleId = (user as any)?.roleId || (user as any)?.role?.id;
        const realRole = ((user as any)?.realRole || '').toLowerCase();
        const roleName = ((user as any)?.role?.name || '').toLowerCase();

        // Ưu tiên nhận diện theo roleId và realRole
        // roleId = 4 hoặc có chữ "quản trị"/"admin"/"lãnh đạo"/"leader" -> FULL (2)
        const isAdminOrLeader =
            roleId === 4 ||
            realRole.includes('quản trị') ||
            realRole.includes('admin') ||
            realRole.includes('lãnh đạo') ||
            realRole.includes('leader');
        if (isAdminOrLeader) return 2;

        // roleId = 2 hoặc có chữ "chuyên viên"/"expert" -> WRITE (1)
        const isExpert =
            roleId === 2 ||
            roleName.includes('chuyên viên') ||
            roleName.includes('expert');

        if (isExpert) return 1;

        // roleId = 1 hoặc có chữ "nhân viên"/"employee" -> VIEW (0)
        // Không xác định được role cũng mặc định là VIEW
        return 0;
    };

    const userPermissions = useMemo(() => {
        if (!user) return [];
        if (user.username === 'testuser') {
            return ['ADMIN_C_USER_VIEW', 'ADMIN_C_USER_CREATE', 'ADMIN_C_USER_UPDATE', 'ADMIN_C_USER_DELETE'];
        }
        const currentUserRoleId = user.roleId || (user.role as any)?.id;
        const userRoleObj = roles.find((r: any) => Number(r.id) === Number(currentUserRoleId));
        return (userRoleObj?.permissions || []).map((p: any) => p.code);
    }, [user, roles]);

    const hasUserView = useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_VIEW');
        }
        return getPermissionLevel() >= 0;
    }, [user, roles, userPermissions]);

    const hasUserCreate = useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_CREATE');
        }
        return getPermissionLevel() >= 1;
    }, [user, roles, userPermissions]);

    const hasUserUpdate = useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_UPDATE');
        }
        return getPermissionLevel() >= 1;
    }, [user, roles, userPermissions]);

    // isReadOnly: true nếu chỉ có quyền xem (level 0)
    const isReadOnly = useMemo(() => {
        if (!user) return true;
        if (user.username === 'testuser') return false;
        if (roles.length > 0) {
            return !userPermissions.includes('ADMIN_C_USER_CREATE') && !userPermissions.includes('ADMIN_C_USER_UPDATE');
        }
        return getPermissionLevel() === 0;
    }, [user, roles, userPermissions]);

    // canDeleteOrChangeStatus: true nếu có quyền đầy đủ (level 2)
    const canDeleteOrChangeStatus = useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_DELETE');
        }
        return getPermissionLevel() === 2;
    }, [user, roles, userPermissions]);

    const hasUserDelete = useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_DELETE');
        }
        return getPermissionLevel() >= 2;
    }, [user, roles, userPermissions]);

    const canEditRole = useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_UPDATE');
        }
        const currentUserRoleId = user.roleId || (user.role as any)?.id;
        const userRoleObj = roles.find((r: any) => Number(r.id) === Number(currentUserRoleId));
        return !!userRoleObj?.permissions?.some((p: any) => p.code === 'ADMIN_C_USER_UPDATE');
    }, [user, roles, userPermissions]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [userRes, roleRes] = await Promise.all([
                userService.getUsers(filters),
                roleService.getAll()
            ]);
            setData(userRes.items || []);
            setTotal(userRes.count || 0);

            let roleList = [];
            if (Array.isArray(roleRes)) {
                roleList = roleRes;
            } else {
                roleList = roleRes?.data?.items || roleRes?.items || [];
            }
            roleList = roleList.filter((r: any) =>
                r.role !== 'enterprise' &&
                r.type !== 'DN' &&
                r.id !== 5 &&
                r.name !== 'Doanh nghiệp'
            );
            setRoles(roleList);
        } catch (error) {
            enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handleFilterChange = (field: string, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
            page: field === "page" ? value : 1,
        }));
        if (field !== "page" && field !== "limit") setSelectedIds([]);
    };

    const handleSelectAll = () => {
        const selectableUsers = data.filter((item: any) => item.username !== "testuser" && item.id !== user?.id);
        const allSelectableChecked = selectableUsers.length > 0 && selectableUsers.every((item: any) => selectedIds.includes(item.id));

        if (allSelectableChecked || selectedIds.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(selectableUsers.map((item: any) => item.id));
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleStatusChange = async (id: string, currentStatus: any) => {
        try {
            // Guard: Chỉ Admin/Lãnh đạo được đổi trạng thái
            if (!canDeleteOrChangeStatus) {
                enqueueSnackbar("Bạn không có quyền thay đổi trạng thái hoạt động của người dùng.", { variant: "error" });
                return;
            }
            const isCurrentlyActive = currentStatus === true;
            const nextStatus = !isCurrentlyActive;

            // Guard: testuser không được tắt trạng thái
            const targetUser = data.find((u) => u.id === id);
            if (targetUser?.username?.trim().toLowerCase() === 'testuser' && isCurrentlyActive) {
                enqueueSnackbar("Tài khoản admin testuser là tài khoản mặc định, không thể bị tắt trạng thái hoạt động.", { variant: "error" });
                return;
            }

            // Optimistic update
            setData((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, status: nextStatus } : item,
                ),
            );

            await userService.update(id, { status: nextStatus });

            // Synchronize with AuthProvider if the status change affects the current user
            if (user && String(user.id) === String(id)) {
                const updatedUser = { ...user, status: nextStatus };
                const token = getCookie('accessToken') || '';
                login(updatedUser as any, token, false);
            }

            enqueueSnackbar("Cập nhật trạng thái thành công", { variant: "success" });
        } catch (error) {
            enqueueSnackbar("Bạn không được phép thay đổi trạng thái người dùng", { variant: "error" });
            fetchData();
        }
    };

    const handleBulkDelete = () => {
        setConfirmDeleteOpen(true);
    };

    const performBulkDelete = async () => {
        try {
            // Guard: Chỉ Admin/Lãnh đạo được xóa
            if (!canDeleteOrChangeStatus) {
                enqueueSnackbar("Bạn không có quyền xóa người dùng.", { variant: "error" });
                setConfirmDeleteOpen(false);
                return;
            }
            setLoading(true);
            await userService.deleteMany(selectedIds);

            // Log out if the current user is among the deleted users
            if (user && selectedIds.includes(String(user.id))) {
                enqueueSnackbar("Tài khoản của bạn đã bị xóa. Đang đăng xuất...", { variant: "info" });
                setTimeout(() => logout(), 2000);
                return;
            }

            enqueueSnackbar("Xoá thành công", { variant: "success" });
            setSelectedIds([]);
            setConfirmDeleteOpen(false);
            fetchData();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || "Chuyên viên không được phép xóa người dùng";
            enqueueSnackbar(String(errorMsg), { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) {
            enqueueSnackbar('Không có dữ liệu để xuất!', { variant: 'error' });
            return;
        }

        const dataToExport = data.map((user: any, index: number) => ({
            "STT": index + 1,
            "Họ và tên": user.fullName || user.name || '',
            "Tên đăng nhập": user.username || '',
            "Email": user.email || '',
            "Vai trò": user.realRole || 'Chưa phân quyền',
            "Chức danh": user.workUnit || '-',
            "Trạng thái": user.status === true ? 'Hoạt động' : 'Đã khóa'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        worksheet['!cols'] = [
            { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachNguoiDung");
        XLSX.writeFile(workbook, "Danh_sach_nguoi_dung.xlsx");
        enqueueSnackbar('Xuất file Excel thành công!', { variant: 'success' });
    };

    const validateRow = (row: any) => {
        const errors: Record<string, string> = {};
        if (!row.username || row.username.trim() === '') {
            errors.username = 'Tên đăng nhập không được để trống';
        } else {
            const usernamePattern = /^[a-zA-Z0-9_.-]{3,50}$/;
            if (!usernamePattern.test(row.username)) {
                errors.username = 'Yêu cầu 3-50 ký tự (chữ không dấu, số, ., _, -)';
            }
        }

        if (row.email && row.email.trim() !== '') {
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(row.email)) {
                errors.email = 'Email không hợp lệ';
            }
        }

        if (row.password && row.password.trim() !== '') {
            if (row.password.length < 6) {
                errors.password = 'Mật khẩu phải từ 6 ký tự';
            }
        }

        if (!row.realRole || row.realRole.trim() === '') {
            errors.realRole = 'Vai trò là bắt buộc';
        } else {
            const roleNames = roles.map(r => r.name.trim());
            if (!roleNames.includes(row.realRole.trim())) {
                errors.realRole = 'Vai trò không hợp lệ';
            }
        }
        return errors;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws);

                const formattedData = rawData.map((item: any) => {
                    const fullName = (item['Họ và tên'] || '').toString().trim();
                    const username = (item['Tên đăng nhập'] || '').toString().trim();
                    const email = (item['Email'] || '').toString().trim();
                    const password = (item['Mật khẩu'] || '').toString().trim() || '12345678';
                    const rawRole = (item['Vai trò'] || '').toString().trim();

                    let realRole = '';
                    let roleId: number | undefined = undefined;

                    const roleClean = rawRole.toLowerCase();
                    const matchedRole = roles.find(r =>
                        r.name.toLowerCase().includes(roleClean) ||
                        roleClean.includes(r.name.toLowerCase()) ||
                        (r.role && r.role.toLowerCase() === roleClean)
                    );

                    if (matchedRole) {
                        realRole = matchedRole.name;
                        roleId = matchedRole.id;
                    } else {
                        realRole = rawRole;
                    }

                    return { fullName, username, email, password, realRole, roleId };
                }).filter((u: any) => u.username || u.fullName || u.email || u.realRole);

                if (formattedData.length === 0) {
                    enqueueSnackbar('File Excel trống hoặc không có thông tin hợp lệ!', { variant: 'error' });
                    return;
                }

                setImportUsers(formattedData);
                setIsPreviewOpen(true);
            } catch (error) {
                enqueueSnackbar('Lỗi khi xử lý file', { variant: 'error' });
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleStartEditImport = (index: number, item: any) => {
        setEditingImportIndex(index);
        setEditImportForm({ ...item });
        setEditImportErrors(validateRow(item));
    };

    const handleEditImportChange = (field: string, value: any) => {
        const updated = { ...editImportForm, [field]: value };
        if (field === 'realRole') {
            const matched = roles.find(r => r.name === value);
            updated.roleId = matched?.id;
        }
        setEditImportForm(updated);
        setEditImportErrors(validateRow(updated));
    };

    const handleSaveEditImport = (index: number) => {
        const errors = validateRow(editImportForm);
        if (Object.keys(errors).length > 0) {
            setEditImportErrors(errors);
            enqueueSnackbar('Vui lòng sửa các thông tin chưa hợp lệ!', { variant: 'error' });
            return;
        }
        setImportUsers(prev => {
            const updated = [...prev];
            updated[index] = editImportForm;
            return updated;
        });
        setEditingImportIndex(null);
    };

    const handleCancelEditImport = () => {
        setEditingImportIndex(null);
        setEditImportErrors({});
    };

    const handleDeleteImportRow = (index: number) => {
        setImportUsers(prev => prev.filter((_, idx) => idx !== index));
        if (editingImportIndex === index) {
            setEditingImportIndex(null);
        } else if (editingImportIndex !== null && editingImportIndex > index) {
            setEditingImportIndex(editingImportIndex - 1);
        }
    };

    const handleCancelImport = () => {
        setIsPreviewOpen(false);
        setImportUsers([]);
        setEditingImportIndex(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleConfirmImport = async () => {
        if (editingImportIndex !== null) {
            enqueueSnackbar('Vui lòng lưu thay đổi đang chỉnh sửa trước khi xác nhận!', { variant: 'warning' });
            return;
        }

        let hasAnyError = false;
        for (const item of importUsers) {
            if (Object.keys(validateRow(item)).length > 0) {
                hasAnyError = true;
                break;
            }
        }
        if (hasAnyError) {
            enqueueSnackbar('Vui lòng sửa hoặc xóa các dòng bị lỗi trước khi xác nhận!', { variant: 'error' });
            return;
        }

        try {
            setLoading(true);
            const dataToImport = importUsers.map(u => ({
                fullName: u.fullName,
                username: u.username,
                email: u.email,
                password: u.password,
                realRole: u.realRole,
                roleId: u.roleId
            }));
            const response = await userService.import(dataToImport);
            const successCount = response.success || 0;
            const errorCount = response.err || 0;

            if (errorCount > 0) {
                enqueueSnackbar(`Nhập thành công ${successCount} dòng. Thất bại ${errorCount} dòng (Trùng lặp).`, { variant: 'warning' });
            } else {
                enqueueSnackbar(`Nhập thành công ${successCount} tài khoản!`, { variant: 'success' });
            }
            setIsPreviewOpen(false);
            setImportUsers([]);
            fetchData();
        } catch (error) {
            enqueueSnackbar('Lỗi khi lưu dữ liệu vào cơ sở dữ liệu', { variant: 'error' });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };


    const startIndex = useMemo(
        () => (total === 0 ? 0 : filters.limit * (filters.page - 1) + 1),
        [filters, total],
    );
    const endIndex = useMemo(
        () => Math.min(filters.limit * filters.page, total),
        [filters, total],
    );

    const selectableUsers = useMemo(() => {
        return data.filter((item: any) => item.username !== "testuser" && item.id !== user?.id);
    }, [data, user?.id]);

    const isAllSelected = selectableUsers.length > 0 && selectableUsers.every((item: any) => selectedIds.includes(item.id));
    const isIndeterminate = !isAllSelected && selectableUsers.some((item: any) => selectedIds.includes(item.id));

    // Cấu hình các cột của bảng để dễ dàng chỉnh sửa độ rộng và thuộc tính
    const columns = [
        { id: 'fullName', label: 'Họ và tên', width: '18%', minWidth: 150 },
        { id: 'username', label: 'Tài khoản', width: '15%', minWidth: 120 },
        { id: 'email', label: 'Email', width: '20%', minWidth: 180 },
        { id: 'realRole', label: 'Vai trò', width: '15%', minWidth: 130 },
        { id: 'workUnit', label: 'Chức danh', width: '15%', minWidth: 130 },
        { id: 'status', label: 'Trạng thái', width: '10%', minWidth: 100, align: 'center' as const },
    ];

    if (roles.length > 0 && !hasUserView) {
        return (
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
                    Tài khoản của bạn không được cấp quyền xem danh sách người dùng. Vui lòng liên hệ quản trị viên.
                </Typography>
            </Box>
        );
    }

    return (
        <Box className={classes.root}>
            <input
                type="file"
                hidden
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
            />
            <Box className={classes.pageHeader}>
                <Typography className={classes.headerTitle}>
                    Danh sách người dùng
                </Typography>
                <Box className={classes.actions}>
                    {hasUserCreate && (
                        <>
                            <Button
                                className={classes.importBtn}
                                startIcon={<UploadIcon fontSize="small" />}
                                disableRipple
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Thêm từ file
                            </Button>
                            <Button
                                variant="contained"
                                className={classes.addBtn}
                                startIcon={<AddIcon fontSize="small" />}
                                onClick={() => router.push("/users/create")}
                            >
                                Thêm mới
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            <Box className={classes.mainContent} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <Box className={classes.card} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <Box className={classes.tableScroll} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox" className={classes.headerCell} width={50}>
                                            {hasUserDelete && (
                                                <Checkbox
                                                    size="small"
                                                    indeterminate={isIndeterminate}
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAll}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className={classes.headerCell} width={100}>Thao tác</TableCell>
                                        {columns.map((col) => (
                                            <TableCell
                                                key={col.id}
                                                className={classes.headerCell}
                                                align={col.align}
                                                sx={{ width: col.width, minWidth: col.minWidth }}
                                            >
                                                {col.label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className={classes.filterCell} />
                                        <TableCell className={classes.filterCell} />
                                        <TableCell className={classes.filterCell}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Tìm kiếm..."
                                                className={classes.filterField}
                                                value={filters.fullName}
                                                onChange={(e) => handleFilterChange("fullName", e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className={classes.filterCell}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Tìm kiếm..."
                                                className={classes.filterField}
                                                value={filters.username}
                                                onChange={(e) => handleFilterChange("username", e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className={classes.filterCell}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Tìm kiếm..."
                                                className={classes.filterField}
                                                value={filters.email}
                                                onChange={(e) => handleFilterChange("email", e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className={classes.filterCell}>
                                            <Autocomplete
                                                size="small"
                                                options={roles}
                                                getOptionLabel={(option) => option.name || ""}
                                                value={roles.find((r) => r.name === filters.role) || null}
                                                onChange={(_, newValue) => handleFilterChange("role", newValue?.name || "")}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Tất cả"
                                                        className={classes.filterField}
                                                    />
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell className={classes.filterCell}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                className={classes.filterField}
                                                placeholder="Tìm kiếm..."
                                                value={filters.jobTitle}
                                                onChange={(e) => handleFilterChange("jobTitle", e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className={classes.filterCell}>
                                            <Autocomplete
                                                size="small"
                                                options={[
                                                    { label: 'Hoạt động', value: 'true' },
                                                    { label: 'Đã khóa', value: 'false' }
                                                ]}
                                                getOptionLabel={(option) => option.label || ""}
                                                value={[
                                                    { label: 'Hoạt động', value: 'true' },
                                                    { label: 'Đã khóa', value: 'false' }
                                                ].find((o) => o.value === filters.status) || null}
                                                onChange={(_, newValue) => handleFilterChange("status", newValue?.value || "")}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Tất cả"
                                                        className={classes.filterField}
                                                    />
                                                )}
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                                                <CircularProgress size={22} />
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                                                Không có dữ liệu
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((item) => {
                                            const checked = selectedIds.includes(item.id);
                                            return (
                                                <TableRow
                                                    key={item.id}
                                                    hover
                                                    className={checked ? classes.rowSelected : ""}
                                                >
                                                    <TableCell padding="checkbox" className={classes.bodyCell}>
                                                        {hasUserDelete && (
                                                            <Checkbox
                                                                size="small"
                                                                checked={checked}
                                                                onChange={() => handleSelectOne(item.id)}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className={classes.bodyCell}>
                                                        <Box sx={{ display: "flex", gap: 0.25 }}>
                                                            {!hasUserUpdate ? (
                                                                <Tooltip title="Xem chi tiết">
                                                                    <IconButton
                                                                        size="small"
                                                                        className={classes.actionIcon}
                                                                        onClick={() => router.push(`/users/${item.id}`)}
                                                                    >
                                                                        <ViewIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            ) : (
                                                                <>
                                                                    <Tooltip title="Chỉnh sửa">
                                                                        <IconButton
                                                                            size="small"
                                                                            className={classes.actionIcon}
                                                                            onClick={() => router.push(`/users/${item.id}`)}
                                                                        >
                                                                            <EditIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Cập lại mật khẩu">
                                                                        <IconButton
                                                                            size="small"
                                                                            className={classes.actionIcon}
                                                                            onClick={() =>
                                                                                setPasswordModal({
                                                                                    open: true,
                                                                                    userId: item.id,
                                                                                    userName: item.fullName || item.username
                                                                                })
                                                                            }
                                                                        >
                                                                            <KeyIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell className={classes.bodyCell}>{item.fullName || item.name || '--'}</TableCell>
                                                    <TableCell className={classes.bodyCell}>{item.username || '--'}</TableCell>
                                                    <TableCell className={classes.bodyCell}>{item.email || '--'}</TableCell>
                                                    <TableCell className={classes.bodyCell}>{item.realRole || 'Chưa phân quyền'}</TableCell>
                                                    <TableCell className={classes.bodyCell}>{item.workUnit || '-'}</TableCell>
                                                    <TableCell className={classes.bodyCell} align="center">
                                                        <Switch
                                                            size="small"
                                                            disabled={!canDeleteOrChangeStatus}
                                                            checked={item.status === true}
                                                            onChange={() => handleStatusChange(item.id, item.status)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    <Box className={classes.footer}>
                        <Button
                            size="small"
                            startIcon={<DownloadIcon fontSize="small" />}
                            className={classes.actionIcon}
                            sx={{ mr: 'auto', textTransform: 'none', fontWeight: 500 }}
                            disableRipple
                            onClick={handleExportExcel}
                        >
                            Export Data
                        </Button>
                        <Select
                            size="small"
                            value={filters.limit}
                            onChange={(e) => handleFilterChange("limit", Number(e.target.value))}
                            className={classes.pageSizeSelect}
                        >
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={20}>20</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                        </Select>
                        <Typography className={classes.pageInfo}>
                            {startIndex} - {endIndex} of {total}
                        </Typography>
                        <CustomPagination
                            count={Math.max(1, Math.ceil(total / filters.limit))}
                            page={filters.page}
                            onChange={(page) => handleFilterChange("page", page)}
                        />
                    </Box>
                </Box>
            </Box>

            {hasUserDelete && (
                <BulkSelectionBar
                    count={selectedIds.length}
                    onDelete={handleBulkDelete}
                    onClose={() => setSelectedIds([])}
                />
            )}

            <ConfirmDialog
                open={confirmDeleteOpen}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} người dùng đã chọn? Thao tác này không thể hoàn tác.`}
                onCancel={() => setConfirmDeleteOpen(false)}
                onConfirm={performBulkDelete}
                confirmText="Xóa"
            />

            <UserPasswordDialog
                open={passwordModal.open}
                onClose={() => setPasswordModal({ ...passwordModal, open: false })}
                userId={passwordModal.userId}
                userName={passwordModal.userName}
            />

            {/* Import Excel Preview Dialog */}
            <Dialog
                open={isPreviewOpen}
                onClose={handleCancelImport}
                maxWidth="md"
                fullWidth
                sx={{ '& .MuiDialog-paper': { borderRadius: '10px' } }}
            >
                <DialogTitle sx={{ bgcolor: '#2f65f0', color: 'white', fontWeight: 700, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Xác nhận danh sách người dùng nhập từ file</Typography>
                    <IconButton size="small" onClick={handleCancelImport} sx={{ color: 'white' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: '20px !important', pb: 2 }}>
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: '4px', borderLeft: '4px solid #3b82f6' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                            Vui lòng kiểm tra kỹ danh sách tài khoản trước khi nhập vào cơ sở dữ liệu.
                            Click nút <strong>Sửa</strong> (hoặc nhấn biểu tượng cây bút) để cập nhật thông tin inline, click <strong>Xóa</strong> để loại bỏ dòng.
                            Các trường lỗi sẽ được đánh dấu cảnh báo màu đỏ.
                        </Typography>
                    </Box>
                    <TableContainer sx={{ maxHeight: 380, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }} width={60}>STT</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Họ và tên</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Tên đăng nhập *</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Vai trò *</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Mật khẩu</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }} align="center" width={110}>Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {importUsers.map((item, index) => {
                                    const errors = validateRow(item);
                                    const hasError = Object.keys(errors).length > 0;
                                    const isEditing = editingImportIndex === index;

                                    return (
                                        <TableRow key={index} sx={{ bgcolor: hasError ? '#fff5f5' : 'inherit', '&:hover': { bgcolor: hasError ? '#fee2e2' : '#f8fafc' } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <TextField
                                                        size="small"
                                                        value={editImportForm.fullName}
                                                        onChange={(e) => handleEditImportChange('fullName', e.target.value)}
                                                        fullWidth
                                                        variant="outlined"
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                                    />
                                                ) : (
                                                    item.fullName || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>--</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <TextField
                                                        size="small"
                                                        value={editImportForm.username}
                                                        error={!!editImportErrors.username}
                                                        helperText={editImportErrors.username}
                                                        onChange={(e) => handleEditImportChange('username', e.target.value)}
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                                    />
                                                ) : (
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, color: !item.username ? '#ef4444' : 'inherit' }}>
                                                            {item.username || 'Trống'}
                                                        </Typography>
                                                        {errors.username && (
                                                            <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                                {errors.username}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <TextField
                                                        size="small"
                                                        value={editImportForm.email}
                                                        error={!!editImportErrors.email}
                                                        helperText={editImportErrors.email}
                                                        onChange={(e) => handleEditImportChange('email', e.target.value)}
                                                        fullWidth
                                                        variant="outlined"
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                                    />
                                                ) : (
                                                    <Box>
                                                        <Typography variant="body2">{item.email || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>--</span>}</Typography>
                                                        {errors.email && (
                                                            <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                                {errors.email}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Select
                                                        size="small"
                                                        fullWidth
                                                        value={editImportForm.realRole || ''}
                                                        onChange={(e) => handleEditImportChange('realRole', e.target.value)}
                                                        variant="outlined"
                                                        sx={{ borderRadius: '4px' }}
                                                        disabled={!canEditRole}
                                                    >
                                                        <MenuItem value="Nhân viên">Nhân viên</MenuItem>
                                                        <MenuItem value="Chuyên viên">Chuyên viên</MenuItem>
                                                        <MenuItem value="Lãnh đạo">Lãnh đạo</MenuItem>
                                                        <MenuItem value="Quản trị viên">Quản trị viên</MenuItem>
                                                    </Select>
                                                ) : (
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, color: !item.realRole ? '#ef4444' : 'inherit' }}>
                                                            {item.realRole || 'Trống'}
                                                        </Typography>
                                                        {errors.realRole && (
                                                            <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                                {errors.realRole}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <TextField
                                                        size="small"
                                                        value={editImportForm.password}
                                                        error={!!editImportErrors.password}
                                                        helperText={editImportErrors.password}
                                                        onChange={(e) => handleEditImportChange('password', e.target.value)}
                                                        fullWidth
                                                        variant="outlined"
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                                    />
                                                ) : (
                                                    <Box>
                                                        <Typography variant="body2">{item.password || '12345678'}</Typography>
                                                        {errors.password && (
                                                            <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                                {errors.password}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {isEditing ? (
                                                    <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                                                        <Tooltip title="Lưu">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() => handleSaveEditImport(index)}
                                                            >
                                                                <SaveIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Hủy">
                                                            <IconButton
                                                                size="small"
                                                                color="warning"
                                                                onClick={handleCancelEditImport}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                                                        <Tooltip title="Sửa">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleStartEditImport(index, item)}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Xóa">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteImportRow(index)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: '1px solid #e2e8f0' }}>
                    <Button
                        onClick={handleCancelImport}
                        sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
                        disabled={loading}
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={handleConfirmImport}
                        variant="contained"
                        disableElevation
                        disabled={loading || importUsers.length === 0 || importUsers.some(item => Object.keys(validateRow(item)).length > 0)}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon fontSize="small" />}
                        sx={{ textTransform: 'none', bgcolor: '#2f65f0', fontWeight: 600, borderRadius: '4px' }}
                    >
                        Xác nhận nhập ({importUsers.length})
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Import Excel Preview Dialog */}
            <Dialog
                open={isPreviewOpen}
                onClose={handleCancelImport}
                maxWidth="md"
                fullWidth
                sx={{ '& .MuiDialog-paper': { borderRadius: '10px' } }}
            >
                <DialogTitle sx={{ bgcolor: '#2f65f0', color: 'white', fontWeight: 700, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Xác nhận danh sách người dùng nhập từ file</Typography>
                    <IconButton size="small" onClick={handleCancelImport} sx={{ color: 'white' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: '20px !important', pb: 2 }}>
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: '4px', borderLeft: '4px solid #3b82f6' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                            Vui lòng kiểm tra kỹ danh sách tài khoản trước khi nhập vào cơ sở dữ liệu.
                            Click nút <strong>Sửa</strong> (hoặc nhấn biểu tượng cây bút) để cập nhật thông tin inline, click <strong>Xóa</strong> để loại bỏ dòng.
                            Các trường lỗi sẽ được đánh dấu cảnh báo màu đỏ.
                        </Typography>
                    </Box>
                    <TableContainer sx={{ maxHeight: 380, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }} width={60}>STT</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Họ và tên</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Tên đăng nhập *</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Vai trò *</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }}>Mật khẩu</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }} align="center" width={110}>Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {importUsers.map((item, index) => {
                                    const errors = validateRow(item);
                                    const hasError = Object.keys(errors).length > 0;
                                    const isEditing = editingImportIndex === index;

                                    return (
                                        <TableRow key={index} sx={{ bgcolor: hasError ? '#fff5f5' : 'inherit', '&:hover': { bgcolor: hasError ? '#fee2e2' : '#f8fafc' } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <TextField
                                                        size="small"
                                                        value={editImportForm.fullName}
                                                        onChange={(e) => handleEditImportChange('fullName', e.target.value)}
                                                        fullWidth
                                                        variant="outlined"
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                                    />
                                                ) : (
                                                    item.fullName || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>--</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <TextField
                                                        size="small"
                                                        value={editImportForm.username}
                                                        error={!!editImportErrors.username}
                                                        helperText={editImportErrors.username}
                                                        onChange={(e) => handleEditImportChange('username', e.target.value)}
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                                    />
                                                ) : (
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, color: !item.username ? '#ef4444' : 'inherit' }}>
                                                            {item.username || 'Trống'}
                                                        </Typography>
                                                        {errors.username && (
                                                            <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                                {errors.username}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <TextField
                                                        size="small"
                                                        value={editImportForm.email}
                                                        error={!!editImportErrors.email}
                                                        helperText={editImportErrors.email}
                                                        onChange={(e) => handleEditImportChange('email', e.target.value)}
                                                        fullWidth
                                                        variant="outlined"
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                                    />
                                                ) : (
                                                    <Box>
                                                        <Typography variant="body2">{item.email || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>--</span>}</Typography>
                                                        {errors.email && (
                                                            <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                                {errors.email}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Select
                                                        size="small"
                                                        fullWidth
                                                        value={editImportForm.realRole || ''}
                                                        onChange={(e) => handleEditImportChange('realRole', e.target.value)}
                                                        variant="outlined"
                                                        sx={{ borderRadius: '4px' }}
                                                        disabled={!canEditRole}
                                                    >
                                                        {roles.map((r) => (
                                                            <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                ) : (
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, color: !item.realRole ? '#ef4444' : 'inherit' }}>
                                                            {item.realRole || 'Trống'}
                                                        </Typography>
                                                        {errors.realRole && (
                                                            <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                                {errors.realRole}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <TextField
                                                        size="small"
                                                        value={editImportForm.password}
                                                        error={!!editImportErrors.password}
                                                        helperText={editImportErrors.password}
                                                        onChange={(e) => handleEditImportChange('password', e.target.value)}
                                                        fullWidth
                                                        variant="outlined"
                                                        type={showImportPassword ? 'text' : 'password'}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                                        slotProps={{
                                                            input: {
                                                                endAdornment: (
                                                                    <InputAdornment position="end">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => setShowImportPassword(!showImportPassword)}
                                                                            edge="end"
                                                                        >
                                                                            {showImportPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                                        </IconButton>
                                                                    </InputAdornment>
                                                                )
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Box>
                                                        <Typography variant="body2">{item.password || '12345678'}</Typography>
                                                        {errors.password && (
                                                            <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                                {errors.password}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {isEditing ? (
                                                    <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                                                        <Tooltip title="Lưu">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() => handleSaveEditImport(index)}
                                                            >
                                                                <SaveIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Hủy">
                                                            <IconButton
                                                                size="small"
                                                                color="warning"
                                                                onClick={handleCancelEditImport}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                                                        <Tooltip title="Sửa">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleStartEditImport(index, item)}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Xóa">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteImportRow(index)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: '1px solid #e2e8f0' }}>
                    <Button
                        onClick={handleCancelImport}
                        sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
                        disabled={loading}
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={handleConfirmImport}
                        variant="contained"
                        disableElevation
                        disabled={loading || importUsers.length === 0 || importUsers.some(item => Object.keys(validateRow(item)).length > 0)}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon fontSize="small" />}
                        sx={{ textTransform: 'none', bgcolor: '#2f65f0', fontWeight: 600, borderRadius: '4px' }}
                    >
                        Xác nhận nhập ({importUsers.length})
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
