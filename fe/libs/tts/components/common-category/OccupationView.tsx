"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Save as SaveIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useStyles } from "@tts/logic/common-category/style";

import { ConfirmDialog } from "@core/components/ConfirmDialog";
import { BulkSelectionBar } from "@core/components/BulkSelectionBar";
import { usePermission } from "@core/hooks/usePermission";

import { occupationService } from "@tts/services";

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

interface Occupation {
  id: number;
  manghe: string;
  tennghe: string;
  cap: number;
  trangthai?: string;
}

const getDashPrefix = (cap: number): string => {
  if (cap === 2) return "— ";
  if (cap === 3) return "—— ";
  if (cap === 4) return "——— ";
  return "";
};

const DialogAny = Dialog as any;
const TextFieldAny = TextField as any;
const AutocompleteAny = Autocomplete as any;

export const OccupationView = React.forwardRef((props, ref) => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermission();

  const getErrorMessage = (err: any, defaultMsg: string) => {
    const data = err?.response?.data;
    if (data) {
      if (data.errors) {
        if (typeof data.errors === 'string') return data.errors;
        if (typeof data.errors === 'object') {
          const msg = data.errors.message;
          if (msg) return Array.isArray(msg) ? msg[0] : msg;
        }
      }
      if (data.message) {
        return Array.isArray(data.message) ? data.message[0] : data.message;
      }
    }
    return err?.message || defaultMsg;
  };

  React.useImperativeHandle(ref, () => ({
    openAdd: handleOpenAdd
  }));

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Occupation[]>([]);
  const [total, setTotal] = useState(0);

  // Filters State
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 10,
    manghe: "",
    tennghe: "",
    cap: "",
    trangthai: "",
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  // Dialog Add/Edit State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Occupation, "id">>({
    manghe: "",
    tennghe: "",
    cap: 1,
    trangthai: "ACTIVE",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [allOccupations, setAllOccupations] = useState<Occupation[]>([]);

  const fetchAllOccupations = async () => {
    try {
      const res: any = await occupationService.getAll({ pageSize: 1000 });
      const items = res?.data?.items || res?.items || [];
      setAllOccupations(items);
    } catch (err) {
      console.error("Error fetching all occupations", err);
    }
  };

  useEffect(() => {
    fetchAllOccupations();
  }, []);

  const handleMaNgheChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, "").slice(0, 4);
    setForm((prev) => ({
      ...prev,
      manghe: cleanVal,
      cap: cleanVal.length || 1,
    }));
    if (formErrors.manghe) setFormErrors((prev) => ({ ...prev, manghe: "" }));
  };

  const parentGroup = useMemo(() => {
    const code = form.manghe.trim();
    if (code.length <= 1) return null;
    const parentCode = code.slice(0, -1);
    return allOccupations.find((item) => item.manghe === parentCode) || null;
  }, [form.manghe, allOccupations]);

  const parentNotFound = useMemo(() => {
    const code = form.manghe.trim();
    return code.length > 1 && !parentGroup;
  }, [form.manghe, parentGroup]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const where: any = {};
      if (filters.manghe) where.ma_nghe = { operation: "like", value: `%${filters.manghe}%` };
      if (filters.tennghe) where.ten_nghe = { operation: "like", value: `%${filters.tennghe}%` };
      if (filters.cap) where.cap = { operation: "=", value: Number(filters.cap) };
      if (filters.trangthai) where.trang_thai = { operation: "=", value: filters.trangthai };

      const params = {
        pageNumber: filters.page - 1,
        pageSize: filters.limit,
        where: JSON.stringify(where)
      };

      const res: any = await occupationService.getAll(params);
      const items = res?.data?.items || res?.items || [];
      const totalCount = res?.data?.totalCount ?? res?.totalCount ?? 0;

      setData(items);
      setTotal(totalCount);
    } catch (error) {
      enqueueSnackbar("Lỗi khi tải danh sách nghề nghiệp", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [filters]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [field]: value,
      page: field === "page" ? value : 1
    }));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(data.map(item => String(item.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      manghe: "",
      tennghe: "",
      cap: 1,
      trangthai: "ACTIVE",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Occupation) => {
    setEditId(item.id);
    setForm({
      manghe: item.manghe,
      tennghe: item.tennghe,
      cap: item.cap,
      trangthai: item.trangthai || "ACTIVE",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleConfirmDelete = (id: number) => {
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteOne = async () => {
    if (!deleteId) return;
    try {
      await occupationService.delete(deleteId);
      enqueueSnackbar("Xóa nghề nghiệp thành công", { variant: "success" });
      setConfirmDeleteOpen(false);
      fetchList();
      fetchAllOccupations();
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error, "Lỗi khi xóa nghề nghiệp"), { variant: "error" });
    }
  };

  const handleDeleteMany = async () => {
    if (selectedIds.length === 0) return;
    try {
      await occupationService.deleteMany(selectedIds.map(Number));
      enqueueSnackbar("Xóa các nghề nghiệp thành công", { variant: "success" });
      setConfirmBulkDeleteOpen(false);
      setSelectedIds([]);
      fetchList();
      fetchAllOccupations();
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error, "Lỗi khi xóa danh sách nghề nghiệp"), { variant: "error" });
    }
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    const trimmedMa = form.manghe.trim();
    const trimmedTen = form.tennghe.trim();

    if (!trimmedMa) {
      errors.manghe = "Mã nghề nghiệp không được để trống";
    } else if (trimmedMa.length < 1 || trimmedMa.length > 4) {
      errors.manghe = "Mã nghề chỉ được nhập từ 1-4 ký tự";
    } else if (trimmedMa.length > 1 && !parentGroup) {
      errors.manghe = "Không có nhóm nghề cha";
    }

    if (!trimmedTen) {
      errors.tennghe = "Tên nghề nghiệp không được để trống";
    }

    // Local duplicate check
    if (editId === null) {
      const codeExists = allOccupations.some((item) => item.manghe === trimmedMa);
      if (codeExists) errors.manghe = "Mã nghề nghiệp đã tồn tại";

      const nameExists = allOccupations.some((item) => item.tennghe === trimmedTen);
      if (nameExists) errors.tennghe = "Tên nghề nghiệp đã tồn tại";
    } else {
      const nameExists = allOccupations.some((item) => item.tennghe === trimmedTen && item.id !== editId);
      if (nameExists) errors.tennghe = "Tên nghề nghiệp đã tồn tại";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const submitForm = {
        manghe: trimmedMa,
        tennghe: trimmedTen,
        cap: form.cap,
        trangthai: form.trangthai,
      };

      if (editId !== null) {
        await occupationService.update(editId, submitForm);
        enqueueSnackbar("Cập nhật nghề nghiệp thành công", { variant: "success" });
      } else {
        await occupationService.create(submitForm);
        enqueueSnackbar("Thêm mới nghề nghiệp thành công", { variant: "success" });
      }
      setDialogOpen(false);
      fetchList();
      fetchAllOccupations();
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error, "Lỗi khi lưu thông tin nghề nghiệp"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (item: Occupation) => {
    const nextStatus = item.trangthai === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await occupationService.update(item.id, { ...item, trangthai: nextStatus });
      enqueueSnackbar("Cập nhật trạng thái thành công", { variant: "success" });
      fetchList();
      fetchAllOccupations();
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error, "Lỗi khi cập nhật trạng thái"), { variant: "error" });
    }
  };

  const isAllSelected = data.length > 0 && data.every((item) => selectedIds.includes(String(item.id)));
  const isIndeterminate = !isAllSelected && data.some((item) => selectedIds.includes(String(item.id)));

  const startIndex = useMemo(() => {
    if (total === 0) return 0;
    return (filters.page - 1) * filters.limit + 1;
  }, [filters.page, filters.limit, total]);

  const endIndex = useMemo(() => {
    return Math.min(total, filters.page * filters.limit);
  }, [filters.page, filters.limit, total]);

  return (
    <React.Fragment>
      <Box className={classes.tableScroll} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader size="small">
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
                <TableCell className={classes.headerCell} align="center" style={{ width: 80 }}>Thao tác</TableCell>
                <TableCell className={classes.headerCell} style={{ width: 150 }}>Mã nghề</TableCell>
                <TableCell className={classes.headerCell}>Tên nghề nghiệp</TableCell>
                <TableCell className={classes.headerCell} align="center" style={{ width: 120 }}>Cấp</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className={classes.filterCell} />
                <TableCell className={classes.filterCell} />
                <TableCell className={classes.filterCell}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Lọc mã..."
                    value={filters.manghe}
                    onChange={(e) => handleFilterChange("manghe", e.target.value)}
                    className={classes.filterField}
                  />
                </TableCell>
                <TableCell className={classes.filterCell}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Lọc tên..."
                    value={filters.tennghe}
                    onChange={(e) => handleFilterChange("tennghe", e.target.value)}
                    className={classes.filterField}
                  />
                </TableCell>
                <TableCell className={classes.filterCell}>
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={filters.cap}
                    onChange={(e) => handleFilterChange("cap", e.target.value)}
                    className={classes.filterField}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="1">Cấp 1</MenuItem>
                    <MenuItem value="2">Cấp 2</MenuItem>
                    <MenuItem value="3">Cấp 3</MenuItem>
                    <MenuItem value="4">Cấp 4</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" className={classes.bodyCell}>
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" className={classes.bodyCell}>
                    Không tìm thấy nghề nghiệp nào.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} hover selected={selectedIds.includes(String(item.id))}>
                    <TableCell padding="checkbox" className={classes.bodyCell}>
                      <Checkbox
                        size="small"
                        checked={selectedIds.includes(String(item.id))}
                        onChange={() => handleSelectOne(String(item.id))}
                      />
                    </TableCell>
                    <TableCell className={classes.bodyCell} align="center">
                      {hasPermission('ADMIN_C_CATEGORY_UPDATE') && (
                        <IconButton className={classes.actionIcon} onClick={() => handleOpenEdit(item)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell className={classes.bodyCell}>{item.manghe}</TableCell>
                    <TableCell className={classes.bodyCell}>{getDashPrefix(item.cap)}{item.tennghe}</TableCell>
                    <TableCell className={classes.bodyCell} align="center">Cấp {item.cap}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Pagination Footer */}
      <Box className={classes.footer}>
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
          {startIndex} - {endIndex} của {total}
        </Typography>
        <CustomPagination
          count={Math.max(1, Math.ceil(total / filters.limit))}
          page={filters.page}
          onChange={(p) => handleFilterChange("page", p)}
        />
      </Box>

      {/* Bulk Selection Actions */}
      {selectedIds.length > 0 && hasPermission('ADMIN_C_CATEGORY_DELETE') && (
        <BulkSelectionBar
          count={selectedIds.length}
          onDelete={() => setConfirmBulkDeleteOpen(true)}
          onClose={() => setSelectedIds([])}
        />
      )}

      {/* Dialog Confirmations */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa nghề nghiệp này?"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteOne}
        confirmText="Xóa"
      />

      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        title="Xác nhận xóa nhiều"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} nghề nghiệp đã chọn?`}
        onCancel={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={handleDeleteMany}
        confirmText="Xóa"
      />

      {/* Create/Edit Modal Dialog */}
      <DialogAny
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#1e293b' }}>
            {editId ? "Chỉnh sửa nghề nghiệp" : "Thêm mới nghề nghiệp"}
          </Typography>
          <IconButton size="small" onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
            <TextFieldAny
              fullWidth
              size="small"
              label="Mã nghề *"
              placeholder="Nhập mã nghề"
              value={form.manghe}
              onChange={(e: any) => handleMaNgheChange(e.target.value)}
              disabled={editId !== null}
              error={!!formErrors.manghe}
              helperText={formErrors.manghe}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": { borderColor: "#dfe3eb" },
                  "&:hover fieldset": { borderColor: "#bcc4d3" },
                  "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                  "&.Mui-disabled fieldset": { borderColor: "#eef0f4" },
                },
              }}
            />

            <TextFieldAny
              fullWidth
              size="small"
              label="Tên nghề nghiệp *"
              placeholder="Nhập tên nghề nghiệp"
              value={form.tennghe}
              onChange={(e: any) => {
                setForm({ ...form, tennghe: e.target.value });
                if (formErrors.tennghe) setFormErrors({ ...formErrors, tennghe: "" });
              }}
              error={!!formErrors.tennghe}
              helperText={formErrors.tennghe}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": { borderColor: "#dfe3eb" },
                  "&:hover fieldset": { borderColor: "#bcc4d3" },
                  "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                },
              }}
            />

            <AutocompleteAny
              size="small"
              options={parentGroup ? [parentGroup] : []}
              getOptionLabel={(option: any) => `${option.manghe} - ${getDashPrefix(option.cap)}${option.tennghe}`}
              value={parentGroup}
              disabled={editId !== null || form.manghe.trim().length <= 1}
              renderInput={(params: any) => (
                <TextFieldAny
                  {...params}
                  label="Nhóm nghề cha"
                  error={parentNotFound}
                  helperText={parentNotFound ? "Không có nhóm nghề cha" : ""}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      "& fieldset": { borderColor: "#dfe3eb" },
                      "&:hover fieldset": { borderColor: "#bcc4d3" },
                      "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                    },
                    "& .MuiFormHelperText-root": {
                      color: "red !important",
                    }
                  }}
                />
              )}
            />

            <TextFieldAny
              fullWidth
              select
              size="small"
              label="Trạng thái *"
              value={form.trangthai}
              onChange={(e: any) => setForm({ ...form, trangthai: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              SelectProps={{
                MenuProps: { PaperProps: { sx: { borderRadius: "8px" } } }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": { borderColor: "#dfe3eb" },
                  "&:hover fieldset": { borderColor: "#bcc4d3" },
                  "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                },
              }}
            >
              <MenuItem value="ACTIVE">Sử dụng</MenuItem>
              <MenuItem value="INACTIVE">Ngưng sử dụng</MenuItem>
            </TextFieldAny>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0', justifyContent: "flex-end", gap: 1.5 }}>
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
      </DialogAny>
    </React.Fragment>
  );
});
