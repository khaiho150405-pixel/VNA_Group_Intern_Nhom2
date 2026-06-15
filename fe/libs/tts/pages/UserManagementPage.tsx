"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Checkbox,
    Switch, IconButton, TextField, Select, MenuItem, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Pagination
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
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

import { MainLayout } from '@core/layouts/MainLayout';
import { BulkSelectionBar } from '@core/components/BulkSelectionBar';
import { userService } from '@tts/services/user.services';
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
    const [newPassword, setNewPassword] = useState('');

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

                const formattedData = rawData.map((item: any) => ({
                    fullName: item['Họ và tên'] || '',
                    username: item['Tên đăng nhập'] || '',
                    email: item['Email'] || '',
                    password: item['Mật khẩu'] || '12345678',
                })).filter(u => u.username);

                if (formattedData.length === 0) {
                    enqueueSnackbar('File Excel trống hoặc sai định dạng!', { variant: 'error' });
                    return;
                }

                const response = await userService.import(formattedData);
                const successCount = response.success || 0;
                const errorCount = response.err || 0;

                if (errorCount > 0) {
                    enqueueSnackbar(`Nhập thành công ${successCount} dòng. Thất bại ${errorCount} dòng (Trùng lặp).`, { variant: 'warning' });
                } else {
                    enqueueSnackbar(`Nhập thành công ${successCount} tài khoản!`, { variant: 'success' });
                }
                fetchData();
            } catch (error) {
                enqueueSnackbar('Lỗi khi xử lý file', { variant: 'error' });
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            enqueueSnackbar("Mật khẩu phải có ít nhất 6 ký tự!", { variant: "error" });
            return;
        }
        try {
            await userService.update(passwordModal.userId, { password: newPassword });
            enqueueSnackbar("Đặt lại mật khẩu thành công!", { variant: "success" });
            setPasswordModal({ open: false, userId: '', userName: '' });
            setNewPassword('');
        } catch (error) {
            enqueueSnackbar("Có lỗi xảy ra khi cập nhật mật khẩu.", { variant: "error" });
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
                                                    placeholder="Tìm kiếm..."
                                                    value={filters.fullName}
                                                    onChange={(e) => handleFilterChange("fullName", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    className={classes.filterField}
                                                    placeholder="Tìm kiếm..."
                                                    value={filters.username}
                                                    onChange={(e) => handleFilterChange("username", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    className={classes.filterField}
                                                    placeholder="Tìm kiếm..."
                                                    value={filters.email}
                                                    onChange={(e) => handleFilterChange("email", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    displayEmpty
                                                    className={classes.filterField}
                                                    value={filters.role}
                                                    onChange={(e) => handleFilterChange("role", e.target.value)}
                                                >
                                                    <MenuItem value="">Tất cả</MenuItem>
                                                    <MenuItem value="Chuyên viên">Chuyên viên</MenuItem>
                                                    <MenuItem value="Lãnh đạo">Lãnh đạo</MenuItem>
                                                    <MenuItem value="Nhân viên">Nhân viên</MenuItem>
                                                </Select>
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
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    displayEmpty
                                                    className={classes.filterField}
                                                    value={filters.status}
                                                    onChange={(e) => handleFilterChange("status", e.target.value)}
                                                >
                                                    <MenuItem value="">Tất cả</MenuItem>
                                                    <MenuItem value="true">Hoạt động</MenuItem>
                                                    <MenuItem value="false">Đã khóa</MenuItem>
                                                </Select>
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

                <Dialog
                    open={passwordModal.open}
                    onClose={() => setPasswordModal({ ...passwordModal, open: false })}
                    maxWidth="xs"
                    fullWidth
                    sx={{ '& .MuiDialog-paper': { borderRadius: '10px' } }}
                >
                    <DialogTitle sx={{ bgcolor: '#2f65f0', color: 'white', textAlign: 'center', fontWeight: 700, py: 1.5 }}>
                        Xác nhận
                    </DialogTitle>
                    <DialogContent sx={{ pt: '24px !important', pb: 1 }}>
                        <Typography sx={{ mb: 2, color: '#333', fontSize: '0.95rem' }}>
                            Khởi tạo mật khẩu cho tài khoản <strong>{passwordModal.userName}</strong>
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Nhập mật khẩu mới mong muốn"
                            type="text"
                            variant="outlined"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoFocus
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                        <Button
                            onClick={() => setPasswordModal({ ...passwordModal, open: false })}
                            sx={{ color: '#2f65f0', textTransform: 'none', fontWeight: 600 }}
                        >
                            Huỷ bỏ
                        </Button>
                        <Button
                            onClick={handleChangePassword}
                            variant="contained"
                            disableElevation
                            startIcon={<SaveIcon fontSize="small" />}
                            sx={{ textTransform: 'none', bgcolor: '#2f65f0', fontWeight: 600, borderRadius: '6px' }}
                        >
                            Lưu
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
};
