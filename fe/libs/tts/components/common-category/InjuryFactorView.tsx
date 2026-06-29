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
} from "@mui/icons-material";
import { useSnackbar } from "notistack";

import { ConfirmDialog } from "@core/components/ConfirmDialog";
import { BulkSelectionBar } from "@core/components/BulkSelectionBar";

import { injuryFactorService } from "@tts/services";
import { useStyles } from "@tts/logic/common-category/style";

interface InjuryFactor {
  id: number;
  code: string;
  name: string;
  status: boolean;
}

export const InjuryFactorView = React.forwardRef((props, ref) => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

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
    } catch (err: any) {
      console.error("Error bulk deleting", err);
      enqueueSnackbar(err?.response?.data?.message || "Lỗi khi xóa", { variant: "error" });
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
    } catch (err: any) {
      console.error("Error saving", err);
      enqueueSnackbar("Lỗi khi lưu thông tin", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (item: InjuryFactor) => {
    const nextStatus = !item.status;
    try {
      await injuryFactorService.update(item.id, { ...item, status: nextStatus });
      enqueueSnackbar("Cập nhật trạng thái thành công", { variant: "success" });
      fetchList();
    } catch (err: any) {
      console.error("Error updating status", err);
      enqueueSnackbar("Lỗi khi cập nhật trạng thái", { variant: "error" });
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
      <TableContainer className={classes.tableScroll}>
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
              <TableCell className={classes.headerCell} width={150}>Mã yếu tố</TableCell>
              <TableCell className={classes.headerCell}>Yếu tố gây chấn thương</TableCell>
              <TableCell className={classes.headerCell} width={150} align="center">Trạng thái</TableCell>
            </TableRow>

            <TableRow>
              <TableCell className={classes.filterCell}></TableCell>
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
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: "#94a3b8" }}>
                  Không có dữ liệu
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
                  <TableCell className={classes.bodyCell} sx={{ color: '#333' }}>
                    {item.code}
                  </TableCell>
                  <TableCell className={classes.bodyCell}>{item.name}</TableCell>
                  <TableCell className={classes.bodyCell} align="center">
                    <Switch
                      size="small"
                      checked={item.status}
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
          {startIndex} - {endIndex} of {total}
        </Typography>
        <Pagination
          count={Math.max(1, Math.ceil(total / filters.limit))}
          page={filters.page}
          onChange={(_, p) => handleFilterChange("page", p)}
          shape="rounded"
          size="small"
          siblingCount={0}
          boundaryCount={1}
        />
      </Box>

      {selectedIds.length > 0 && (
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#333",
          }}
        >
          {editId ? "Cập nhật" : "Thêm mới"}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ color: "#94a3b8" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, borderColor: "#eef0f4" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#94a3b8", mb: 0.5 }}>
                Mã yếu tố chấn thương <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Mã yếu tố"
                value={form.code}
                onChange={(e) => {
                  setForm({ ...form, code: e.target.value });
                  if (formErrors.code) setFormErrors({ ...formErrors, code: "" });
                }}
                error={!!formErrors.code}
                helperText={formErrors.code}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#94a3b8", mb: 0.5 }}>
                Tên yếu tố chấn thương <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Tên yếu tố"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                }}
                error={!!formErrors.name}
                helperText={formErrors.name}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#94a3b8", mb: 0.5 }}>
                Trạng thái <span style={{ color: "red" }}>*</span>
              </Typography>
              <Select
                fullWidth
                size="small"
                value={form.status ? "true" : "false"}
                onChange={(e) => setForm({ ...form, status: e.target.value === "true" })}
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="true">Sử dụng</MenuItem>
                <MenuItem value="false">Không sử dụng</MenuItem>
              </Select>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ color: "#5a6478", textTransform: "none" }}>
            Huỷ
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            variant="contained"
            sx={{
              backgroundColor: "#2f65f0",
              color: "#fff",
              textTransform: "none",
              px: 3,
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
