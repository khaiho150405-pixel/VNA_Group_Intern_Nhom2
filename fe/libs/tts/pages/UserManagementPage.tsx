"use client";

import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Checkbox, Snackbar, Alert,
    Switch, IconButton, TextField, Select, MenuItem, CircularProgress, Stack, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@core/layouts/MainLayout';
import { useUsers } from '../hooks/useUsers';
import { userService } from '@tts/services/user.services';
import * as XLSX from 'xlsx';
export const UserManagementPage = () => {
    const router = useRouter();
    const { users, isLoading, error } = useUsers();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [filters, setFilters] = useState({
        fullName: '',
        username: '',
        email: '',
        role: '',
        jobTitle: '',
        status: ''
    });


    const [passwordModal, setPasswordModal] = useState({ open: false, userId: '', userName: '' });
    const [newPassword, setNewPassword] = useState('');

    const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
        severity: 'success'
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    console.log("Danh sách các ID đang được chọn:", selectedIds);
    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelecteds = filteredUsers.map((n: any) => n.id);
            setSelectedIds(newSelecteds);
            return;
        }
        setSelectedIds([]);
    };

    const handleSelectRow = (id: string) => {
        if (!id) return; // Đề phòng row.id bị null

        setSelectedIds((prevSelected) => {
            // Nếu ID đã có trong mảng -> Xóa nó đi (Bỏ tick)
            if (prevSelected.includes(id)) {
                return prevSelected.filter(item => item !== id);
            }
            // Nếu chưa có -> Thêm nó vào mảng (Đánh tick)
            return [...prevSelected, id];
        });
    };


    const handleExportExcel = () => {
        if (!filteredUsers || filteredUsers.length === 0) {
            setToast({ open: true, message: 'Không có dữ liệu để xuất!', severity: 'error' });
            return;
        }

        const dataToExport = filteredUsers.map((user: any, index: number) => ({
            "STT": index + 1,
            "Họ và tên": user.fullName || user.name || '',
            "Tên đăng nhập": user.username || '',
            "Email": user.email || '',
            "Vai trò": user.realRole || 'Chưa phân quyền',
            "Chức danh": user.jobTitle || 'Chuyên viên',
            "Trạng thái": user.status !== false ? 'Hoạt động' : 'Đã khóa'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        worksheet['!cols'] = [
            { wch: 5 },  // STT
            { wch: 25 }, // Họ và tên
            { wch: 20 }, // Tên đăng nhập
            { wch: 30 }, // Email
            { wch: 20 }, // Vai trò
            { wch: 20 }, // Chức danh
            { wch: 15 }  // Trạng thái
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachNguoiDung");

        XLSX.writeFile(workbook, "Danh_sach_nguoi_dung.xlsx");

        setToast({ open: true, message: 'Xuất file Excel thành công!', severity: 'success' });
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Khi người dùng chọn file Excel xong, hàm này sẽ chạy
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                // 1. Đọc file Excel
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws);

                // 2. Chuyển đổi tên cột tiếng Việt sang chuẩn Tiếng Anh cho Backend
                const formattedData = rawData.map((item: any) => ({
                    fullName: item['Họ và tên'] || '',
                    username: item['Tên đăng nhập'] || '',
                    email: item['Email'] || '',
                    // Bắt buộc phải có mật khẩu mặc định nếu Excel không có cột Mật khẩu
                    password: item['Mật khẩu'] || '12345678',
                })).filter(u => u.username); // Chỉ lấy những dòng có Tên đăng nhập

                if (formattedData.length === 0) {
                    setToast({ open: true, message: 'File Excel trống hoặc sai định dạng!', severity: 'error' });
                    return;
                }

                // Bật loading nếu bạn muốn (tùy chọn)
                setToast({ open: true, message: 'Đang xử lý dữ liệu...', severity: 'success' });

                // 3. Gửi mảng dữ liệu xuống Backend
                const response = await userService.import(formattedData);

                // 4. Báo cáo kết quả
                const successCount = response.success || 0;
                const errorCount = response.err || 0;

                if (errorCount > 0) {
                    setToast({
                        open: true,
                        message: `Nhập thành công ${successCount} dòng. Thất bại ${errorCount} dòng (Trùng lặp).`,
                        severity: 'warning'
                    });
                } else {
                    setToast({ open: true, message: `Nhập thành công ${successCount} tài khoản!`, severity: 'success' });
                }

                setTimeout(() => window.location.reload(), 1500);

            } catch (error) {
                console.error("Lỗi khi import:", error);
                setToast({ open: true, message: 'Lỗi định dạng file hoặc lỗi máy chủ', severity: 'error' });
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleDeleteSelected = async () => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} dữ liệu đã chọn?`)) {
            try {
                for (const id of selectedIds) {
                    await userService.delete(id);
                }

                setToast({ open: true, message: 'Xóa dữ liệu thành công!', severity: 'success' });
                setSelectedIds([]);

                setTimeout(() => window.location.reload(), 1000);

            } catch (error: any) {
                console.error("Lỗi khi xóa:", error);

                const errorMsg = error.response?.data?.message || error.response?.data?.errors || 'Có lỗi xảy ra khi xóa dữ liệu (Xem Console)';
                setToast({ open: true, message: String(errorMsg), severity: 'error' });
            }
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setToast({ open: true, message: "Mật khẩu phải có ít nhất 6 ký tự!", severity: "error" });
            return;
        }
        try {
            await userService.update(passwordModal.userId, {
                password: newPassword
            });

            setToast({ open: true, message: "Đặt lại mật khẩu thành công!", severity: "success" });
            setPasswordModal({ open: false, userId: '', userName: '' });
            setNewPassword(''); // Reset ô nhập
        } catch (error) {
            console.error("Lỗi khi đổi mật khẩu", error);
            setToast({ open: true, message: "Có lỗi xảy ra khi cập nhật mật khẩu.", severity: "error" });
        }
    };

    const handleToggleStatus = async (row: any) => {
        try {
            const nextStatus = row.status === false ? null : false;

            await userService.update(row.id, {
                status: nextStatus
            });

            window.location.reload();

        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái", error);
        }
    };

    const handleFilterChange = (field: string) => (event: any) => {
        setFilters(prev => ({ ...prev, [field]: event.target.value }));
    };

    const getRoleDisplay = (roleData: any) => {
        if (!roleData) return '--';
        // Nếu là object thì lấy tên
        if (typeof roleData === 'object') return roleData.name || roleData.roleName || roleData.role || '--';
        // Nếu là string hoặc số (ID), bạn có thể dùng một switch-case ở đây
        return roleData;
    };

    const filteredUsers = useMemo(() => {
        if (!users) return [];

        return users.filter((user: any) => {
            const name = (user.fullName || user.name || '').toLowerCase();
            const username = (user.username || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            const roleName = (user.role?.name || user.realRole || '');
            const jobTitle = (user.jobTitle || 'Chuyên viên');
            const isActive = user.status !== false;

            const matchName = name.includes(filters.fullName.toLowerCase());
            const matchUsername = username.includes(filters.username.toLowerCase());
            const matchEmail = email.includes(filters.email.toLowerCase());
            const matchRole = filters.role === '' || roleName === filters.role;
            const matchJobTitle = filters.jobTitle === '' || jobTitle === filters.jobTitle;

            const matchStatus = filters.status === '' ||
                (filters.status === 'true' && isActive) ||
                (filters.status === 'false' && !isActive);

            return matchName && matchUsername && matchEmail && matchRole && matchJobTitle && matchStatus;
        });
    }, [users, filters]);

    return (
        <MainLayout>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', p: 3, bgcolor: '#f4f6f8', overflow: 'hidden' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: 'white',
                        px: 3,
                        py: 2,
                        mb: 3,
                        borderRadius: 1,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: '1px solid #e0e0e0',
                        flexShrink: 0
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#333', fontSize: '1.1rem' }}>
                        Danh sách người dùng
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            hidden
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            size="small"
                            disableElevation
                            sx={{ textTransform: 'none', borderColor: '#d1d5db', color: '#2563eb', fontWeight: 600 }}
                            onClick={handleImportClick}
                        >
                            Import
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            color="primary"
                            size="small"
                            disableElevation
                            sx={{ textTransform: 'none', bgcolor: '#2563eb', fontWeight: 600 }}
                            onClick={() => router.push('/users/create')}
                        >
                            Thêm mới
                        </Button>
                    </Stack>
                </Box>

                <Paper
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e0e0e0',
                        bgcolor: 'white'
                    }}
                >
                    <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                        {/* Bỏ tableLayout: 'fixed' để trình duyệt tự do co giãn dựa trên minWidth */}
                        <Table stickyHeader size="small" sx={{ minWidth: 1100, borderCollapse: 'separate', borderSpacing: 0 }}>
                            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                <TableRow>
                                    {/* Khóa chặt độ rộng 3 cột Icon đầu tiên để chúng ôm sát nhau */}
                                    <TableCell sx={{ bgcolor: '#f8f9fa', minWidth: 40, width: 40, borderBottom: 'none', px: 1 }}></TableCell>
                                    <TableCell sx={{ bgcolor: '#f8f9fa', minWidth: 40, width: 40, borderBottom: 'none', px: 0 }}></TableCell>
                                    <TableCell sx={{ bgcolor: '#f8f9fa', minWidth: 40, width: 40, borderBottom: 'none', px: 0 }}></TableCell>

                                    {/* Cấp minWidth rộng rãi cho các cột nội dung để Select/Input không bị bóp méo */}
                                    <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600, color: '#4b5563', minWidth: 160, borderBottom: 'none' }}>Họ và tên</TableCell>
                                    <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600, color: '#4b5563', minWidth: 140, borderBottom: 'none' }}>Tài khoản</TableCell>
                                    <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600, color: '#4b5563', minWidth: 200, borderBottom: 'none' }}>Email</TableCell>
                                    <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600, color: '#4b5563', minWidth: 140, borderBottom: 'none' }}>Vai trò</TableCell>
                                    <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600, color: '#4b5563', minWidth: 140, borderBottom: 'none' }}>Chức danh</TableCell>
                                    <TableCell align="center" sx={{ bgcolor: '#f8f9fa', fontWeight: 600, color: '#4b5563', minWidth: 130, borderBottom: 'none' }}>Trạng thái</TableCell>
                                </TableRow>

                                {/* Dòng 2: Bộ lọc (Filters) */}
                                <TableRow>
                                    <TableCell sx={{ top: 43, zIndex: 2, position: 'sticky', bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', px: 1 }}></TableCell>
                                    <TableCell sx={{ top: 43, zIndex: 2, position: 'sticky', bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', px: 0 }}></TableCell>
                                    <TableCell sx={{ top: 43, zIndex: 2, position: 'sticky', bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', px: 0 }}></TableCell>
                                    <TableCell sx={{ top: 43, zIndex: 2, position: 'sticky', bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 1.5 }}>
                                        <TextField size="small" fullWidth placeholder="Tìm kiếm..." sx={{ bgcolor: 'white' }} value={filters.fullName} onChange={handleFilterChange('fullName')} />
                                    </TableCell>
                                    <TableCell sx={{ top: 43, zIndex: 2, position: 'sticky', bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 1.5 }}>
                                        <TextField size="small" fullWidth placeholder="Tìm kiếm..." sx={{ bgcolor: 'white' }} value={filters.username} onChange={handleFilterChange('username')} />
                                    </TableCell>
                                    <TableCell sx={{ top: 43, zIndex: 2, position: 'sticky', bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 1.5 }}>
                                        <TextField size="small" fullWidth placeholder="Tìm kiếm..." sx={{ bgcolor: 'white' }} value={filters.email} onChange={handleFilterChange('email')} />
                                    </TableCell>
                                    <TableCell sx={{ top: 43, zIndex: 2, position: 'sticky', bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 1.5 }}>
                                        <Select size="small" fullWidth displayEmpty sx={{ bgcolor: 'white' }} value={filters.role} onChange={handleFilterChange('role')}>
                                            <MenuItem value="">Tất cả</MenuItem>
                                            <MenuItem value="Quản trị viên">Quản trị viên</MenuItem>
                                            <MenuItem value="Chuyên viên">Chuyên viên</MenuItem>
                                            <MenuItem value="Lãnh đạo">Lãnh đạo</MenuItem>
                                            <MenuItem value="Nhân viên">Nhân viên</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell sx={{ top: 43, zIndex: 2, position: 'sticky', bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 1.5 }}>
                                        <Select size="small" fullWidth displayEmpty sx={{ bgcolor: 'white' }} value={filters.jobTitle} onChange={handleFilterChange('jobTitle')}>
                                            <MenuItem value="">Tất cả</MenuItem>
                                            <MenuItem value="Chuyên viên">Chuyên viên</MenuItem>
                                            <MenuItem value="Quản lý">Quản lý</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell sx={{ top: 43, zIndex: 2, position: 'sticky', bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 1.5 }}>
                                        <Select size="small" fullWidth displayEmpty sx={{ bgcolor: 'white' }} value={filters.status} onChange={handleFilterChange('status')}>
                                            <MenuItem value="">Tất cả</MenuItem>
                                            <MenuItem value="true">Hoạt động</MenuItem>
                                            <MenuItem value="false">Đã khóa</MenuItem>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                                            <CircularProgress size={30} />
                                            <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: '0.875rem' }}>Đang tải dữ liệu từ server...</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!isLoading && error && (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 8, color: 'error.main' }}>
                                            {error}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!isLoading && !error && filteredUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                            Không tìm thấy dữ liệu phù hợp.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!isLoading && !error && filteredUsers.length > 0 && filteredUsers.map((row: any) => {
                                    console.log("Dòng dữ liệu:", row);
                                    const isSelected = selectedIds.indexOf(row.id) !== -1;
                                    return (
                                        <TableRow key={row.id} hover sx={{ cursor: 'pointer' }}>
                                            <TableCell padding="checkbox" sx={{ pl: 2 }}>
                                                <Checkbox size="small" sx={{ color: '#ccc' }} checked={isSelected} onChange={() => handleSelectRow(row.id)} />
                                            </TableCell>
                                            <TableCell sx={{ px: 0 }}>
                                                <IconButton size="small" sx={{ color: '#6b7280', '&:hover': { color: '#2563eb' } }} onClick={(e) => { e.stopPropagation(); router.push(`/users/${row.id}`); }}><EditIcon fontSize="small" /></IconButton>
                                            </TableCell>
                                            <TableCell sx={{ px: 0 }}>
                                                <IconButton size="small" sx={{ color: '#6b7280', '&:hover': { color: '#2563eb' } }} onClick={(e) => {
                                                    e.stopPropagation(); // Không cho lây lan sự kiện click
                                                    // Mở popup và nạp thông tin user vào
                                                    setPasswordModal({
                                                        open: true,
                                                        userId: row.id,
                                                        userName: row.fullName || row.username
                                                    });
                                                    setNewPassword('');
                                                }}><VpnKeyIcon fontSize="small" /></IconButton>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.875rem', color: '#374151' }}>{row.fullName || row.name || '--'}</TableCell>
                                            <TableCell sx={{ fontSize: '0.875rem', color: '#374151' }}>{row.username || '--'}</TableCell>
                                            <TableCell sx={{ fontSize: '0.875rem', color: '#374151' }}>{row.email || '--'}</TableCell>
                                            <TableCell sx={{ fontSize: '0.875rem', color: '#374151' }}>{row.realRole || 'Chưa phân quyền'}</TableCell>
                                            <TableCell sx={{ fontSize: '0.875rem', color: '#374151' }}>{row.jobTitle || 'Chuyên viên'}</TableCell>
                                            <TableCell align="center">
                                                <Switch size="small" checked={row.status !== false} color="primary" onChange={(e) => { e.stopPropagation(); handleToggleStatus(row) }} />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* --- FOOTER --- */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 3,
                            py: 1.5,
                            bgcolor: 'transparent',
                            flexShrink: 0
                        }}
                    >
                        <Button
                            size="small"
                            startIcon={<DownloadIcon fontSize="small" />}
                            sx={{ color: '#9ca3af', textTransform: 'none', fontWeight: 500, '&:hover': { bgcolor: 'transparent', color: '#4b5563' } }}
                            disableRipple
                            onClick={handleExportExcel}
                        >
                            Export Data
                        </Button>

                        <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7280', cursor: 'pointer' }}>
                                <Typography variant="body2" sx={{ mr: 0.5 }}>10</Typography>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                            </Box>

                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                1 - {filteredUsers.length < 10 ? filteredUsers.length : 10} of {filteredUsers.length}
                            </Typography>

                            <Stack direction="row" spacing={1}>
                                <IconButton size="small" sx={{ color: '#d1d5db' }} disableRipple>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                                </IconButton>
                                <IconButton size="small" sx={{ color: '#6b7280' }} disableRipple>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                </IconButton>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* GIAO DIỆN POPUP ĐỔI MẬT KHẨU GIỐNG THIẾT KẾ */}
                    <Dialog
                        open={passwordModal.open}
                        onClose={() => setPasswordModal({ ...passwordModal, open: false })}
                        maxWidth="xs"
                        fullWidth
                        sx={{
                            '& .MuiDialog-paper': {
                                borderRadius: '10px', // Bo góc cho toàn bộ popup
                                overflow: 'hidden'    // Cắt phần màu xanh bị tràn ở 2 góc trên
                            }
                        }}
                    >
                        {/* Thanh tiêu đề màu xanh */}
                        <DialogTitle
                            sx={{
                                bgcolor: '#3b82f6', // Màu xanh dương giống trong ảnh
                                color: 'white',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '1.2rem',
                                py: 1.5
                            }}
                        >
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
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '6px', // Bo góc nhẹ cho ô input
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        fontSize: '0.9rem',
                                        color: '#9ca3af',
                                        opacity: 1
                                    }
                                }}
                            />
                        </DialogContent>

                        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => setPasswordModal({ ...passwordModal, open: false })}
                                sx={{
                                    color: '#3b82f6',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    mr: 1
                                }}
                                disableRipple
                            >
                                Huỷ bỏ
                            </Button>
                            <Button
                                onClick={handleChangePassword}
                                variant="contained"
                                disableElevation
                                startIcon={<SaveIcon fontSize="small" />}
                                sx={{
                                    textTransform: 'none',
                                    bgcolor: '#3b82f6',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    borderRadius: '6px',
                                    px: 3,
                                    '&:hover': { bgcolor: '#2563eb' }
                                }}
                            >
                                Lưu
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Paper>
                <Snackbar
                    open={toast.open}
                    autoHideDuration={3000}
                    onClose={() => setToast({ ...toast, open: false })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert
                        onClose={() => setToast({ ...toast, open: false })}
                        severity={toast.severity}
                        variant="filled"
                        sx={{
                            bgcolor: toast.severity === 'success' ? '#e8f5e9' : '#ffebee',
                            color: toast.severity === 'success' ? '#2e7d32' : '#c62828',
                            fontWeight: 500,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            alignItems: 'center',
                            '& .MuiAlert-icon': {
                                color: toast.severity === 'success' ? '#2e7d32' : '#c62828',
                            },
                            '& .MuiAlert-action': {
                                color: toast.severity === 'success' ? '#2e7d32' : '#c62828',
                                pt: 0,
                                pb: 0
                            }
                        }}
                    >
                        {toast.message}
                    </Alert>
                </Snackbar>
            </Box>
            {selectedIds.length > 0 && (
                <Paper
                    elevation={4}
                    sx={{
                        position: 'fixed',
                        bottom: 40, // Cách mép dưới màn hình
                        left: '50%',
                        transform: 'translateX(-50%)', // Đẩy ra chính giữa
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'white',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        zIndex: 1300,
                        height: 48,
                        minWidth: 320,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}
                >
                    {/* Khối màu xanh hiển thị số lượng */}
                    <Box sx={{
                        bgcolor: '#3b82f6',
                        color: 'white',
                        px: 3,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem'
                    }}>
                        {selectedIds.length}
                    </Box>

                    {/* Chữ mô tả */}
                    <Typography sx={{ px: 2.5, flexGrow: 1, color: '#4b5563', fontSize: '0.95rem', fontWeight: 500 }}>
                        dữ liệu được chọn
                    </Typography>

                    {/* Nút Xóa */}
                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon fontSize="small" />}
                        onClick={handleDeleteSelected}
                        sx={{
                            textTransform: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            bgcolor: '#ef4444',
                            '&:hover': { bgcolor: '#dc2626' },
                            mr: 1,
                            px: 2
                        }}
                        disableElevation
                    >
                        Xoá
                    </Button>

                    <IconButton
                        size="small"
                        onClick={() => setSelectedIds([])} // Xóa mảng -> Ẩn thanh này đi
                        sx={{ color: '#9ca3af', mr: 0.5, '&:hover': { color: '#4b5563' } }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Paper>
            )}

        </MainLayout>
    );
};