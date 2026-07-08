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

import { injuryTypeService } from "@tts/services";

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

interface InjuryType {
  id: number;
  code: string;
  name: string;
  level: number;
  status: boolean;
}

const getDashPrefix = (level: number): string => {
  if (level === 2) return "—— ";
  if (level === 3) return "——— ";
  if (level === 4) return "———— ";
  return "";
};

const DialogAny = Dialog as any;
const TextFieldAny = TextField as any;
const AutocompleteAny = Autocomplete as any;

export const InjuryTypeView = React.forwardRef((props, ref) => {
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
  const [data, setData] = useState<InjuryType[]>([]);
  const [total, setTotal] = useState(0);

  // Filters State
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 10,
    code: "",
    name: "",
    level: "",
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  // Dialog Add/Edit State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<InjuryType, "id">>({
    code: "",
    name: "",
    level: 1,
    status: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [allInjuryTypes, setAllInjuryTypes] = useState<InjuryType[]>([]);

  const fetchAllInjuryTypes = async () => {
    try {
      const res: any = await injuryTypeService.getAll({ pageSize: 1000 });
      const items = res?.data?.items || res?.items || res?.data?.data || res?.data || [];
      setAllInjuryTypes(items);
    } catch (err) {
      console.error("Error fetching all injury types", err);
    }
  };

  useEffect(() => {
    fetchAllInjuryTypes();
  }, []);

  const handleCodeChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, "").slice(0, 4);
    setForm((prev) => ({
      ...prev,
      code: cleanVal,
      level: cleanVal.length || 1,
    }));
    if (formErrors.code) setFormErrors((prev) => ({ ...prev, code: "" }));
  };

  const parentGroup = useMemo(() => {
    const code = form.code.trim();
    if (code.length <= 1) return null;
    const parentCode = code.slice(0, -1);
    return allInjuryTypes.find((item) => item.code === parentCode) || null;
  }, [form.code, allInjuryTypes]);

  const parentNotFound = useMemo(() => {
    const code = form.code.trim();
    return code.length > 1 && !parentGroup;
  }, [form.code, parentGroup]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        code: filters.code || undefined,
        name: filters.name || undefined,
        level: filters.level || undefined,
      };

      const res: any = await injuryTypeService.getAll(params);
      const items = res?.data?.items || res?.items || res?.data?.data || res?.data || [];
      const totalCount = res?.data?.total || res?.total || res?.data?.count || res?.count || 0;

      setData(items);
      setTotal(totalCount);
    } catch (error) {
      enqueueSnackbar("Lỗi khi tải danh sách loại chấn thương", { variant: "error" });
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
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      code: "",
      name: "",
      level: 1,
      status: true,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: InjuryType) => {
    setEditId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      level: item.level,
      status: item.status,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleDeleteMany = async () => {
    if (selectedIds.length === 0) return;
    try {
      await injuryTypeService.deleteMany(selectedIds.map(Number));
      enqueueSnackbar("Xóa loại chấn thương thành công", { variant: "success" });
      setConfirmBulkDeleteOpen(false);
      setSelectedIds([]);
      fetchList();
      fetchAllInjuryTypes();
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error, "Lỗi khi xóa loại chấn thương"), { variant: "error" });
    }
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    const trimmedCode = form.code.trim();
    const trimmedName = form.name.trim();

    if (!trimmedCode) {
      errors.code = "Mã số không được để trống";
    } else if (trimmedCode.length < 1 || trimmedCode.length > 4) {
      errors.code = "Mã số chỉ được nhập từ 1-4 ký tự";
    } else if (trimmedCode.length > 1 && !parentGroup) {
      errors.code = "Không có nhóm loại chấn thương cha";
    }

    if (!trimmedName) {
      errors.name = "Tên loại chấn thương không được để trống";
    }

    // Local duplicate check
    if (editId === null) {
      const codeExists = allInjuryTypes.some((item) => item.code === trimmedCode);
      if (codeExists) errors.code = "Mã số đã tồn tại";

      const nameExists = allInjuryTypes.some((item) => item.name === trimmedName);
      if (nameExists) errors.name = "Tên loại chấn thương đã tồn tại";
    } else {
      const nameExists = allInjuryTypes.some((item) => item.name === trimmedName && item.id !== editId);
      if (nameExists) errors.name = "Tên loại chấn thương đã tồn tại";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const submitForm = {
        code: trimmedCode,
        name: trimmedName,
        level: form.level,
        status: form.status,
      };

      if (editId !== null) {
        await injuryTypeService.update(editId, submitForm);
        enqueueSnackbar("Cập nhật loại chấn thương thành công", { variant: "success" });
      } else {
        await injuryTypeService.create(submitForm);
        enqueueSnackbar("Thêm mới loại chấn thương thành công", { variant: "success" });
      }
      setDialogOpen(false);
      fetchList();
      fetchAllInjuryTypes();
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error, "Lỗi khi lưu thông tin loại chấn thương"), { variant: "error" });
    } finally {
      setLoading(false);
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
                <TableCell className={classes.headerCell} style={{ width: 150 }}>Mã số</TableCell>
                <TableCell className={classes.headerCell}>Tên loại chấn thương</TableCell>
                <TableCell className={classes.headerCell} align="center" style={{ width: 120 }}>Cấp</TableCell>
                <TableCell className={classes.headerCell} align="center" style={{ width: 80 }}>Thao tác</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className={classes.filterCell} />
                <TableCell className={classes.filterCell}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Lọc mã..."
                    value={filters.code}
                    onChange={(e) => handleFilterChange("code", e.target.value)}
                    className={classes.filterField}
                  />
                </TableCell>
                <TableCell className={classes.filterCell}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Lọc tên..."
                    value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    className={classes.filterField}
                  />
                </TableCell>
                <TableCell className={classes.filterCell}>
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={filters.level}
                    onChange={(e) => handleFilterChange("level", e.target.value)}
                    className={classes.filterField}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="1">Cấp 1</MenuItem>
                    <MenuItem value="2">Cấp 2</MenuItem>
                    <MenuItem value="3">Cấp 3</MenuItem>
                    <MenuItem value="4">Cấp 4</MenuItem>
                  </Select>
                </TableCell>
                <TableCell className={classes.filterCell} />
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
                    Không tìm thấy loại chấn thương nào.
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
                    <TableCell className={classes.bodyCell}>{item.code}</TableCell>
                    <TableCell className={classes.bodyCell}>{getDashPrefix(item.level)}{item.name}</TableCell>
                    <TableCell className={classes.bodyCell} align="center">Cấp {item.level}</TableCell>
                    <TableCell className={classes.bodyCell} align="center">
                      {hasPermission('ADMIN_C_CATEGORY_UPDATE') && (
                        <IconButton className={classes.actionIcon} onClick={() => handleOpenEdit(item)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
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

      {/* Bulk Delete Dialog */}
      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        title="Xác nhận xóa nhiều"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} loại chấn thương đã chọn?`}
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
            {editId ? "Chỉnh sửa loại chấn thương" : "Thêm mới loại chấn thương"}
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
              label="Mã số *"
              placeholder="Nhập mã số"
              value={form.code}
              onChange={(e: any) => handleCodeChange(e.target.value)}
              disabled={editId !== null}
              error={!!formErrors.code}
              helperText={formErrors.code}
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
              label="Tên loại chấn thương *"
              placeholder="Nhập tên loại chấn thương"
              value={form.name}
              onChange={(e: any) => {
                setForm({ ...form, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
              }}
              error={!!formErrors.name}
              helperText={formErrors.name}
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
              getOptionLabel={(option: any) => `${option.code} - ${getDashPrefix(option.level)}${option.name}`}
              value={parentGroup}
              disabled={editId !== null || form.code.trim().length <= 1}
              renderInput={(params: any) => (
                <TextFieldAny
                  {...params}
                  label="Tên loại chấn thương cha"
                  error={parentNotFound}
                  helperText={parentNotFound ? "Không có nhóm loại chấn thương cha" : ""}
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
              value={form.status ? "ACTIVE" : "INACTIVE"}
              onChange={(e: any) => setForm({ ...form, status: e.target.value === "ACTIVE" })}
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

export default InjuryTypeView;
