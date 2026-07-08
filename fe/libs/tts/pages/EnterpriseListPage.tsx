"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Checkbox,
  IconButton,
  TextField,
  MenuItem,
  Select,
  Switch,
  Pagination,
  Tooltip,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Key as KeyIcon,
  Add as AddIcon,
  FileUpload as UploadIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";


import { BulkSelectionBar } from "@core/components/BulkSelectionBar";
import { DoetService } from "@tts/services";
import { ResetPasswordModal } from "@tts/components/ResetPasswordModal";
import {
  Doet,
  DoetFilters,
  LoaiHinhKinhDoanh,
  BusinessLine,
} from "@shared/tts/models";
import { useEnterpriseListStyles } from "../logic/enterprise/style";
import { ConfirmDialog } from "@core/components/ConfirmDialog";
import { useAuth } from "@core/contexts/AuthProvider";
import { usePermission } from "@core/hooks/usePermission";
import { normalizeListResponse } from "@core/utils/helper";

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

interface WardOption {
  key: string;
  value: string;
}

export const EnterpriseListPage = () => {
  const classes = useEnterpriseListStyles();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  const isReadOnly = useMemo(() => {
    if (!user) return true;
    if (user.username === 'testuser') return false;
    return !hasPermission('ADMIN_C_DEPARTMENT_UPDATE');
  }, [user, hasPermission]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Doet[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<DoetFilters>({
    page: 1,
    limit: 10,
    name: "",
    taxCode: "",
    status: "",
  });

  const [loaiHinhs, setLoaiHinhs] = useState<LoaiHinhKinhDoanh[]>([]);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [resetModal, setResetModal] = useState<{
    open: boolean;
    id: number | null;
    name: string;
  }>({ open: false, id: null, name: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await DoetService.getList(filters);
      const items = normalizeListResponse(res);
      const totalCount =
        (res as any)?.total ??
        (res as any)?.data?.total ??
        (res as any)?.data?.count ??
        items.length;
      setData(items);
      setTotal(Number(totalCount) || 0);
    } catch (error) {
      enqueueSnackbar("Lỗi khi tải dữ liệu doanh nghiệp", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [lh, bl, w] = await Promise.all([
        DoetService.getLoaiHinhKinhDoanh(),
        DoetService.getBusinessLines(),
        DoetService.getDistinctWards(),
      ]);
      setLoaiHinhs(normalizeListResponse(lh));
      setBusinessLines(normalizeListResponse(bl));
      setWards(normalizeListResponse(w));
    } catch (error) {
      console.error("Error fetching dropdowns", error);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleFilterChange = (field: keyof DoetFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field === "page" ? value : 1,
    }));
    if (field !== "page" && field !== "limit") setSelectedIds([]);
  };

  const handleSelectAll = () => {
    const selectable = data.filter((d) => d.id !== undefined && d.id !== null);
    const allChecked = selectable.length > 0 && selectable.every((d) => selectedIds.includes(d.id!));

    if (allChecked || selectedIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectable.map((d) => d.id!));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleStatusChange = async (id: number, currentStatus: string) => {
    try {
      // Guard: Chỉ Admin/Lãnh đạo được đổi trạng thái
      const realRole = ((user as any)?.realRole || '').toLowerCase();
      const roleId = (user as any)?.roleId || (user as any)?.role?.id;
      const isAdminOrLeader = realRole.includes('quản trị') || realRole.includes('admin') || 
                              realRole.includes('lãnh đạo') || realRole.includes('leader') || roleId === 4;
      if (!isAdminOrLeader) {
        enqueueSnackbar("Chỉ Admin hoặc Lãnh đạo mới được phép thay đổi trạng thái", { variant: "error" });
        return;
      }
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

      // Optimistic update
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus as any } : item,
        ),
      );

      await DoetService.update(id, { status: newStatus as any });
      enqueueSnackbar("Cập nhật trạng thái thành công", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Chuyên viên không được phép thay đổi trạng thái doanh nghiệp", { variant: "error" });
      fetchData();
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Guard: Chỉ Admin/Lãnh đạo được xóa
      const realRole = ((user as any)?.realRole || '').toLowerCase();
      const roleId = (user as any)?.roleId || (user as any)?.role?.id;
      const isAdminOrLeader = realRole.includes('quản trị') || realRole.includes('admin') || 
                              realRole.includes('lãnh đạo') || realRole.includes('leader') || roleId === 4;
      if (!isAdminOrLeader) {
        enqueueSnackbar("Chỉ Admin hoặc Lãnh đạo mới được phép xóa doanh nghiệp", { variant: "error" });
        setConfirmDeleteOpen(false);
        return;
      }
      await DoetService.deleteMany(selectedIds);
      enqueueSnackbar("Xoá thành công", { variant: "success" });
      setSelectedIds([]);
      setConfirmDeleteOpen(false);
      fetchData();
    } catch (error) {
      enqueueSnackbar("Chuyên viên không được phép xóa doanh nghiệp", { variant: "error" });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const res: any = await DoetService.importExcel(file);
      const items = res?.data || res || [];

      if (!Array.isArray(items) || items.length === 0) {
        enqueueSnackbar('Không tìm thấy dữ liệu trong file', { variant: 'warning' });
        return;
      }

      if (items.length === 1) {
        sessionStorage.setItem('pending_import_doet', JSON.stringify(items[0]));
        router.push('/doets/create?mode=import');
      } else {
        await Promise.all(items.map(item => DoetService.create(item)));
        enqueueSnackbar(`Đã thêm ${items.length} doanh nghiệp thành công`, { variant: 'success' });
        fetchData();
      }
    } catch (error) {
      enqueueSnackbar('Lỗi khi xử lý file', { variant: 'error' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startIndex = useMemo(
    () => (total === 0 ? 0 : (filters.limit || 10) * ((filters.page || 1) - 1) + 1),
    [filters, total],
  );
  const endIndex = useMemo(
    () => Math.min((filters.limit || 10) * (filters.page || 1), total),
    [filters, total],
  );

  const selectable = useMemo(() => {
    return data.filter((d) => d.id !== undefined && d.id !== null);
  }, [data]);

  const isAllSelected =
    selectable.length > 0 && selectable.every((d) => selectedIds.includes(d.id!));
  const isIndeterminate =
    !isAllSelected && selectable.some((d) => selectedIds.includes(d.id!));

  // Cấu hình các cột của bảng để dễ dàng chỉnh sửa độ rộng và thuộc tính
  const columns = [
    { id: 'name', label: 'Tên doanh nghiệp', width: '20%', minWidth: 150 },
    { id: 'taxCode', label: 'Mã số thuế', width: '12%', minWidth: 120 },
    { id: 'loaiHinh', label: 'Loại hình kinh doanh', width: '10%', minWidth: 120 },
    { id: 'businessLine', label: 'Ngành nghề kinh doanh', width: '20%', minWidth: 180 },
    { id: 'ward', label: 'Phường/ xã', width: '12%', minWidth: 120 },
    { id: 'status', label: 'Trạng thái', width: '10%', minWidth: 100, align: 'center' as const },
  ];

  return (
    <Box className={classes.root}>
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept=".xlsx, .xls"
          onChange={handleImport}
        />
        <Box className={classes.pageHeader}>
          <Typography className={classes.headerTitle}>
            Danh sách doanh nghiệp
          </Typography>
          <Box className={classes.actions}>
            {hasPermission('ADMIN_C_DEPARTMENT_CREATE') && (
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
                  onClick={() => router.push("/doets/create")}
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
                        {!isReadOnly && (
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
                          value={filters.name || ""}
                          onChange={(e) => handleFilterChange("name", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Tìm kiếm..."
                          className={classes.filterField}
                          value={filters.taxCode || ""}
                          onChange={(e) => handleFilterChange("taxCode", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <Autocomplete
                          size="small"
                          options={Array.isArray(loaiHinhs) ? loaiHinhs : []}
                          getOptionLabel={(option) => option.tenloaihinh || ""}
                          value={loaiHinhs.find(lh => lh.id === filters.loaiHinhId) || null}
                          onChange={(_, newValue) =>
                            handleFilterChange("loaiHinhId", newValue?.id)
                          }
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Tất cả" className={classes.filterField} />
                          )}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <Autocomplete
                          size="small"
                          options={Array.isArray(businessLines) ? businessLines : []}
                          getOptionLabel={(option) => option ? `${option.manganh} - ${option.tennganh}` : ""}
                          value={businessLines.find(bl => bl.id === filters.businessLineId) || null}
                          onChange={(_, newValue) =>
                            handleFilterChange("businessLineId", newValue?.id)
                          }
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Tất cả" className={classes.filterField} />
                          )}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <Autocomplete
                          size="small"
                          options={Array.isArray(wards) ? wards : []}
                          getOptionLabel={(option: WardOption) => option.value || ""}
                          isOptionEqualToValue={(opt: WardOption, val: WardOption) => opt.key === val.key}
                          value={wards.find((w: WardOption) => String(w.key) === filters.wardId) || null}
                          onChange={(_, newValue: WardOption | null) =>
                            handleFilterChange(
                              "wardId",
                              newValue?.key ? String(newValue.key) : undefined,
                            )
                          }
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
                        <Autocomplete
                          size="small"
                          options={[
                            { label: "Hoạt động", value: "ACTIVE" },
                            { label: "Ngưng hoạt động", value: "INACTIVE" }
                          ]}
                          getOptionLabel={(option) => option.label}
                          value={[
                            { label: "Hoạt động", value: "ACTIVE" },
                            { label: "Ngưng hoạt động", value: "INACTIVE" }
                          ].find(s => s.value === filters.status) || null}
                          onChange={(_, newValue) =>
                            handleFilterChange("status", newValue?.value)
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
                        const checked = selectedIds.includes(item.id!);
                        return (
                          <TableRow
                            key={item.id}
                            hover
                            className={checked ? classes.rowSelected : ""}
                          >
                            <TableCell padding="checkbox" className={classes.bodyCell}>
                              {!isReadOnly && (
                                <Checkbox
                                  size="small"
                                  checked={checked}
                                  onChange={() => handleSelectOne(item.id!)}
                                />
                              )}
                            </TableCell>
                            <TableCell className={classes.bodyCell}>
                              <Box sx={{ display: "flex", gap: 0.25 }}>
                                <Tooltip title="Xem chi tiết">
                                  <IconButton
                                    size="small"
                                    className={classes.actionIcon}
                                    onClick={() => router.push(`/doets/${item.id}`)}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {!isReadOnly && (
                                  <>
                                    <Tooltip title="Chỉnh sửa">
                                      <IconButton
                                        size="small"
                                        className={classes.actionIcon}
                                        onClick={() => router.push(`/doets/edit/${item.id}`)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Cấp lại mật khẩu">
                                      <IconButton
                                        size="small"
                                        className={classes.actionIcon}
                                        onClick={() =>
                                          setResetModal({
                                            open: true,
                                            id: item.id!,
                                            name: item.taxCode || item.name,
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
                            <TableCell className={classes.bodyCell}>{item.name}</TableCell>
                            <TableCell className={classes.bodyCell}>{item.taxCode}</TableCell>
                            <TableCell className={classes.bodyCell}>
                              {item.loaiHinhKinhDoanh?.tenloaihinh || "-"}
                            </TableCell>
                            <TableCell className={classes.bodyCell}>
                              {item.businessLine ? `${item.businessLine.manganh} - ${item.businessLine.tennganh}` : "-"}
                            </TableCell>
                            <TableCell className={classes.bodyCell}>
                              {item.ward?.value || "-"}
                            </TableCell>
                            <TableCell className={classes.bodyCell} align="center">
                              <Switch
                                size="small"
                                disabled={isReadOnly}
                                checked={item.status === "ACTIVE"}
                                onChange={() => handleStatusChange(item.id!, item.status)}
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
              <Select
                size="small"
                value={filters.limit ?? 10}
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
                 count={Math.max(1, Math.ceil(total / (filters.limit || 10)))}
                 page={filters.page || 0}
                 onChange={(page) => handleFilterChange("page", page)}
               />
            </Box>
          </Box>
        </Box>

        <ConfirmDialog
          open={confirmDeleteOpen}
          title="Xác nhận xóa"
          message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} doanh nghiệp đã chọn? Hành động này không thể hoàn tác.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
          confirmText="Xóa"
        />
        {hasPermission('ADMIN_C_DEPARTMENT_DELETE') && (
          <BulkSelectionBar
            count={selectedIds.length}
            onDelete={() => setConfirmDeleteOpen(true)}
            onClose={() => setSelectedIds([])}
          />
        )}

        <ResetPasswordModal
          open={resetModal.open}
          onClose={() => setResetModal((prev) => ({ ...prev, open: false }))}
          enterpriseId={resetModal.id}
          enterpriseName={resetModal.name}
        />
      </Box>
  );
};
