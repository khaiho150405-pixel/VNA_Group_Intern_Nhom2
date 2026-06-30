"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Checkbox,
    IconButton, TextField, Select, MenuItem, CircularProgress,
    TablePagination, Autocomplete, InputAdornment, Divider, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions, Pagination, Tooltip, Paper
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Close as CloseIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSnackbar } from 'notistack';


import { useAccidentReportStyles } from '../logic/accident-report/style';
import { DoetService, periodicReportService } from '@tts/services';
import { useAuth } from '@core/contexts/AuthProvider';
import { EnterpriseAccidentReportPage } from './EnterpriseAccidentReportPage';
import { ConfirmDialog } from '@core/components/ConfirmDialog';

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
      <Box
        sx={{
          width: '24px',
          height: '24px',
          backgroundColor: '#f1f3f5',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handlePageSubmit();
            }
          }}
          onBlur={handlePageSubmit}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            textAlign: 'center',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#1e293b',
            padding: 0
          }}
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

    // History states
    const [historyDialogOpen, setHistoryDialogOpen] = useState<boolean>(false);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);
    const [historyItems, setHistoryItems] = useState<any[]>([]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
    const [commonReason, setCommonReason] = useState<string>('');
    const [actionType, setActionType] = useState<'DA_TIEP_NHAN' | 'HUY_TIEP_NHAN' | null>(null);

    const handleOpenHistory = async () => {
        const year = headerFilters.year || new Date().getFullYear();
        setHistoryDialogOpen(true);
        setHistoryLoading(true);
        setHistoryItems([]);
        try {
            const res = await periodicReportService.getHistoryByYear(year);
            setHistoryItems(res?.data || res || []);
        } catch (err) {
            console.error("Error loading report history", err);
            enqueueSnackbar("Lỗi khi tải lịch sử duyệt báo cáo", { variant: 'error' });
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleOpenHistoryForRow = async (id: number) => {
        setHistoryDialogOpen(true);
        setHistoryLoading(true);
        setHistoryItems([]);
        try {
            const res = await periodicReportService.getHistory(id);
            setHistoryItems(res?.data || res || []);
        } catch (err) {
            console.error("Error loading report history", err);
            enqueueSnackbar("Lỗi khi tải lịch sử duyệt báo cáo", { variant: 'error' });
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleConfirmAction = (type: 'DA_TIEP_NHAN' | 'HUY_TIEP_NHAN') => {
        setActionType(type);
        if (type === 'HUY_TIEP_NHAN') {
            setRejectReason('');
            setRejectReasons({});
            setCommonReason('');
            setCancelDialogOpen(true);
        } else {
            setConfirmOpen(true);
        }
    };

    const handleExecuteCancel = async () => {
        const missing = selectedIds.some(id => !rejectReasons[id] || !rejectReasons[id].trim());
        if (missing) {
            enqueueSnackbar("Vui lòng nhập lý do từ chối cho tất cả các báo cáo đã chọn", { variant: 'warning' });
            return;
        }
        setCancelDialogOpen(false);
        setLoading(true);

        // Optimistic UI update
        setData((prevData) =>
            prevData.map((item) =>
                selectedIds.includes(item.id)
                    ? { ...item, status: 'HUY_TIEP_NHAN', rejectReason: rejectReasons[item.id] || '' }
                    : item
            )
        );

        try {
            await Promise.all(
                selectedIds.map(id =>
                    periodicReportService.update(Number(id), {
                        status: 'HUY_TIEP_NHAN',
                        rejectReason: rejectReasons[id] || ''
                    })
                )
            );
            enqueueSnackbar("Từ chối báo cáo thành công", { variant: 'success' });
            setSelectedIds([]);
            setRejectReasons({});
            setCommonReason('');
            fetchData();
        } catch (error: any) {
            enqueueSnackbar(
                error?.response?.data?.message || error?.message || "Đã xảy ra lỗi khi từ chối",
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

    const startIndex = useMemo(
        () => (total === 0 ? 0 : tableFilters.limit * tableFilters.page + 1),
        [tableFilters.limit, tableFilters.page, total],
    );
    const endIndex = useMemo(
        () => Math.min(tableFilters.limit * (tableFilters.page + 1), total),
        [tableFilters.limit, tableFilters.page, total],
    );
    const totalPages = useMemo(
        () => Math.ceil(total / tableFilters.limit),
        [total, tableFilters.limit],
    );

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
        const selectable = data.filter((d: any) => d.status === 'CHO_XET_DUYET' || d.status === 'DA_TIEP_NHAN');
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
                        Chờ tiếp nhận
                    </Typography>
                </Box>
            );
        }
        if (status === 'HUY_TIEP_NHAN') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                    <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600 }}>
                        Bị từ chối
                    </Typography>
                </Box>
            );
        }
        if (status === 'HET_HAN') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                    <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                        Đã hết hạn
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
            <EnterpriseAccidentReportPage user={user} />
        );
    }

    const selectedItems = data.filter((item: any) => selectedIds.includes(item.id));
    const hasDaTiepNhan = selectedItems.some((item: any) => item.status === 'DA_TIEP_NHAN');
    const hasHuyTiepNhan = selectedItems.some((item: any) => item.status === 'HUY_TIEP_NHAN');

    return (
        <Box className={classes.root}>
                <Box className={classes.pageHeader}>
                    <Typography className={classes.headerTitle}>
                        Báo cáo định kỳ Tai nạn lao động
                    </Typography>
                    <Box className={classes.actions} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
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

                <Box className={classes.mainContent} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <Box className={classes.card} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

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

                        <Box className={classes.tableScroll} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox" className={classes.headerCell}>
                                                <Checkbox
                                                    size="small"
                                                    indeterminate={selectedIds.length > 0 && selectedIds.length < data.filter((d: any) => d.status === 'CHO_XET_DUYET' || d.status === 'DA_TIEP_NHAN').length}
                                                    checked={data.filter((d: any) => d.status === 'CHO_XET_DUYET' || d.status === 'DA_TIEP_NHAN').length > 0 && selectedIds.length === data.filter((d: any) => d.status === 'CHO_XET_DUYET' || d.status === 'DA_TIEP_NHAN').length}
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
                                                        { label: "Chờ tiếp nhận", value: "CHO_XET_DUYET" },
                                                        { label: "Đã tiếp nhận", value: "DA_TIEP_NHAN" },
                                                        { label: "Bị từ chối", value: "HUY_TIEP_NHAN" },
                                                        { label: "Đã hết hạn", value: "HET_HAN" }
                                                    ]}
                                                    getOptionLabel={(option) => option.label}
                                                    value={[
                                                        { label: "Chờ báo cáo", value: "CHO_BAO_CAO" },
                                                        { label: "Đang báo cáo", value: "DANG_BAO_CAO" },
                                                        { label: "Chờ tiếp nhận", value: "CHO_XET_DUYET" },
                                                        { label: "Đã tiếp nhận", value: "DA_TIEP_NHAN" },
                                                        { label: "Bị từ chối", value: "HUY_TIEP_NHAN" },
                                                        { label: "Đã hết hạn", value: "HET_HAN" }
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
                                                                disabled={item.status !== 'CHO_XET_DUYET' && item.status !== 'DA_TIEP_NHAN'}
                                                            />
                                                        </TableCell>
                                                        <TableCell className={classes.bodyCell}>
                                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                                <IconButton
                                                                    component={(item.status === 'CHO_BAO_CAO' || item.status === 'HET_HAN') ? 'button' : Link}
                                                                    href={(item.status === 'CHO_BAO_CAO' || item.status === 'HET_HAN') ? undefined : `/accident-reports/${item.id}`}
                                                                    size="small"
                                                                    className={classes.actionIcon}
                                                                    disabled={item.status === 'CHO_BAO_CAO' || item.status === 'HET_HAN'}
                                                                >
                                                                    <VisibilityIcon fontSize="small" />
                                                                </IconButton>
                                                                {item.status !== 'CHO_BAO_CAO' && item.status !== 'HET_HAN' && (
                                                                    <Tooltip title="Lịch sử duyệt/từ chối" arrow>
                                                                        <IconButton
                                                                            size="small"
                                                                            className={classes.actionIcon}
                                                                            onClick={() => handleOpenHistoryForRow(Number(item.id))}
                                                                        >
                                                                            <AccessTimeIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
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
                            <Select
                                size="small"
                                value={tableFilters.limit}
                                onChange={(e) => handleTableFilterChange('limit', Number(e.target.value))}
                                className={classes.pageSizeSelect}
                            >
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={20}>20</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                            </Select>
                            <Typography className={classes.pageInfo}>
                                {startIndex} - {endIndex} của {total}
                            </Typography>
                            <CustomPagination
                                page={tableFilters.page}
                                count={totalPages}
                                onChange={(page) => handleTableFilterChange('page', page)}
                                isZeroBased
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
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ff453a', fontWeight: 600 }}>
                        Lý do từ chối
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: '#555', mb: 2 }}>
                            Bạn có chắc chắn muốn từ chối {selectedIds.length} báo cáo đã chọn? Doanh nghiệp có thể chỉnh sửa và nộp lại báo cáo sau khi bị từ chối.
                        </Typography>

                        <Box sx={{ mb: 2.5, mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                placeholder="Nhập lý do áp dụng chung cho tất cả..."
                                value={commonReason}
                                onChange={(e) => setCommonReason(e.target.value)}
                                sx={{ flex: 1 }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    const newReasons: Record<string, string> = {};
                                    selectedIds.forEach(id => {
                                        newReasons[id] = commonReason;
                                    });
                                    setRejectReasons(newReasons);
                                }}
                                sx={{ height: 40, textTransform: 'none', fontWeight: 600 }}
                            >
                                Áp dụng cho tất cả
                            </Button>
                        </Box>

                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 300, overflowY: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Doanh nghiệp</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }} width={120}>Kỳ báo cáo</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }} width={100}>Năm</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '45%' }}>Lý do từ chối *</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.filter((item: any) => selectedIds.includes(item.id)).map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.companyName || '--'}</TableCell>
                                            <TableCell>{item.period === 'CA_NAM' ? 'Cả năm' : '6 tháng'}</TableCell>
                                            <TableCell>{item.year}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    variant="outlined"
                                                    placeholder="Nhập lý do từ chối..."
                                                    value={rejectReasons[item.id] || ''}
                                                    onChange={(e) => {
                                                        setRejectReasons(prev => ({
                                                            ...prev,
                                                            [item.id]: e.target.value
                                                        }));
                                                    }}
                                                    slotProps={{
                                                        input: {
                                                            style: { fontSize: '0.875rem' }
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
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

                {/* Dialog Lịch sử duyệt/từ chối */}
                <Dialog
                    open={historyDialogOpen}
                    onClose={() => setHistoryDialogOpen(false)}
                    maxWidth="xs"
                    fullWidth
                >
                    <DialogTitle
                        sx={{
                            backgroundColor: '#2f65f0',
                            color: '#ffffff',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            py: 1.5
                        }}
                    >
                        Tiến độ xử lý
                    </DialogTitle>
                    <DialogContent sx={{ py: 3, px: 4 }}>
                        {historyLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : historyItems.length === 0 ? (
                            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
                                Không có dữ liệu lịch sử duyệt cho báo cáo này.
                            </Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 380, overflowY: 'auto', pr: 1 }}>
                                {historyItems.map((item, index) => {
                                    const formatDate = (dateString: string) => {
                                        if (!dateString) return '';
                                        const d = new Date(dateString);
                                        if (isNaN(d.getTime())) return dateString;
                                        const day = String(d.getDate()).padStart(2, '0');
                                        const month = String(d.getMonth() + 1).padStart(2, '0');
                                        const year = d.getFullYear();
                                        const hours = String(d.getHours()).padStart(2, '0');
                                        const minutes = String(d.getMinutes()).padStart(2, '0');
                                        return `${day}/${month}/${year} ${hours}:${minutes}`;
                                    };

                                    return (
                                        <Box key={item.id} sx={{ display: 'flex', gap: 2 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: '50%',
                                                        border: '2px solid #a4b2cd',
                                                        backgroundColor: '#fff',
                                                        zIndex: 1,
                                                        mt: 0.5
                                                    }}
                                                />
                                                {index < historyItems.length - 1 && (
                                                    <Box
                                                        sx={{
                                                            width: '2px',
                                                            backgroundColor: '#cbd5e1',
                                                            flexGrow: 1,
                                                            my: 0.5,
                                                            minHeight: 40
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            <Box sx={{ pb: index < historyItems.length - 1 ? 3 : 1 }}>
                                                <Typography variant="caption" sx={{ color: '#778293', display: 'block', mb: 0.25, fontWeight: 500 }}>
                                                    {formatDate(item.createdAt)}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#111827', fontWeight: 500 }}>
                                                    <strong>{item.userName}</strong>{' '}
                                                    <span style={{ color: '#5b6982', fontWeight: 400 }}>
                                                        {item.status === 'CHO_XET_DUYET' && `đã gửi báo cáo (${item.report?.companyName || 'Doanh nghiệp'})`}
                                                        {item.status === 'DA_TIEP_NHAN' && `đã duyệt báo cáo của ${item.report?.companyName || 'Doanh nghiệp'}`}
                                                        {item.status === 'HUY_TIEP_NHAN' && `từ chối báo cáo của ${item.report?.companyName || 'Doanh nghiệp'}`}
                                                        {item.status === 'DANG_BAO_CAO' && `đang chỉnh sửa báo cáo (${item.report?.companyName || 'Doanh nghiệp'})`}
                                                    </span>
                                                </Typography>
                                                {item.status === 'HUY_TIEP_NHAN' && item.rejectReason && (
                                                    <Typography variant="body2" sx={{ color: '#ef4444', mt: 0.5, fontSize: '0.85rem' }}>
                                                        <span style={{ fontWeight: 600 }}>Lý do:</span> {item.rejectReason}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
                        <Button
                            onClick={() => setHistoryDialogOpen(false)}
                            variant="contained"
                            sx={{
                                backgroundColor: '#2f65f0',
                                color: '#fff',
                                textTransform: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                px: 3,
                                boxShadow: '0px 4px 12px rgba(47, 101, 240, 0.2)',
                                '&:hover': {
                                    backgroundColor: '#1e4fd1'
                                }
                            }}
                        >
                            Đóng
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
    );
}