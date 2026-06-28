"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Checkbox,
    IconButton, TextField, Select, MenuItem, CircularProgress,
    TablePagination, Autocomplete, InputAdornment, Divider, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSnackbar } from 'notistack';

import { MainLayout } from '@core/layouts/MainLayout';
import { useAccidentReportStyles } from '../logic/accident-report/style';
import { DoetService, periodicReportService } from '@tts/services';
import { useAuth } from '@core/contexts/AuthProvider';
import { EnterpriseAccidentReportPage } from './EnterpriseAccidentReportPage';
import { ConfirmDialog } from '@core/components/ConfirmDialog';

export const AccidentReportPage = () => {
    const classes = useAccidentReportStyles();
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();

    const isSo = (user as any)?.role?.type === 'SO';


    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionType, setActionType] = useState<'DA_TIEP_NHAN' | 'HUY_TIEP_NHAN' | null>(null);

    const handleConfirmAction = (type: 'DA_TIEP_NHAN' | 'HUY_TIEP_NHAN') => {
        setActionType(type);
        if (type === 'HUY_TIEP_NHAN') {
            setRejectReason('');
            setCancelDialogOpen(true);
        } else {
            setConfirmOpen(true);
        }
    };

    const handleExecuteCancel = async () => {
        if (!rejectReason.trim()) {
            enqueueSnackbar("Vui lòng nhập lý do hủy tiếp nhận", { variant: 'warning' });
            return;
        }
        setCancelDialogOpen(false);
        setLoading(true);

        // Optimistic UI update
        setData((prevData) =>
            prevData.map((item) =>
                selectedIds.includes(item.id)
                    ? { ...item, status: 'HUY_TIEP_NHAN', rejectReason: rejectReason }
                    : item
            )
        );

        try {
            await Promise.all(
                selectedIds.map(id =>
                    periodicReportService.update(Number(id), {
                        status: 'HUY_TIEP_NHAN',
                        rejectReason: rejectReason
                    })
                )
            );
            enqueueSnackbar("Hủy tiếp nhận báo cáo thành công", { variant: 'success' });
            setSelectedIds([]);
            setRejectReason('');
            fetchData();
        } catch (error: any) {
            enqueueSnackbar(
                error?.response?.data?.message || error?.message || "Đã xảy ra lỗi khi hủy tiếp nhận",
                { variant: 'error' }
            );
            fetchData();
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteAction = async () => {
        if (!actionType) return;
        setConfirmOpen(false);
        setLoading(true);

        // Cập nhật trạng thái tức thời ở UI (Optimistic UI update)
        setData((prevData) =>
            prevData.map((item) =>
                selectedIds.includes(item.id)
                    ? { ...item, status: actionType }
                    : item
            )
        );

        try {
            await Promise.all(
                selectedIds.map(id =>
                    periodicReportService.update(Number(id), { status: actionType })
                )
            );
            enqueueSnackbar(
                actionType === 'DA_TIEP_NHAN'
                    ? "Duyệt báo cáo thành công"
                    : "Hủy duyệt báo cáo thành công",
                { variant: 'success' }
            );
            setSelectedIds([]);
            fetchData();
        } catch (error: any) {
            enqueueSnackbar(
                error?.response?.data?.message || error?.message || "Đã xảy ra lỗi khi thực hiện thao tác",
                { variant: 'error' }
            );
            fetchData(); // Rollback bằng cách tải lại dữ liệu đúng từ server
        } finally {
            setLoading(false);
        }
    };

    const years = useMemo(() => {
        const arr = [];
        const current = new Date().getFullYear();
        for (let y = current; y >= 1980; y--) {
            arr.push(y);
        }
        return arr;
    }, []);

    const [headerFilters, setHeaderFilters] = useState<{
        year: number;
        province: any;
        ward: any;
    }>({
        year: new Date().getFullYear(),
        province: null,
        ward: null
    });

    const [tableFilters, setTableFilters] = useState({
        page: 0,
        limit: 10,
        companyName: '',
        taxCode: '',
        reportPeriod: '',
        status: ''
    });

    const [provinces, setProvinces] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    useEffect(() => {
        if (!isSo) return;
        const fetchLocationMasterData = async () => {
            try {
                const res: any = await DoetService.getProvinces();
                const items = res?.data || res || [];
                if (Array.isArray(items)) {
                    const mapped = items.map((p: any) => ({ code: String(p.id), name: p.full_name || p.name }));
                    const sorted = mapped.sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'));
                    setProvinces(sorted);
                }
            } catch (error) {
                console.error("Lỗi lấy data tỉnh thành", error);
            }
        };
        fetchLocationMasterData();
    }, [isSo]);

    useEffect(() => {
        if (!isSo) return;
        if (headerFilters.province?.code) {
            const fetchWards = async () => {
                try {
                    const res: any = await DoetService.getDistricts(headerFilters.province.code);
                    const items = res?.data || res || [];
                    if (Array.isArray(items)) {
                        const mapped = items.map((d: any) => ({ code: String(d.id), name: d.full_name || d.name }));
                        const sorted = mapped.sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'));
                        setWards(sorted);
                    }
                } catch (error) {
                    console.error("Lỗi lấy data phường xã", error);
                }
            };
            fetchWards();
        } else {
            setWards([]);
        }
    }, [headerFilters.province, isSo]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const payload = {
                year: headerFilters.year,
                provinceId: headerFilters.province?.code,
                wardId: headerFilters.ward?.code,
                page: tableFilters.page + 1,
                limit: tableFilters.limit,
                companyName: tableFilters.companyName,
                taxCode: tableFilters.taxCode,
                period: tableFilters.reportPeriod,
                status: tableFilters.status
            };

            const response: any = await periodicReportService.getAll(payload);
            const resData = response.data || response;
            setData(resData.items || []);
            setTotal(resData.totalCount || 0);

        } catch (error) {
            enqueueSnackbar("Lỗi khi tải dữ liệu báo cáo", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isSo) return;
        fetchData();
    }, [headerFilters, tableFilters, isSo]);

    const handleTableFilterChange = (field: string, value: any) => {
        setTableFilters((prev) => ({
            ...prev,
            [field]: value,
            page: field === 'page' ? value : 0,
        }));
        setSelectedIds([]);
    };

    const handleSelectAll = () => {
        const selectable = data.filter((d: any) => d.status !== 'CHO_BAO_CAO' && d.status !== 'DANG_BAO_CAO');
        const allChecked = selectable.length > 0 && selectable.every((d: any) => selectedIds.includes(d.id));

        if (allChecked || selectedIds.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(selectable.map((d: any) => d.id));
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const renderStatus = (status: string) => {
        if (status === 'DANG_BAO_CAO') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1b3b87' }} />
                    <Typography variant="body2" sx={{ color: '#1b3b87', fontWeight: 500 }}>
                        Đang báo cáo
                    </Typography>
                </Box>
            );
        }
        if (status === 'CHO_BAO_CAO') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#94a3b8' }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                        Chờ báo cáo
                    </Typography>
                </Box>
            );
        }
        if (status === 'CHO_XET_DUYET') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                    <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                        Chờ xét duyệt
                    </Typography>
                </Box>
            );
        }
        if (status === 'HUY_TIEP_NHAN') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                    <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600 }}>
                        Hủy tiếp nhận
                    </Typography>
                </Box>
            );
        }
        if (status === 'HET_HAN') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                    <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                        Hết hạn báo cáo
                    </Typography>
                </Box>
            );
        }
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2f65f0' }} />
                <Typography variant="body2" sx={{ color: '#2f65f0', fontWeight: 600 }}>
                    Đã tiếp nhận
                </Typography>
            </Box>
        );
    };

    if (!isSo) {
        return (
            <MainLayout>
                <EnterpriseAccidentReportPage user={user} />
            </MainLayout>
        );
    }

    const selectedItems = data.filter((item: any) => selectedIds.includes(item.id));
    const hasDaTiepNhan = selectedItems.some((item: any) => item.status === 'DA_TIEP_NHAN');
    const hasHuyTiepNhan = selectedItems.some((item: any) => item.status === 'HUY_TIEP_NHAN');

    return (
        <MainLayout>
            <Box className={classes.root}>
                <Box className={classes.pageHeader}>
                    <Typography className={classes.headerTitle}>
                        Báo cáo định kỳ Tai nạn lao động
                    </Typography>
                    <Box className={classes.actions}>
                        <Autocomplete
                            size="small"
                            options={years}
                            getOptionLabel={(option) => String(option)}
                            value={headerFilters.year}
                            onChange={(_, newValue) => setHeaderFilters(p => ({ ...p, year: newValue || new Date().getFullYear() }))}
                            renderInput={(params) => (
                                <TextField {...params} className={classes.filterField} />
                            )}
                            disableClearable
                            sx={{ width: 120 }}
                        />
                        <Button
                            variant="outlined"
                            className={classes.importBtn}
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (headerFilters.year) params.append('year', headerFilters.year.toString());
                                if (headerFilters.province?.id) params.append('provinceId', headerFilters.province.id.toString());
                                if (headerFilters.ward?.id) params.append('wardId', headerFilters.ward.id.toString());
                                router.push(`/accident-reports/summary?${params.toString()}`);
                            }}
                        >
                            Báo cáo tổng hợp
                        </Button>
                    </Box>
                </Box>

                <Box className={classes.mainContent}>
                    <Box className={classes.card}>

                        <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0' }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Autocomplete
                                        size="small"
                                        fullWidth
                                        options={provinces || []}
                                        getOptionLabel={(option: any) => option.name || ''}
                                        value={headerFilters.province}
                                        onChange={(_, val: any) => setHeaderFilters(p => ({ ...p, province: val, ward: null }))}
                                        disabled={loading}
                                        renderInput={(params) => (
                                            <TextField {...params}
                                                label="Tỉnh/Thành phố"
                                                placeholder="-- Chọn tỉnh/ thành phố --"
                                                className={classes.filterField} />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Autocomplete
                                        size="small"
                                        fullWidth
                                        options={wards || []}
                                        getOptionLabel={(option: any) => option.name || ''}
                                        value={headerFilters.ward}
                                        onChange={(_, val: any) => setHeaderFilters(p => ({ ...p, ward: val }))}
                                        disabled={loading || !headerFilters.province}
                                        renderInput={(params) => (
                                            <TextField {...params}
                                                label="Phường/Xã"
                                                placeholder="-- Chọn phường / xã --"
                                                className={classes.filterField} />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <Box className={classes.tableScroll}>

                            <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
                                <Table stickyHeader size="medium">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox" className={classes.headerCell}>
                                                <Checkbox
                                                    size="small"
                                                    indeterminate={selectedIds.length > 0 && selectedIds.length < data.filter((d: any) => d.status !== 'CHO_BAO_CAO' && d.status !== 'DANG_BAO_CAO').length}
                                                    checked={data.filter((d: any) => d.status !== 'CHO_BAO_CAO' && d.status !== 'DANG_BAO_CAO').length > 0 && selectedIds.length === data.filter((d: any) => d.status !== 'CHO_BAO_CAO' && d.status !== 'DANG_BAO_CAO').length}
                                                    onChange={handleSelectAll}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.headerCell} width={80}>Thao tác</TableCell>
                                            <TableCell className={classes.headerCell}>Tên doanh nghiệp</TableCell>
                                            <TableCell className={classes.headerCell} width={180}>Mã số thuế</TableCell>
                                            <TableCell className={classes.headerCell} width={180}>Kỳ báo cáo</TableCell>
                                            <TableCell className={classes.headerCell} width={180}>Trạng thái</TableCell>
                                        </TableRow>

                                        <TableRow>
                                            <TableCell className={classes.filterCell}></TableCell>
                                            <TableCell className={classes.filterCell}></TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    className={classes.filterField}
                                                    placeholder="Tìm kiếm..."
                                                    value={tableFilters.companyName}
                                                    onChange={(e) => handleTableFilterChange('companyName', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    className={classes.filterField}
                                                    placeholder="Tìm kiếm..."
                                                    value={tableFilters.taxCode}
                                                    onChange={(e) => handleTableFilterChange('taxCode', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <Autocomplete
                                                    size="small"
                                                    options={[
                                                        { label: "6 tháng", value: "6_THANG" },
                                                        { label: "Cả năm", value: "CA_NAM" }
                                                    ]}
                                                    getOptionLabel={(option) => option.label}
                                                    value={[
                                                        { label: "6 tháng", value: "6_THANG" },
                                                        { label: "Cả năm", value: "CA_NAM" }
                                                    ].find(item => item.value === tableFilters.reportPeriod) || null}
                                                    onChange={(_, newValue) =>
                                                        handleTableFilterChange('reportPeriod', newValue?.value || '')
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField {...params} placeholder="Tất cả" className={classes.filterField} />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <Autocomplete
                                                    size="small"
                                                    options={[
                                                        { label: "Chờ báo cáo", value: "CHO_BAO_CAO" },
                                                        { label: "Đang báo cáo", value: "DANG_BAO_CAO" },
                                                        { label: "Chờ xét duyệt", value: "CHO_XET_DUYET" },
                                                        { label: "Đã tiếp nhận", value: "DA_TIEP_NHAN" },
                                                        { label: "Hủy tiếp nhận", value: "HUY_TIEP_NHAN" },
                                                        { label: "Hết hạn báo cáo", value: "HET_HAN" }
                                                    ]}
                                                    getOptionLabel={(option) => option.label}
                                                    value={[
                                                        { label: "Chờ báo cáo", value: "CHO_BAO_CAO" },
                                                        { label: "Đang báo cáo", value: "DANG_BAO_CAO" },
                                                        { label: "Chờ xét duyệt", value: "CHO_XET_DUYET" },
                                                        { label: "Đã tiếp nhận", value: "DA_TIEP_NHAN" },
                                                        { label: "Hủy tiếp nhận", value: "HUY_TIEP_NHAN" },
                                                        { label: "Hết hạn báo cáo", value: "HET_HAN" }
                                                    ].find(item => item.value === tableFilters.status) || null}
                                                    onChange={(_, newValue) =>
                                                        handleTableFilterChange('status', newValue?.value || '')
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
                                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        ) : data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                    Không có dữ liệu
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.map((item) => {
                                                const isChecked = selectedIds.includes(item.id);
                                                return (
                                                    <TableRow key={item.id} hover className={isChecked ? classes.rowSelected : ''}>
                                                        <TableCell padding="checkbox" className={classes.bodyCell}>
                                                            <Checkbox
                                                                size="small"
                                                                checked={isChecked}
                                                                onChange={() => handleSelectOne(item.id)}
                                                                disabled={item.status === 'CHO_BAO_CAO' || item.status === 'DANG_BAO_CAO' || item.status === 'HET_HAN'}
                                                            />
                                                        </TableCell>
                                                        <TableCell className={classes.bodyCell}>
                                                            <IconButton
                                                                component={(item.status === 'CHO_BAO_CAO' || item.status === 'HET_HAN') ? 'button' : Link}
                                                                href={(item.status === 'CHO_BAO_CAO' || item.status === 'HET_HAN') ? undefined : `/accident-reports/${item.id}`}
                                                                size="small"
                                                                className={classes.actionIcon}
                                                                disabled={item.status === 'CHO_BAO_CAO' || item.status === 'HET_HAN'}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                        <TableCell className={classes.bodyCell} sx={{ fontWeight: 500 }}>{item.companyName || '--'}</TableCell>
                                                        <TableCell className={classes.bodyCell}>{item.taxCode || item.doet?.taxCode || '--'}</TableCell>
                                                        <TableCell className={classes.bodyCell}>{item.period === 'CA_NAM' ? 'Cả năm' : '6 tháng'}</TableCell>
                                                        <TableCell className={classes.bodyCell}>{renderStatus(item.status)}</TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                        <Box className={classes.footer}>
                            <TablePagination
                                component="div"
                                count={total}
                                page={tableFilters.page}
                                onPageChange={(_, newPage) => handleTableFilterChange('page', newPage)}
                                rowsPerPage={tableFilters.limit}
                                onRowsPerPageChange={(e) => handleTableFilterChange('limit', parseInt(e.target.value, 10))}
                                rowsPerPageOptions={[10, 20, 50]}
                                labelRowsPerPage=""
                                labelDisplayedRows={({ from, to, count }) => `${from} - ${to} của ${count !== -1 ? count : `hơn ${to}`}`}
                                className={classes.pageInfo}
                            />
                        </Box>
                    </Box>
                </Box>

                {selectedIds.length > 0 && (
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: '#fff',
                            boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.12), 0px 4px 16px rgba(0, 0, 0, 0.04)',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            p: '6px 12px',
                            gap: 1.5,
                            zIndex: 1300,
                            border: '1px solid #e0e0e0',
                        }}
                    >
                        <Box
                            sx={{
                                bgcolor: '#2f65f0',
                                color: '#fff',
                                minWidth: 32,
                                height: 32,
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                px: 1,
                            }}
                        >
                            {selectedIds.length}
                        </Box>
                        <Typography sx={{ fontSize: '0.9rem', color: '#333', whiteSpace: 'nowrap' }}>
                            báo cáo được chọn
                        </Typography>
                        {!hasHuyTiepNhan && (
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleConfirmAction('HUY_TIEP_NHAN')}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: '6px',
                                    bgcolor: '#ff453a',
                                    '&:hover': { bgcolor: '#e63930', boxShadow: '0px 8px 20px rgba(255, 69, 58, 0.35)' },
                                    fontWeight: 600,
                                    px: 2,
                                    boxShadow: '0px 4px 12px rgba(255, 69, 58, 0.2)',
                                    transition: 'all 0.2s ease-in-out',
                                }}
                            >
                                Hủy duyệt
                            </Button>
                        )}
                        {!hasDaTiepNhan && (
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleConfirmAction('DA_TIEP_NHAN')}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: '6px',
                                    bgcolor: '#2e7d32',
                                    '&:hover': { bgcolor: '#1b5e20', boxShadow: '0px 8px 20px rgba(46, 125, 50, 0.35)' },
                                    fontWeight: 600,
                                    px: 2,
                                    boxShadow: '0px 4px 12px rgba(46, 125, 50, 0.2)',
                                    transition: 'all 0.2s ease-in-out',
                                }}
                            >
                                Duyệt
                            </Button>
                        )}
                        <IconButton size="small" onClick={() => setSelectedIds([])} sx={{ color: '#999' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}

                <ConfirmDialog
                    open={confirmOpen}
                    title="Xác nhận duyệt"
                    message={`Bạn có chắc chắn muốn duyệt và tiếp nhận ${selectedIds.length} báo cáo đã chọn? Sau khi tiếp nhận, doanh nghiệp sẽ không thể chỉnh sửa báo cáo.`}
                    onConfirm={handleExecuteAction}
                    onCancel={() => setConfirmOpen(false)}
                    confirmText="Duyệt"
                    isDestructive={false}
                />

                <Dialog
                    open={cancelDialogOpen}
                    onClose={() => setCancelDialogOpen(false)}
                    maxWidth="xs"
                    fullWidth
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ff453a', fontWeight: 600 }}>
                        Lý do hủy tiếp nhận
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: '#555', mb: 2 }}>
                            Bạn có chắc chắn muốn hủy tiếp nhận {selectedIds.length} báo cáo đã chọn? Doanh nghiệp có thể chỉnh sửa và nộp lại báo cáo sau khi bị hủy tiếp nhận.
                        </Typography>
                        <TextField
                            autoFocus
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            placeholder="Nhập lý do hủy tiếp nhận..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            slotProps={{
                                input: {
                                    style: { fontSize: '0.875rem' }
                                }
                            }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={() => setCancelDialogOpen(false)}
                            disableRipple
                            sx={{
                                textTransform: 'none',
                                color: '#666',
                                fontSize: '0.875rem',
                                borderRadius: '6px',
                                padding: '4.8px 18px',
                                boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.03)',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    backgroundColor: '#f5f5f7',
                                    color: '#333',
                                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)',
                                },
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleExecuteCancel}
                            variant="contained"
                            disabled={!rejectReason.trim()}
                            sx={{
                                textTransform: 'none',
                                borderRadius: '6px',
                                bgcolor: '#ff453a',
                                fontWeight: 600,
                                px: 3,
                                boxShadow: '0px 4px 12px rgba(255, 69, 58, 0.2)',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    bgcolor: '#e63930',
                                    boxShadow: '0px 8px 20px rgba(255, 69, 58, 0.35)'
                                }
                            }}
                        >
                            Xác nhận hủy
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
}