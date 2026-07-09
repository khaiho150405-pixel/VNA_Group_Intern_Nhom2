"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios, { AxiosError } from "axios";
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
  IconButton,
  TextField,
  MenuItem,
  Select,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Switch,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import * as XLSX from "xlsx";

import { ConfirmDialog } from "@core/components/ConfirmDialog";
import { BulkSelectionBar } from "@core/components/BulkSelectionBar";
import { usePermission } from "@core/hooks/usePermission";

import { injuryFactorService } from "@tts/services";
import { useStyles } from "@tts/logic/common-category/style";

interface CustomPaginationProps {
  page: number;
  count: number;
  onChange: (newPage: number) => void;
}

const CustomPagination = ({ page, count, onChange }: CustomPaginationProps) => {
  const [val, setVal] = React.useState(String(page));

  React.useEffect(() => {
    setVal(String(page));
  }, [page]);

  const handlePageSubmit = () => {
    const p = parseInt(val, 10);
    if (!isNaN(p) && p >= 1 && p <= count) {
      onChange(p);
    } else {
      setVal(String(page));
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <IconButton size="small" onClick={() => onChange(page - 1)} disabled={page <= 1} sx={{ color: '#94a3b8', '&.Mui-disabled': { color: '#cbd5e1' }, p: '2px' }}>
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
      <IconButton size="small" onClick={() => onChange(page + 1)} disabled={page >= count} sx={{ color: '#94a3b8', '&.Mui-disabled': { color: '#cbd5e1' }, p: '2px' }}>
        <ChevronRightIcon sx={{ fontSize: '1.1rem' }} />
      </IconButton>
    </Box>
  );
};

interface InjuryFactor {
  id: number;
  code: string;
  name: string;
  status: boolean;
}

export const InjuryFactorView = React.forwardRef((props, ref) => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermission();



  React.useImperativeHandle(ref, () => ({
    openAdd: handleOpenAdd
  }));

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InjuryFactor[]>([]);
  const [total, setTotal] = useState(0);

  // Filters State
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 10,
    code: "",
    name: "",
    status: "",
  });

  // Bulk Selection & Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    status: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        code: filters.code || undefined,
        name: filters.name || undefined,
        status: filters.status !== "" ? filters.status : undefined,
      };

      const res: any = await injuryFactorService.getAll(params);
      const items = res?.data?.items || res?.items || res?.data?.data || res?.data || [];
      const totalCount = res?.data?.total || res?.total || res?.data?.count || res?.count || 0;
      setData(items);
      setTotal(totalCount);
    } catch (err) {
      console.error("Error fetching list", err);
      enqueueSnackbar("Lỗi khi tải danh sách", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [filters]);

  const handleFilterChange = (field: string, val: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [field]: val,
      page: field === "page" ? val : 1,
    }));
    if (field !== "page" && field !== "limit") {
      setSelectedIds([]);
    }
  };

  const handleSelectAll = () => {
    if (data.length === 0) return;
    const allChecked = data.every((item) => selectedIds.includes(String(item.id)));
    if (allChecked) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((item) => String(item.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteMany = async () => {
    setConfirmBulkDeleteOpen(false);
    try {
      setLoading(true);
      await injuryFactorService.deleteMany(selectedIds.map(Number));
      enqueueSnackbar("Xóa thành công", { variant: "success" });
      setSelectedIds([]);
      fetchList();
    } catch (err: unknown) {
      let msg = "Lỗi khi xóa";
      if (axios.isAxiosError(err)) {
        const d = (err as AxiosError<{ message?: string | string[]; error?: string; errors?: { message?: string | string[] } | string }>).response?.data;
        if (d?.errors) { msg = typeof d.errors === 'string' ? d.errors : (typeof d.errors === 'object' && d.errors.message ? (Array.isArray(d.errors.message) ? d.errors.message[0] : d.errors.message) : msg); }
        else if (d?.message) { msg = Array.isArray(d.message) ? d.message[0] : d.message; }
        else if (d?.error) { msg = d.error; }
      }
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      code: "",
      name: "",
      status: true,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: InjuryFactor) => {
    setEditId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      status: item.status !== undefined ? item.status : true,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!form.code || form.code.trim() === "") {
      errors.code = "Vui lòng nhập mã yếu tố";
    }
    if (!form.name || form.name.trim() === "") {
      errors.name = "Vui lòng nhập tên yếu tố chấn thương";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const checkCodeRes: any = await injuryFactorService.checkCode(form.code, editId || undefined);
      if (checkCodeRes?.data === true || checkCodeRes === true) {
        setFormErrors({ code: "Mã yếu tố đã tồn tại" });
        setLoading(false);
        return;
      }

      setFormErrors({});

      if (editId) {
        await injuryFactorService.update(editId, form);
        enqueueSnackbar("Cập nhật thành công", { variant: "success" });
      } else {
        await injuryFactorService.create(form);
        enqueueSnackbar("Thêm mới thành công", { variant: "success" });
      }
      setDialogOpen(false);
      fetchList();
    } catch (err: unknown) {
      let msg = "Lỗi khi lưu thông tin";
      if (axios.isAxiosError(err)) {
        const d = (err as AxiosError<{ message?: string | string[]; error?: string; errors?: { message?: string | string[] } | string }>).response?.data;
        if (d?.errors) { msg = typeof d.errors === 'string' ? d.errors : (typeof d.errors === 'object' && d.errors.message ? (Array.isArray(d.errors.message) ? d.errors.message[0] : d.errors.message) : msg); }
        else if (d?.message) { msg = Array.isArray(d.message) ? d.message[0] : d.message; }
        else if (d?.error) { msg = d.error; }
      }
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = useCallback(async (item: InjuryFactor) => {
    const previousStatus = item.status;
    const nextStatus = !previousStatus;

    // Optimistic UI update
    setData((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, status: nextStatus } : row
      )
    );

    try {
      await injuryFactorService.update(item.id, { ...item, status: nextStatus });
      enqueueSnackbar("Cập nhật trạng thái thành công.", { variant: "success" });
      fetchList();
    } catch (error: unknown) {
      // Rollback UI on failure
      setData((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, status: previousStatus } : row
        )
      );

      // Extract error message from backend response
      let errorMessage = "Cập nhật trạng thái thất bại.";

      if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError<{
          message?: string | string[];
          error?: string;
          errors?: { message?: string | string[] } | string;
        }>;
        const responseData = axiosErr.response?.data;

        if (responseData) {
          // Priority 1: errors.message (from custom ServiceErrorsFilter)
          if (responseData.errors) {
            if (typeof responseData.errors === "string") {
              errorMessage = responseData.errors;
            } else if (
              typeof responseData.errors === "object" &&
              responseData.errors.message
            ) {
              const errMsg = responseData.errors.message;
              errorMessage = Array.isArray(errMsg) ? errMsg[0] : errMsg;
            }
          }
          // Priority 2: response.data.message (string or array)
          else if (responseData.message) {
            errorMessage = Array.isArray(responseData.message)
              ? responseData.message[0]
              : responseData.message;
          }
          // Priority 3: response.data.error
          else if (responseData.error) {
            errorMessage = responseData.error;
          }
        }

        // Debug logging only in development
        if (process.env.NODE_ENV === "development") {
          console.debug("[InjuryFactor Status Toggle] Debug Info:", {
            httpStatus: axiosErr.response?.status,
            responseBody: responseData,
            requestUrl: axiosErr.config?.url,
            requestPayload: axiosErr.config?.data,
          });
        }
      }

      enqueueSnackbar(errorMessage, { variant: "error" });
    }
  }, [enqueueSnackbar]);

  const isAllSelected = data.length > 0 && data.every((item) => selectedIds.includes(String(item.id)));
  const isIndeterminate = !isAllSelected && data.some((item) => selectedIds.includes(String(item.id)));

  const startIndex = useMemo(() => {
    if (total === 0) return 0;
    return (filters.page - 1) * filters.limit + 1;
  }, [filters.page, filters.limit, total]);

  const endIndex = useMemo(() => {
    return Math.min(total, filters.page * filters.limit);
  }, [filters.page, filters.limit, total]);

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      enqueueSnackbar('Không có dữ liệu để xuất!', { variant: 'error' });
      return;
    }

    const dataToExport = data.map((item: any, index: number) => ({
      "STT": (filters.page - 1) * filters.limit + index + 1,
      "Mã yếu tố": item.code || '',
      "Yếu tố gây chấn thương": item.name || '',
      "Trạng thái": item.status ? 'Sử dụng' : 'Không sử dụng'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 45 }, { wch: 20 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "YeuToChanThuong");
    XLSX.writeFile(workbook, "Danh_sach_yeu_to_chan_thuong.xlsx");
    enqueueSnackbar('Xuất file Excel thành công!', { variant: 'success' });
  };

  return (
    <React.Fragment>
      <Box className={classes.tableScroll} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {hasPermission('ADMIN_C_CATEGORY_DELETE') && (
                  <TableCell padding="checkbox" className={classes.headerCell} width={50}>
                    <Checkbox
                      size="small"
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                <TableCell className={classes.headerCell} width={150}>Mã yếu tố</TableCell>
                <TableCell className={classes.headerCell}>Yếu tố gây chấn thương</TableCell>
                <TableCell className={classes.headerCell} width={150} align="center">Trạng thái</TableCell>
              </TableRow>

              <TableRow>
                {hasPermission('ADMIN_C_CATEGORY_DELETE') && (
                  <TableCell className={classes.filterCell}></TableCell>
                )}
                <TableCell className={classes.filterCell}>
                  <TextField
                    className={classes.filterField}
                    size="small"
                    fullWidth
                    placeholder="Mã yếu tố"
                    value={filters.code}
                    onChange={(e) => handleFilterChange("code", e.target.value)}
                  />
                </TableCell>
                <TableCell className={classes.filterCell}>
                  <TextField
                    className={classes.filterField}
                    size="small"
                    fullWidth
                    placeholder="Tên yếu tố chấn thương"
                    value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                  />
                </TableCell>
                <TableCell className={classes.filterCell}>
                  <Autocomplete
                    size="small"
                    options={[
                      { label: 'Sử dụng', value: 'true' },
                      { label: 'Không sử dụng', value: 'false' }
                    ]}
                    getOptionLabel={(option) => option.label || ""}
                    value={[
                      { label: 'Sử dụng', value: 'true' },
                      { label: 'Không sử dụng', value: 'false' }
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
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasPermission('ADMIN_C_CATEGORY_DELETE') ? 4 : 3} align="center" sx={{ py: 3, color: "#94a3b8" }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} hover selected={selectedIds.includes(String(item.id))}>
                    {hasPermission('ADMIN_C_CATEGORY_DELETE') && (
                      <TableCell padding="checkbox" className={classes.bodyCell}>
                        <Checkbox
                          size="small"
                          checked={selectedIds.includes(String(item.id))}
                          onChange={() => handleSelectOne(String(item.id))}
                        />
                      </TableCell>
                    )}
                    <TableCell className={classes.bodyCell} sx={{ color: '#333' }}>
                      {item.code}
                    </TableCell>
                    <TableCell className={classes.bodyCell}>{item.name}</TableCell>
                    <TableCell className={classes.bodyCell} align="center">
                      <Switch
                        size="small"
                        checked={item.status}
                        disabled={!hasPermission('ADMIN_C_CATEGORY_UPDATE')}
                        onChange={() => handleStatusToggle(item)}
                        color="primary"
                      />
                    </TableCell>
                  </TableRow>
                ))
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
          Xuất dữ liệu
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
          onChange={(p) => handleFilterChange("page", p)}
        />
      </Box>

      {selectedIds.length > 0 && hasPermission('ADMIN_C_CATEGORY_DELETE') && (
        <BulkSelectionBar
          count={selectedIds.length}
          onDelete={() => setConfirmBulkDeleteOpen(true)}
          onClose={() => setSelectedIds([])}
        />
      )}

      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} mục đã chọn?`}
        onCancel={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={handleDeleteMany}
        confirmText="Xóa"
      />

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#1e293b' }}>
            {editId ? "Chỉnh sửa yếu tố chấn thương" : "Thêm mới yếu tố chấn thương"}
          </Typography>
          <IconButton size="small" onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Mã yếu tố chấn thương *"
              placeholder="Nhập mã yếu tố"
              value={form.code}
              onChange={(e) => {
                setForm({ ...form, code: e.target.value });
                if (formErrors.code) setFormErrors({ ...formErrors, code: "" });
              }}
              error={!!formErrors.code}
              helperText={formErrors.code}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              fullWidth
              size="small"
              label="Tên yếu tố chấn thương *"
              placeholder="Nhập tên yếu tố"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
              }}
              error={!!formErrors.name}
              helperText={formErrors.name}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              fullWidth
              select
              size="small"
              label="Trạng thái *"
              value={form.status ? "true" : "false"}
              onChange={(e) => setForm({ ...form, status: e.target.value === "true" })}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="true">Sử dụng</MenuItem>
              <MenuItem value="false">Không sử dụng</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              px: 3,
              color: '#666',
              border: '1px solid #dfe3eb',
              fontWeight: 600,
              fontSize: '0.85rem',
              '&:hover': {
                backgroundColor: '#f8fafc',
                borderColor: '#cbd5e1'
              }
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: "#2f65f0",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "#1e4fd1",
              },
            }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
});

export default InjuryFactorView;
