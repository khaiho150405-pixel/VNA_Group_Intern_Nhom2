"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Checkbox, InputAdornment, Switch, IconButton, Autocomplete,
    TextField, Select, MenuItem, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Pagination
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
    Visibility, VisibilityOff,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

import { MainLayout } from '@core/layouts/MainLayout';
import { BulkSelectionBar } from '@core/components/BulkSelectionBar';
import { userService } from '@tts/services/user.services';
import { UserPasswordDialog } from '@tts/components';
import { useUserListStyles } from '../logic/user/style';
import * as XLSX from 'xlsx';

export const UserManagementPage = () => {
    const classes = useUserListStyles();
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
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

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await userService.getUsers(filters);
            setData(res.items || []);
            setTotal(res.count || 0);
        } catch (error) {
            enqueueSnackbar("Lỗi khi tải dữ liệu người dùng", { variant: "error" });
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
            page: field === "page" || field === "limit" ? prev.page : 1,
        }));
        if (field !== "page" && field !== "limit") setSelectedIds([]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(data.map((d) => d.id));
        else setSelectedIds([]);
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleStatusChange = async (id: string, currentStatus: any) => {
        try {
            // Support both boolean and string "false"
            const isCurrentlyActive = currentStatus === false || currentStatus === null || currentStatus === undefined || currentStatus === "false";
            const nextStatus = isCurrentlyActive ? true : false;

            // Optimistic update
            setData((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, status: nextStatus } : item,
                ),
            );

            await userService.update(id, { status: nextStatus });
            enqueueSnackbar("Cập nhật trạng thái thành công", { variant: "success" });
        } catch (error) {
            enqueueSnackbar("Lỗi khi cập nhật trạng thái", { variant: "error" });
            fetchData();
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} người dùng đã chọn?`)) {
            try {
                await userService.deleteMany(selectedIds);
                enqueueSnackbar("Xoá thành công", { variant: "success" });
                setSelectedIds([]);
                fetchData();
            } catch (error) {
                enqueueSnackbar("Lỗi khi xoá dữ liệu", { variant: "error" });
            }
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
            "Trạng thái": (user.status === false || user.status === null || user.status === undefined) ? 'Hoạt động' : 'Đã khóa'
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
            const validRoles = ['Nhân viên', 'Chuyên viên', 'Lãnh đạo', 'Quản trị viên'];
            if (!validRoles.includes(row.realRole.trim())) {
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
                    if (roleClean.includes('nhân viên') || roleClean.includes('nhan vien')) {
                        realRole = 'Nhân viên';
                        roleId = 1;
                    } else if (roleClean.includes('chuyên viên') || roleClean.includes('chuyen vien')) {
                        realRole = 'Chuyên viên';
                        roleId = 2;
                    } else if (roleClean.includes('lãnh đạo') || roleClean.includes('lanh dao')) {
                        realRole = 'Lãnh đạo';
                        roleId = 3;
                    } else if (roleClean.includes('quản trị') || roleClean.includes('quan tri') || roleClean.includes('admin')) {
                        realRole = 'Quản trị viên';
                        roleId = 4;
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
            const roleMap: Record<string, number> = {
                'Nhân viên': 1,
                'Chuyên viên': 2,
                'Lãnh đạo': 3,
                'Quản trị viên': 4,
            };
            updated.roleId = roleMap[value];
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

    const isAllSelected = data.length > 0 && selectedIds.length === data.length;
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < data.length;

    return (
        <MainLayout>
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
                    </Box>
                </Box>

                <Box className={classes.mainContent}>
                    <Box className={classes.card}>
                        <Box className={classes.tableScroll}>
                            <TableContainer>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox" className={classes.headerCell}>
                                                <Checkbox
                                                    size="small"
                                                    indeterminate={isIndeterminate}
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAll}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.headerCell}>Thao tác</TableCell>
                                            <TableCell className={classes.headerCell}>Họ và tên</TableCell>
                                            <TableCell className={classes.headerCell}>Tài khoản</TableCell>
                                            <TableCell className={classes.headerCell}>Email</TableCell>
                                            <TableCell className={classes.headerCell}>Vai trò</TableCell>
                                            <TableCell className={classes.headerCell}>Chức danh</TableCell>
                                            <TableCell className={classes.headerCell} align="center">Trạng thái</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className={classes.filterCell} />
                                            <TableCell className={classes.filterCell} />
                                            <TableCell className={classes.filterCell}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    className={classes.filterField}
                                                    value={filters.fullName}
                                                    onChange={(e) => handleFilterChange("fullName", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    className={classes.filterField}
                                                    value={filters.username}
                                                    onChange={(e) => handleFilterChange("username", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    className={classes.filterField}
                                                    value={filters.email}
                                                    onChange={(e) => handleFilterChange("email", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <Autocomplete
                                                    size="small"
                                                    options={[
                                                        { label: "Chuyên viên", value: "Chuyên viên" },
                                                        { label: "Lãnh đạo", value: "Lãnh đạo" },
                                                        { label: "Nhân viên", value: "Nhân viên" }
                                                    ]}
                                                    getOptionLabel={(option) => option.label}
                                                    value={[
                                                        { label: "Chuyên viên", value: "Chuyên viên" },
                                                        { label: "Lãnh đạo", value: "Lãnh đạo" },
                                                        { label: "Nhân viên", value: "Nhân viên" }
                                                    ].find(r => r.value === filters.role) || null}
                                                    onChange={(_, newValue) =>
                                                        handleFilterChange("role", newValue?.value || "")
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField {...params} placeholder="Tất cả" className={classes.filterField} />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    className={classes.filterField}
                                                    value={filters.jobTitle}
                                                    onChange={(e) => handleFilterChange("jobTitle", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <Autocomplete
                                                    size="small"
                                                    options={[
                                                        { label: "Hoạt động", value: "true" },
                                                        { label: "Đã khóa", value: "false" }
                                                    ]}
                                                    getOptionLabel={(option) => option.label}
                                                    value={[
                                                        { label: "Hoạt động", value: "true" },
                                                        { label: "Đã khóa", value: "false" }
                                                    ].find(s => s.value === String(filters.status)) || null}
                                                    onChange={(_, newValue) =>
                                                        handleFilterChange("status", newValue?.value || "")
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField {...params} placeholder="Tất cả" className={classes.filterField} />
                                                    )}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                                    <CircularProgress size={22} />
                                                </TableCell>
                                            </TableRow>
                                        ) : data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#94a3b8" }}>
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
                                                            <Checkbox
                                                                size="small"
                                                                checked={checked}
                                                                onChange={() => handleSelectOne(item.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className={classes.bodyCell}>
                                                            <Box sx={{ display: "flex", gap: 0.25 }}>
                                                                <Tooltip title="Chỉnh sửa">
                                                                    <IconButton
                                                                        size="small"
                                                                        className={classes.actionIcon}
                                                                        onClick={() => router.push(`/users/${item.id}`)}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Cấp lại mật khẩu">
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
                                                                checked={item.status === false || item.status === null || item.status === undefined}
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
                            <Pagination
                                count={Math.max(1, Math.ceil(total / filters.limit))}
                                page={filters.page}
                                onChange={(_, page) => handleFilterChange("page", page)}
                                shape="rounded"
                                size="small"
                                siblingCount={0}
                                boundaryCount={1}
                            />
                        </Box>
                    </Box>
                </Box>

                <BulkSelectionBar
                    count={selectedIds.length}
                    onDelete={handleBulkDelete}
                    onClose={() => setSelectedIds([])}
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
                        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
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
                                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
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
                                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
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
                            sx={{ textTransform: 'none', bgcolor: '#2f65f0', fontWeight: 600, borderRadius: '6px' }}
                        >
                            Xác nhận nhập ({importUsers.length})
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
};
