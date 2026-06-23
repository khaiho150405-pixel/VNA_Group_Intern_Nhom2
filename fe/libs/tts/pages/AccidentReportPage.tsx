"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Checkbox,
    IconButton, TextField, Select, MenuItem, CircularProgress,
    TablePagination, Autocomplete, InputAdornment, Divider, Grid
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSnackbar } from 'notistack';

import { MainLayout } from '@core/layouts/MainLayout';
import { useAccidentReportStyles } from '../logic/accident-report/style';
import { DoetService, periodicReportService } from '@tts/services';
import { useAuth } from '@core/contexts/AuthProvider';
import { EnterpriseAccidentReportPage } from './EnterpriseAccidentReportPage';

export const AccidentReportPage = () => {
    const classes = useAccidentReportStyles();
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();

    const isSo = (user as any)?.role?.type === 'SO';

    if (!isSo) {
        return (
            <MainLayout>
                <EnterpriseAccidentReportPage user={user} />
            </MainLayout>
        );
    }


    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
    }, []);

    useEffect(() => {
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
    }, [headerFilters.province]);

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
        fetchData();
    }, [headerFilters, tableFilters]);

    const handleTableFilterChange = (field: string, value: any) => {
        setTableFilters((prev) => ({
            ...prev,
            [field]: value,
            page: field === 'page' ? value : 0,
        }));
        setSelectedIds([]);
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

    const renderStatus = (status: string) => {
        if (status === 'DANG_BAO_CAO') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#94a3b8' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Đang báo cáo
                    </Typography>
                </Box>
            );
        }
        if (status === 'CHO_BAO_CAO') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Chờ báo cáo
                    </Typography>
                </Box>
            );
        }
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                    Đã tiếp nhận
                </Typography>
            </Box>
        );
    };

    return (
        <MainLayout>
            <Box className={classes.root}>
                <Box className={classes.pageHeader}>
                    <Typography className={classes.headerTitle}>
                        Báo cáo định kỳ Tai nạn lao động
                    </Typography>
                    <Box className={classes.actions}>
                        <Select
                            size="small"
                            value={headerFilters.year}
                            onChange={(e) => setHeaderFilters(p => ({ ...p, year: Number(e.target.value) }))}
                            className={classes.filterField}
                            sx={{ minWidth: 100 }}
                        >
                            {years.map(y => (
                                <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                        </Select>
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
                                                    indeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                                                    checked={data.length > 0 && selectedIds.length === data.length}
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
                                                <Select
                                                    size="small"
                                                    fullWidth
                                                    displayEmpty
                                                    className={classes.filterField}
                                                    value={tableFilters.reportPeriod}
                                                    onChange={(e) => handleTableFilterChange('reportPeriod', e.target.value)}
                                                >
                                                    <MenuItem value="">Tất cả</MenuItem>
                                                    <MenuItem value="6_THANG">6 tháng</MenuItem>
                                                    <MenuItem value="CA_NAM">Cả năm</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell className={classes.filterCell}>
                                                <Select
                                                    size="small"
                                                    fullWidth
                                                    displayEmpty
                                                    className={classes.filterField}
                                                    value={tableFilters.status}
                                                    onChange={(e) => handleTableFilterChange('status', e.target.value)}
                                                >
                                                    <MenuItem value="">Tất cả</MenuItem>
                                                    <MenuItem value="CHO_BAO_CAO">Chờ báo cáo</MenuItem>
                                                    <MenuItem value="DANG_BAO_CAO">Đang báo cáo</MenuItem>
                                                    <MenuItem value="DA_TIEP_NHAN">Đã tiếp nhận</MenuItem>
                                                </Select>
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
                                                            />
                                                        </TableCell>
                                                        <TableCell className={classes.bodyCell}>
                                                            <IconButton
                                                                component={item.status === 'CHO_BAO_CAO' ? 'button' : Link}
                                                                href={item.status === 'CHO_BAO_CAO' ? undefined : `/accident-reports/${item.id}`}
                                                                size="small"
                                                                className={classes.actionIcon}
                                                                disabled={item.status === 'CHO_BAO_CAO'}
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
            </Box>
        </MainLayout>
    );
}